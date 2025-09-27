
"use client";
import { useState } from "react";
import { auth, signInWithGoogle, db } from "../app/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDocs, query, collection, where } from "firebase/firestore";
import { useAuth } from "../app/context/AuthContext"; 
import Image from "next/image";

export default function LoginModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [useEmail, setUseEmail] = useState(true);

  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (useEmail) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          contact,
          password
        );
        login(userCredential.user);
        setIsOpen(false);
        setContact("");
        setPassword("");
      } else {
        const q = query(
          collection(db, "users"),
          where("contact", "==", contact),
          where("type", "==", "phone")
        );
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("No existe ese usuario con ese teléfono");

        const docSnap = snap.docs[0];
        const userData = { id: docSnap.id, ...docSnap.data() };

        login(userData);
        setIsOpen(false);
        setContact("");
        setPassword("");
      }
    } catch (err) {
      console.error("❌ Error al iniciar sesión:", err.message);
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      login(result.user);
      setIsOpen(false);
    } catch (err) {
      console.error("❌ Error con Google:", err.message);
      setError("No se pudo iniciar sesión con Google.");
    }
  };

  return (
    <>
      <button className="btn-auth" onClick={() => setIsOpen(true)}>
        Iniciar sesión
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black text-white rounded-2xl w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="relative flex items-center justify-center px-4 pt-3">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute left-5 top-2 text-white text-base hover:text-gray-400 transition"
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  lineHeight: "1",
                }}
              >
                ✕
              </button>

              {/* Logo con next/image */}
              <Image
                src="/twitter-x-logo-white (3).svg"
                alt="Logo X"
                width={32}
                height={32}
                className="w-8 h-8"
                priority
              />
            </div>

            <div className="px-8 pb-6">
              <h2 className="text-3xl font-bold mb-6">Inicia sesión</h2>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="mama bg-white text-black w-full py-3 rounded-full font-bold hover:bg-gray-200 transition mb-4"
              >
                Continuar con Google
              </button>

              <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                {useEmail ? (
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full p-4 rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                    required
                  />
                ) : (
                  <input
                    type="tel"
                    placeholder="Teléfono"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full p-4 rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                    required
                  />
                )}

                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                  required
                />

                <button
                  type="button"
                  className="mama text-[#1d9bf0] text-sm text-end hover:underline"
                  onClick={() => setUseEmail(!useEmail)}
                >
                  {useEmail ? "Usar teléfono" : "Usar correo"}
                </button>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  className="mama bg-[#e7e9ea] text-black font-bold py-3 rounded-full hover:bg-gray-300 transition mt-4"
                >
                  Iniciar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

