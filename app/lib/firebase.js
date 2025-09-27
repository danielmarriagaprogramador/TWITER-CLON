// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAhU0BGGLZqYsH3vRpHu6vlLBw_bp8gD28",
  authDomain: "reactfirebase1-6f57c.firebaseapp.com",
  projectId: "reactfirebase1-6f57c",
  storageBucket: "reactfirebase1-6f57c.firebasestorage.app",
  messagingSenderId: "443804999184",
  appId: "1:443804999184:web:adb31c337248524d693495",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // 👈 Aquí está el auth
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app); // 👈 AÑADIDO

export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);

