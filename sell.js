import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.getElementById('sell-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
  const subcategories = Array.from(document.querySelectorAll('input[name="subcategory"]:checked')).map(cb => cb.value);

  const listing = {
    title: document.getElementById('f-title').value,
    price: parseFloat(document.getElementById('f-price').value),
    condition: document.getElementById('f-condition').value,
    categories: categories,
    subcategories: subcategories,
    seller: document.getElementById('f-seller').value,
    contactInfo: document.getElementById('f-contact').value,
    description: document.getElementById('f-description').value || null,
    location: document.getElementById('f-location').value,
    shippingAvailable: document.getElementById('f-shipping').checked,
    imageUrl: document.getElementById('f-image').value,
    likes: 0
  };

  await addDoc(collection(db, "listings"), listing);

  document.getElementById('sell-status').textContent = 'Listing posted! Redirecting...';
  setTimeout(() => window.location.href = 'index.html', 1000);
});