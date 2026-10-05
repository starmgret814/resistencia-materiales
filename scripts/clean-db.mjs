import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyBuHiDaNFsryCyFDjqUtdymTYH93oqltg0",
  authDomain: "resistencia-materiales.firebaseapp.com",
  projectId: "resistencia-materiales",
  storageBucket: "resistencia-materiales.firebasestorage.app",
  messagingSenderId: "721587919055",
  appId: "1:721587919055:web:c6bf064ea1a84ab8bc3fba",
  measurementId: "G-1WN89EY4V4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clean() {
  console.log("Checking Firestore collections...");

  // 1. Preserve users
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Preserving ${usersSnap.size} users.`);

  // 2. Clear drafts
  const draftsSnap = await getDocs(collection(db, 'drafts'));
  console.log(`Found ${draftsSnap.size} drafts. Deleting...`);
  for (const d of draftsSnap.docs) {
    await deleteDoc(d.ref);
    console.log(`Deleted draft: ${d.id}`);
  }

  // 3. Clear requests
  const requestsSnap = await getDocs(collection(db, 'requests'));
  console.log(`Found ${requestsSnap.size} requests. Deleting...`);
  for (const r of requestsSnap.docs) {
    await deleteDoc(r.ref);
    console.log(`Deleted request: ${r.id}`);
  }

  // 4. Reset course/chapters to the clean chapters.json
  const rawChapters = fs.readFileSync('lib/chapters.json', 'utf8');
  const cleanChapters = JSON.parse(rawChapters);
  await setDoc(doc(db, 'course', 'chapters'), {
    list: cleanChapters,
    updatedAt: new Date().toISOString()
  });
  console.log("Reset course/chapters in Firestore.");

  console.log("Database reset complete!");
  process.exit(0);
}

clean().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
