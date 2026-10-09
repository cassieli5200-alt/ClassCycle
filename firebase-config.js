// Import Firebase from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyCMPiHwLeojcQWkpd8RGLV3yDHToaweSKI",
  authDomain: "textbook-swap-7a898.firebaseapp.com",
  projectId: "textbook-swap-7a898",
  storageBucket: "textbook-swap-7a898.firebasestorage.app",
  messagingSenderId: "761288235168",
  appId: "1:761288235168:web:ffd7a0e553ea587b33d1c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };