import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBUP71EkBld-b9meTyn4l-XZ_lMC4FKq7g",
  authDomain: "todolist-f44bf.firebaseapp.com",
  projectId: "todolist-f44bf",
  storageBucket: "todolist-f44bf.firebasestorage.app",
  messagingSenderId: "459292072015",
  appId: "1:459292072015:web:4bf8010dd285974a09b23a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;