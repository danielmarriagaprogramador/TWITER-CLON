"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("myUser");
    if (stored) {
      setUser(JSON.parse(stored));
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

      
        try {
          await setDoc(
            doc(db, "users", firebaseUser.uid),
            {
              uid: firebaseUser.uid,
              email: firebaseUser.email || null,
              displayName: firebaseUser.displayName || "Usuario",
              photoURL: firebaseUser.photoURL || null,
              provider: firebaseUser.providerData[0]?.providerId || "unknown",
              createdAt: new Date(),
            },
            { merge: true }
          );
        } catch (err) {
          console.error("Error guardando usuario en Firestore:", err);
        }

        localStorage.removeItem("myUser");
      } else {
        if (!stored) setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (userData) => {
    setUser(userData);
    if (!userData.uid) {
      localStorage.setItem("myUser", JSON.stringify(userData));
    } else {
      localStorage.removeItem("myUser");
    }
    router.push("/home");
  };

  const logout = async () => {
    setLoggingOut(true);
    localStorage.removeItem("myUser");
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
    setUser(null);
    router.push("/");
    setLoggingOut(false);
  };

  if (loading || loggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        Cargando…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

