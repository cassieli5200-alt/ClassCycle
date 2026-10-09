import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, getDoc, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}
const deviceId = getDeviceId();

// Stops user-typed text from being run as HTML code
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const locationLabels = {
  glencoe: "Glencoe", winnetka: "Winnetka", wilmette: "Wilmette", evanston: "Evanston",
  "highland park": "Highland Park", northfield: "Northfield", kenilworth: "Kenilworth",
  deerfield: "Deerfield", skokie: "Skokie", other: "Nearby village"
};
const categoryLabels = {
  math: "Math", science: "Science", history: "History",
  english: "English", "general supplies": "General Supplies"
};

const grid = document.getElementById('requests-grid');
const formWrap = document.getElementById('request-form-wrap');
const toggleBtn = document.getElementById('request-toggle');
const statusEl = document.getElementById('request-status');

let allRequests = [];

// ===== Show / hide the post form =====
toggleBtn.addEventListener('click', () => {
  const isHidden = formWrap.style.display === 'none';
  formWrap.style.display = isHidden ? 'block' : 'none';
  toggleBtn.classList.toggle('open', isHidden);
});

// ===== Load + show requests =====
async function loadRequests() {
  try {
    const snapshot = await getDocs(collection(db, "requests"));
    allRequests = [];
    snapshot.forEach((d) => allRequests.push({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="wishlist-empty">Could not load requests. Check your Firestore rules.</p>';
    return;
  }
  renderRequests();
}

function renderRequests() {
  const open = allRequests
    .filter(r => r.status === 'open')
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  grid.innerHTML = '';

  if (open.length === 0) {
    grid.innerHTML = '<p class="wishlist-empty">No open requests right now. Be the first to post one!</p>';
    return;
  }

  open.forEach((r) => {
    const mine = r.requesterId === deviceId;
    const card = document.createElement('div');
    card.className = 'request-card';
    card.dataset.id = r.id;

    card.innerHTML = `
      <span class="request-tag">${categoryLabels[r.category] || 'Any subject'}</span>
      <h3>${escapeHtml(r.title)}</h3>
      ${r.description ? `<p class="description">${escapeHtml(r.description)}</p>` : ''}
      <p class="budget">${r.maxPrice != null ? 'Budget: up to $' + r.maxPrice : 'Budget: flexible'}</p>
      <p class="meta">📍 ${locationLabels[r.location] || escapeHtml(r.location || '')}</p>
      <p class="meta">Requested by ${escapeHtml(r.requesterName)}</p>
      ${mine
        ? '<button class="found-btn">Mark as found</button>'
        : '<button class="have-btn">I have this</button>'}
    `;
    grid.appendChild(card);
  });
}

// ===== Post a new request =====
document.getElementById('request-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const budgetRaw = document.getElementById('r-budget').value;

  try {
    await addDoc(collection(db, "requests"), {
      title: document.getElementById('r-title').value.trim(),
      description: document.getElementById('r-description').value.trim() || null,
      maxPrice: budgetRaw ? parseFloat(budgetRaw) : null,
      category: document.getElementById('r-category').value || null,
      location: document.getElementById('r-location').value,
      requesterName: document.getElementById('r-name').value.trim(),
      requesterId: deviceId,
      status: 'open',
      createdAt: new Date()
    });
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Could not post your request. Please try again.';
    return;
  }

  e.target.reset();
  statusEl.textContent = '';
  formWrap.style.display = 'none';
  toggleBtn.classList.remove('open');
  loadRequests();
});

// ===== "I have this" and "Mark as found" =====
grid.addEventListener('click', async (e) => {
  const card = e.target.closest('.request-card');
  if (!card) return;
  const request = allRequests.find(r => r.id === card.dataset.id);
  if (!request) return;

  if (e.target.closest('.found-btn')) {
    await updateDoc(doc(db, "requests", request.id), { status: 'fulfilled' });
    request.status = 'fulfilled';
    renderRequests();
  }

  if (e.target.closest('.have-btn')) {
    const helperName = prompt('Your first name (the requester will see this):');
    if (!helperName || !helperName.trim()) return;

    const priceInput = prompt('What price would you like to ask? (Enter 0 if you are giving it away)');
    if (priceInput === null || priceInput.trim() === '' || isNaN(priceInput) || parseFloat(priceInput) < 0) return;
    const price = parseFloat(priceInput);

    // The requester is the "buyer" so the chat appears in THEIR Messages
    const convoId = `${request.id}_${deviceId}`;
    const convoRef = doc(db, "conversations", convoId);
    const existing = await getDoc(convoRef);

    if (!existing.exists()) {
      await setDoc(convoRef, {
        listingId: request.id,
        listingTitle: `Wanted: ${request.title}`,
        sellerName: helperName.trim(),
        sellerId: deviceId,
        buyerId: request.requesterId,
        kind: 'wanted',
        updatedAt: new Date()
      });

      await addDoc(collection(db, "conversations", convoId, "messages"), {
        sender: 'seller',
        text: price === 0
          ? `Hi ${request.requesterName}, I have this and I'm happy to give it to you for free.`
          : `Hi ${request.requesterName}, I have this! I'd ask $${price}.`,
        type: 'text',
        timestamp: new Date()
      });
    }

    window.location.href = `messages.html?convo=${convoId}`;
  }
});

loadRequests();