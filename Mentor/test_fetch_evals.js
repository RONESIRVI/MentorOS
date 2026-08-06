const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB0T0bh7b7WpaGYyBk81MrqfRn2AUkXjfg",
  authDomain: "mains-rone-cse-e5268.firebaseapp.com",
  projectId: "mains-rone-cse-e5268",
  storageBucket: "mains-rone-cse-e5268.firebasestorage.app",
  messagingSenderId: "275537569597",
  appId: "1:275537569597:web:e8e4ad1dc25e7b9744c754"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const snap = await getDocs(collection(db, 'evaluations'));
  snap.forEach(d => {
    const ev = d.data();
    console.log('Title:', ev.title, 'Status:', ev.status, 'Marks:', ev.marks);
  });
  process.exit(0);
}
run();
