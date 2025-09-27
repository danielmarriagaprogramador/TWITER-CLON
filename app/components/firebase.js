import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAhU0BGGLZqYsH3vRpHu6vlLBw_bp8gD28",
  authDomain: "reactfirebase1-6f57c.firebaseapp.com",
  projectId: "reactfirebase1-6f57c",
  storageBucket: "reactfirebase1-6f57c.firebasestorage.app",
  messagingSenderId: "443804999184",
  appId: "1:443804999184:web:adb31c337248524d693495"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };