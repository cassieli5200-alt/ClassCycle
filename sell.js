import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

// Shrinks a photo in the browser and returns it as a small JPEG data URL
function compressImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That photo format isn't supported. Please use a JPG or PNG."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // so transparent PNGs don't turn black
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Firestore documents max out at 1 MB, so keep trying smaller until it fits
async function prepareImage(file) {
  const attempts = [[800, 0.7], [600, 0.6], [400, 0.5]];
  for (const [size, quality] of attempts) {
    const dataUrl = await compressImage(file, size, quality);
    if (dataUrl.length < 700000) return dataUrl;
  }
  throw new Error('That photo is too large. Please try a smaller one.');
}

const form = document.getElementById('sell-form');
const statusEl = document.getElementById('sell-status');
const fileInput = document.getElementById('f-image');
const preview = document.getElementById('image-preview');
const submitBtn = form.querySelector('button[type="submit"]');

function showStatus(message) {
  statusEl.textContent = message;
  statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) {
    preview.style.display = 'none';
    return;
  }
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = '';

  const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
  const subcategories = Array.from(document.querySelectorAll('input[name="subcategory"]:checked')).map(cb => cb.value);

  if (categories.length === 0) {
    showStatus('Please pick at least one category.');
    return;
  }

  const file = fileInput.files[0];
  if (!file) {
    showStatus('Please choose a photo.');
    return;
  }

  submitBtn.disabled = true;
  showStatus('Preparing your photo...');

  try {
    const imageUrl = await prepareImage(file);
    showStatus('Posting your listing...');

    const listing = {
      title: document.getElementById('f-title').value.trim(),
      price: parseFloat(document.getElementById('f-price').value),
      condition: document.getElementById('f-condition').value,
      categories: categories,
      subcategories: subcategories,
      seller: document.getElementById('f-seller').value.trim(),
      sellerId: getDeviceId(),
      contactInfo: document.getElementById('f-contact').value.trim(),
      description: document.getElementById('f-description').value.trim() || null,
      location: document.getElementById('f-location').value,
      shippingAvailable: document.getElementById('f-shipping').checked,
      imageUrl: imageUrl,
      likes: 0
    };

    await addDoc(collection(db, "listings"), listing);

    showStatus('Listing posted! Redirecting...');
    setTimeout(() => window.location.href = 'index.html', 1000);
  } catch (err) {
    console.error(err);
    showStatus(err.message || 'Something went wrong. Please try again.');
    submitBtn.disabled = false;
  }
});