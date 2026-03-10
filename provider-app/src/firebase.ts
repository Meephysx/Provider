import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAf2ElszkTMuo4yzJAcs82OB4iB3qUjIRw",
  authDomain: "provider-monitoring.firebaseapp.com",
  projectId: "provider-monitoring",
  storageBucket: "provider-monitoring.firebasestorage.app",
  messagingSenderId: "130664480416",
  appId: "1:130664480416:web:378874d7b5f3df2c28d3c5"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);