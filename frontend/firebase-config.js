
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkS5VVD3oDTatfSYGSqrbT9OXwVCL8qAE",
  authDomain: "jenie-52071.firebaseapp.com",
  projectId: "jenie-52071",
  storageBucket: "jenie-52071.firebasestorage.app",
  messagingSenderId: "150028441950",
  appId: "1:150028441950:web:b653e56e7884f5694d17cf",
  measurementId: "G-NT21WD9QNY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
