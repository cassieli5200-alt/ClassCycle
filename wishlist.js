import { db } from './firebase-config.js';
import { collection, getDocs, query, where, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}
const deviceId = getDeviceId();

const wishlistGrid = document.getElementById('wishlist-grid');

async function loadWishlist() {
  wishlistGrid.innerHTML = '';

  const q = query(collection(db, "wishlist"), where("deviceId", "==", deviceId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    wishlistGrid.innerHTML = '<p class="wishlist-empty">Nothing saved yet — browse the homepage and hit Save on a book you like.</p>';
    return;
  }

  querySnapshot.forEach((docSnap) => {
    const item = docSnap.data();

    const card = document.createElement('div');
    card.classList.add('listing-card');

    card.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p class="price">${item.price}</p>
      <button class="remove-btn">Remove</button>
    `;

    card.querySelector('.remove-btn').addEventListener('click', async () => {
      await deleteDoc(doc(db, "wishlist", docSnap.id));
      loadWishlist(); // refresh the list after removing
    });

    wishlistGrid.appendChild(card);
  });
}

loadWishlist();