"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, signInWithGoogle, logout } from "../app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Image from "next/image"; 

export default function AuthButton() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setChecking(false);

      if (user) {
        setRedirecting(true);
        router.push("/home");
      } else {
        setRedirecting(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (redirecting) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white z-50">

        <div className="relative w-20 h-20 mb-4 animate-pulse">
          <Image
            src="/twitter-x-logo-white (3).svg"
            alt="Logo X"
            fill
            className="object-contain"
            priority
          />
        </div>

        <svg
          className="animate-spin h-8 w-8 text-blue-500 mb-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <p className="text-gray-400">Verificando sesión....</p>
      </div>
    );
  }

  return (
    <div className="btn-auth w-full flex-shrink-0">
      {user ? (
        <>
          <p className="iniciodeseccion">Hola, {user.displayName}</p>
          <button className="btn-auth" onClick={logout}>
            Cerrar sesión
          </button>
        </>
      ) : (
        <button
          onClick={async () => {
            try {
              await signInWithGoogle();
            } catch (error) {
              console.error("Login cancelado o error:", error.code);
              setRedirecting(false);
            }
          }}
        >
          Iniciar sesión con Google
        </button>
      )}
    </div>
  );
}

