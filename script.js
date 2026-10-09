import { db } from './firebase-config.js';
import { collection, doc, updateDoc, increment, getDocs, setDoc, deleteDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const listingsGrid = document.querySelector('.listings-grid');
const locationLabels = {
  glencoe: "Glencoe",
  winnetka: "Winnetka",
  wilmette: "Wilmette",
  evanston: "Evanston",
  "highland park": "Highland Park",
  northfield: "Northfield",
  kenilworth: "Kenilworth",
  deerfield: "Deerfield",
  skokie: "Skokie",
  other: "Nearby village"
};

// ===== DEVICE ID (temporary stand-in for user accounts) =====
function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}
const deviceId = getDeviceId();

async function getOrCreateConversation(listingId, listingTitle, sellerName) {
  const convoId = `${listingId}_${deviceId}`;
  const convoRef = doc(db, "conversations", convoId);
  await setDoc(convoRef, {
    listingId, listingTitle, sellerName,
    buyerId: deviceId,
    updatedAt: new Date()
  }, { merge: true });
  return convoId;
}

async function addMessage(convoId, messageData) {
  const messagesRef = collection(db, "conversations", convoId, "messages");
  await addDoc(messagesRef, { ...messageData, timestamp: new Date() });
}

listingsGrid.addEventListener('click', async (e) => {
  const card = e.target.closest('.listing-card');
  if (!card) return;
  const listingId = card.dataset.id;
  const listingTitle = card.querySelector('h3').textContent;
  const sellerName = card.querySelector('.seller').textContent.replace('Seller: ', '');
  const price = card.querySelector('.price').textContent.replace('$', '');

  if (e.target.closest('.message-btn')) {
    const convoId = await getOrCreateConversation(listingId, listingTitle, sellerName);
    window.location.href = `messages.html?convo=${convoId}`;
  }

  if (e.target.closest('.buy-btn')) {
    const convoId = await getOrCreateConversation(listingId, listingTitle, sellerName);
    await addMessage(convoId, {
      sender: 'buyer',
      text: `Hi, I would like to buy this for $${price}`,
      type: 'offer', amount: parseFloat(price), status: 'pending'
    });
    window.location.href = `messages.html?convo=${convoId}`;
  }

  if (e.target.closest('.offer-btn')) {
    const customAmount = prompt(`What amount would you like to offer for "${listingTitle}"?`);
    if (!customAmount || isNaN(customAmount)) return;
    const convoId = await getOrCreateConversation(listingId, listingTitle, sellerName);
    await addMessage(convoId, {
      sender: 'buyer',
      text: `Hi, I'd like to offer $${customAmount} for this.`,
      type: 'offer', amount: parseFloat(customAmount), status: 'pending'
    });
    window.location.href = `messages.html?convo=${convoId}`;
  }
});

// ===== LOAD LISTINGS FROM FIREBASE =====

const searchInput = document.getElementById('search-input');

let allListings = [];
let currentCategory = 'all';
let currentSubcategory = null;
let currentLocation = 'all';

const subcategoryMap = {
  math: [
    { value: 'algebra', label: 'Algebra' },
    { value: 'geometry', label: 'Geometry' },
    { value: 'calculus', label: 'Calculus' },
    { value: 'statistics', label: 'Statistics' },
    { value: 'trigonometry', label: 'Trigonometry' },
    { value: 'calculators', label: 'Calculators' }
  ],
  science: [
    { value: 'biology', label: 'Biology' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'physics', label: 'Physics' },
    { value: 'environmental', label: 'Environmental Science' },
    { value: 'anatomy', label: 'Anatomy & Physiology' }
  ],
  history: [
    { value: 'american', label: 'American History' },
    { value: 'european', label: 'European History' },
    { value: 'world', label: 'World History' },
    { value: 'government', label: 'Government & Civics' },
    { value: 'economics', label: 'Economics' }
  ],
  english: [
    { value: 'literature', label: 'Literature' },
    { value: 'grammar', label: 'Grammar & Writing' },
    { value: 'vocabulary', label: 'Vocabulary' },
    { value: 'testprep', label: 'Test Prep (SAT/ACT)' },
    { value: 'poetry', label: 'Poetry' }
  ],
  'general supplies': [
    { value: 'notebooks', label: 'Notebooks & Paper' },
    { value: 'writing', label: 'Pens & Pencils' },
    { value: 'binders', label: 'Binders & Folders' },
    { value: 'backpacks', label: 'Backpacks & Bags' },
    { value: 'calculators', label: 'Calculators' },
    { value: 'art', label: 'Art Supplies' },
    { value: 'highlighters', label: 'Highlighters & Markers' },
    { value: 'planners', label: 'Planners & Agendas' },
    { value: 'lab', label: 'Lab Equipment' },
    { value: 'tech', label: 'Tech Accessories' },
    { value: 'storage', label: 'Lockers & Storage' },
    { value: 'misc', label: 'Miscellaneous' }
  ]
};

async function loadListings() {
  const querySnapshot = await getDocs(collection(db, "listings"));
  allListings = [];
  querySnapshot.forEach((docSnap) => {
    allListings.push({ id: docSnap.id, ...docSnap.data() });
  });
  renderListings();
}

function renderSubcategoryBar(category) {
  const bar = document.getElementById('subcategory-bar');
  bar.innerHTML = '';

  if (category === 'all' || !subcategoryMap[category]) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';

  const allBtn = document.createElement('button');
  allBtn.className = 'subcategory-btn active';
  allBtn.textContent = 'All ' + category;
  allBtn.addEventListener('click', () => {
    document.querySelectorAll('.subcategory-btn').forEach(b => b.classList.remove('active'));
    allBtn.classList.add('active');
    currentSubcategory = null;
    renderListings();
  });
  bar.appendChild(allBtn);

  subcategoryMap[category].forEach(sub => {
    const btn = document.createElement('button');
    btn.className = 'subcategory-btn';
    btn.textContent = sub.label;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subcategory-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSubcategory = sub.value;
      renderListings();
    });
    bar.appendChild(btn);
  });
}

