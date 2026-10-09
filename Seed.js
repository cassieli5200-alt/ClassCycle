import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const sampleListings = [
  { title: "Campbell Biology 11th Edition", price: 25, condition: "Good", category: "science", subcategory: "biology", seller: "Jane D.", contactInfo: "janed@email.com", imageUrl: "https://covers.openlibrary.org/b/isbn/9780134093413-L.jpg", likes: 3 },
  { title: "Give Me Liberty! - AP US History", price: 20, condition: "Fair", category: "history", subcategory: "us history", seller: "Priya K.", contactInfo: "priyak@email.com", imageUrl: "https://covers.openlibrary.org/b/isbn/9780393919554-L.jpg", likes: 5 },
  { title: "Algebra 2 Textbook", price: 15, condition: "Like New", category: "math", subcategory: "algebra", seller: "Marcus T.", contactInfo: "marcust@email.com", imageUrl: "https://placehold.co/300x400/4A6741/F7F3E9?font=lora&text=Algebra+2", likes: 1 },
  { title: "AP Chemistry Prep Book", price: 18, condition: "Good", category: "science", subcategory: "chemistry", seller: "Sam L.", contactInfo: "saml@email.com", imageUrl: "https://placehold.co/300x400/2B3A42/F7F3E9?font=lora&text=AP+Chemistry", likes: 2 },
  { title: "Geometry Textbook", price: 12, condition: "Fair", category: "math", subcategory: "geometry", seller: "Ava R.", contactInfo: "avar@email.com", imageUrl: "https://placehold.co/300x400/4A6741/F7F3E9?font=lora&text=Geometry", likes: 0 },
  { title: "To Kill a Mockingbird - Class Set", price: 8, condition: "Good", category: "english", subcategory: "literature", seller: "Ben K.", contactInfo: "benk@email.com", imageUrl: "https://placehold.co/300x400/C68B3D/2B3A42?font=lora&text=To+Kill+a+Mockingbird", likes: 4 },
  { title: "Spiral Notebooks (Pack of 5)", price: 5, condition: "New", category: "general supplies", subcategory: "notebooks", seller: "Zoe H.", contactInfo: "zoeh@email.com", imageUrl: "https://placehold.co/300x400/B5533C/F7F3E9?font=lora&text=Notebooks", likes: 6 },
  { title: "TI-84 Plus Calculator", price: 40, condition: "Good", category: "math", subcategory: "calculators", seller: "Liam P.", contactInfo: "liamp@email.com", imageUrl: "https://placehold.co/300x400/2B3A42/F7F3E9?font=lora&text=TI-84+Calculator", likes: 9 },
  { title: "Backpack - Barely Used", price: 15, condition: "Like New", category: "general supplies", subcategory: "backpacks", seller: "Nora S.", contactInfo: "noras@email.com", imageUrl: "https://placehold.co/300x400/B5533C/F7F3E9?font=lora&text=Backpack", likes: 2 },
  { title: "AP World History Review Book", price: 10, condition: "Fair", category: "history", subcategory: "world history", seller: "Ethan M.", contactInfo: "ethanm@email.com", imageUrl: "https://placehold.co/300x400/C68B3D/2B3A42?font=lora&text=AP+World+History", likes: 1 }
];

async function seedListings() {
  for (const listing of sampleListings) {
    await addDoc(collection(db, "listings"), listing);
    console.log(`Added: ${listing.title}`);
  }
  console.log("Done seeding!");
}

seedListings();