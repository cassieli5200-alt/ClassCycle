import { db } from './firebase-config.js';
import { collection, doc, getDocs, getDoc, addDoc, query, where, orderBy, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}
const deviceId = getDeviceId();

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const params = new URLSearchParams(window.location.search);
const convoId = params.get('convo');
const listView = document.getElementById('convo-list-view');
const threadView = document.getElementById('thread-view');

let myRole = 'buyer'; // set properly once a conversation loads

if (convoId) { showThread(convoId); } else { showConversationList(); }

async function showConversationList() {
  listView.style.display = 'block';
  threadView.style.display = 'none';
  const listEl = document.getElementById('conversation-list');
  listEl.innerHTML = 'Loading...';

  // Chats where I'm the buyer OR the seller (wanted-board replies)
  const [asBuyer, asSeller] = await Promise.all([
    getDocs(query(collection(db, "conversations"), where("buyerId", "==", deviceId))),
    getDocs(query(collection(db, "conversations"), where("sellerId", "==", deviceId)))
  ]);

  const convos = new Map();
  [asBuyer, asSeller].forEach(snap => snap.forEach(d => convos.set(d.id, d.data())));

  if (convos.size === 0) {
    listEl.innerHTML = '<p class="wishlist-empty">No conversations yet.</p>';
    return;
  }

  listEl.innerHTML = '';
  convos.forEach((convo, id) => {
    const item = document.createElement('a');
    item.href = `messages.html?convo=${id}`;
    item.classList.add('conversation-item');
    const label = convo.kind === 'wanted' ? 'Helper' : 'Seller';
    item.innerHTML = `<strong>${escapeHtml(convo.listingTitle)}</strong><span>${label}: ${escapeHtml(convo.sellerName)}</span>`;
    listEl.appendChild(item);
  });
}

async function showThread(id) {
  listView.style.display = 'none';
  threadView.style.display = 'block';

  const convoSnap = await getDoc(doc(db, "conversations", id));
  if (!convoSnap.exists()) return;
  const convo = convoSnap.data();

  myRole = convo.buyerId === deviceId ? 'buyer' : 'seller';
  const label = convo.kind === 'wanted' ? 'Helper' : 'Seller';
  document.getElementById('thread-title').textContent = `${convo.listingTitle} — ${label}: ${convo.sellerName}`;

  const q = query(collection(db, "conversations", id, "messages"), orderBy("timestamp", "asc"));

  onSnapshot(q, (snapshot) => {
    const threadEl = document.getElementById('messages-thread');
    threadEl.innerHTML = '';
    snapshot.forEach((msgSnap) => {
      const msg = msgSnap.data();
      const bubble = document.createElement('div');
      // my messages on the right, theirs on the left
      bubble.classList.add('message-bubble', msg.sender === myRole ? 'buyer-msg' : 'seller-msg');
      let content = `<p>${escapeHtml(msg.text)}</p>`;
      if (msg.type === 'offer') {
        content += `<span class="offer-status">Status: ${escapeHtml(msg.status)}</span>`;
        if (msg.status === 'pending' && myRole === 'seller') {
          content += `<button class="accept-offer-btn" data-msgid="${msgSnap.id}">Accept Offer</button>`;
        }
      }
      bubble.innerHTML = content;
      threadEl.appendChild(bubble);
    });
    threadEl.querySelectorAll('.accept-offer-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await updateDoc(doc(db, "conversations", id, "messages", btn.dataset.msgid), { status: 'accepted' });
      });
    });
  });

  document.getElementById('send-btn').onclick = () => sendMessage(id);
  document.getElementById('message-input').onkeypress = (e) => { if (e.key === 'Enter') sendMessage(id); };
}

async function sendMessage(id) {
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;
  await addDoc(collection(db, "conversations", id, "messages"), {
    sender: myRole, text, type: 'text', timestamp: new Date()
  })