function renderListings() {
  const searchTerm = searchInput.value.toLowerCase();
  const priceMinInput = document.getElementById('price-min').value;
  const priceMaxInput = document.getElementById('price-max').value;
  const priceMin = priceMinInput ? parseFloat(priceMinInput) : 0;
  const priceMax = priceMaxInput ? parseFloat(priceMaxInput) : Infinity;

  const filtered = allListings.filter(listing => {
    const categories = listing.categories || (listing.category ? [listing.category] : []);
    const subcategories = listing.subcategories || (listing.subcategory ? [listing.subcategory] : []);

    const matchesCategory = currentCategory === 'all' || categories.includes(currentCategory);
    const matchesSubcategory = !currentSubcategory || subcategories.includes(currentSubcategory);
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm);
    const price = listing.price || 0;
    const matchesPrice = price >= priceMin && price <= priceMax;
    const matchesLocation = currentLocation === 'all' || listing.location === currentLocation;

    return matchesCategory && matchesSubcategory && matchesSearch && matchesPrice && matchesLocation;
  });

  listingsGrid.innerHTML = '';

  if (filtered.length === 0) {
    listingsGrid.innerHTML = '<p class="wishlist-empty">No listings match your filters yet.</p>';
    return;
  }

  filtered.forEach((listing) => {
    const card = document.createElement('div');
    card.classList.add('listing-card');
    card.dataset.id = listing.id;

    card.innerHTML = `
      <img src="${listing.imageUrl}" alt="${listing.title}">
      <h3>${listing.title}</h3>
      <p class="price">$${listing.price}</p>
      <p class="condition">Condition: ${listing.condition}</p>
      <p class="seller">Seller: ${listing.seller}</p>
      <p class="contact">Contact: ${listing.contactInfo}</p>
      <p class="location"> ${locationLabels[listing.location] || listing.location || 'Location not set'}${listing.shippingAvailable ? ' · Shipping available' : ' · Pickup only'}</p>
      ${listing.description ? `<p class="description">${listing.description}</p>` : ''}
      <div class="card-actions">
        <button class="like-btn">❤️ <span class="like-count">${listing.likes}</span></button>
        <button class="wishlist-btn">🔖 Save</button>
      </div>
      <button class="message-btn">Message Seller</button>
      <button class="buy-btn">Buy Now</button>
      <button class="offer-btn">Make Offer</button>
    `;

    listingsGrid.appendChild(card);
  });
}

loadListings();

// ===== TOP-LEVEL CATEGORY BUTTONS =====
const categoryButtons = document.querySelectorAll('#category-bar .category-btn');
categoryButtons.forEach(button => {
  button.addEventListener('click', () => {
    categoryButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentCategory = button.dataset.category;
    currentSubcategory = null;
    renderSubcategoryBar(currentCategory);
    renderListings();
  });
});

searchInput.addEventListener('input', renderListings);
document.getElementById('price-min').addEventListener('input', renderListings);
document.getElementById('price-max').addEventListener('input', renderListings);

// ===== LOCATION FILTER BUTTONS =====
const locationButtons = document.querySelectorAll('.location-btn');
locationButtons.forEach(button => {
  button.addEventListener('click', () => {
    locationButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentLocation = button.dataset.location;
    renderListings();
  });
});

// ===== LOCATION FILTER TOGGLE (show/hide) =====
const locationToggle = document.getElementById('location-toggle');
const locationBar = document.getElementById('location-bar');

locationToggle.addEventListener('click', () => {
  const isHidden = locationBar.style.display === 'none';
  locationBar.style.display = isHidden ? 'flex' : 'none';
  locationToggle.classList.toggle('open', isHidden);
});

// ===== LIKE BUTTON =====
listingsGrid.addEventListener('click', async (e) => {
  if (e.target.closest('.like-btn')) {
    const button = e.target.closest('.like-btn');
    const card = button.closest('.listing-card');
    const listingId = card.dataset.id;
    const countSpan = button.querySelector('.like-count');

    const isLiked = button.classList.contains('liked');
    const change = isLiked ? -1 : 1;

    const listingRef = doc(db, "listings", listingId);
    await updateDoc(listingRef, {
      likes: increment(change)
    });

    let count = parseInt(countSpan.textContent);
    countSpan.textContent = count + change;
    button.classList.toggle('liked');
  }
});

// ===== WISHLIST BUTTON (saved to Firestore) =====
listingsGrid.addEventListener('click', async (e) => {
  if (e.target.closest('.wishlist-btn')) {
    const button = e.target.closest('.wishlist-btn');
    const card = button.closest('.listing-card');
    const listingId = card.dataset.id;

    const wishlistDocId = `${deviceId}_${listingId}`;
    const wishlistRef = doc(db, "wishlist", wishlistDocId);

    if (button.classList.contains('saved')) {
      await deleteDoc(wishlistRef);
      button.textContent = '🔖 Save';
      button.classList.remove('saved');
    } else {
      await setDoc(wishlistRef, {
        deviceId: deviceId,
        listingId: listingId,
        title: card.querySelector('h3').textContent,
        price: card.querySelector('.price').textContent,
        imageUrl: card.querySelector('img').src,
        savedAt: new Date()
      });
      button.textContent = '✅ Saved';
      button.classList.add('saved');
    }
  }
});