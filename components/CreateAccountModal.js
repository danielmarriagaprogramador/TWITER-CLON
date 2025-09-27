
"use client";
import { useState } from "react";
import { db, auth } from "../app/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import Image from "next/image";

export default function CreateAccountModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [useEmail, setUseEmail] = useState(false);

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let uid = null;

      if (useEmail) {
        // Registro por correo
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          contact,
          password
        );
        uid = userCredential.user.uid;

        await updateProfile(userCredential.user, {
          displayName: name,
        });
      }

      // Guardar en Firestore
      await addDoc(collection(db, "users"), {
        name,
        contact,
        password: useEmail ? undefined : password,
        birthDate: `${day}-${month}-${year}`,
        createdAt: new Date(),
        uid: uid || null,
        type: useEmail ? "email" : "phone",
      });

      alert("✅ Usuario registrado correctamente");

      // Reiniciar formulario
      setName("");
      setContact("");
      setPassword("");
      setMonth("");
      setDay("");
      setYear("");
      setIsOpen(false);
    } catch (err) {
      console.error("Error al registrar usuario:", err);
      alert("❌ Hubo un error: " + err.message);
    }
  };

  return (
    <>
      <button className="btn-auth" onClick={() => setIsOpen(true)}>
        Crear cuenta
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        >
          <div
            className="bg-black text-white rounded-2xl w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-center justify-center px-4 pt-3">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute left-4 top-3 text-white text-lg hover:text-gray-400 transition"
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
              <h2 className="text-3xl font-bold mb-6">Crea tu cuenta</h2>

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-4 rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                />

                {useEmail ? (
                  <>
                    <input
                      type="email"
                      placeholder="Correo"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      className="w-full p-4 rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full p-4 rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full p-4 rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Contraseña para teléfono"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-4 rounded-md border border-gray-700 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                      required
                    />
                  </>
                )}

                <button
                  type="button"
                  className="mama text-[#1d9bf0] text-sm text-end hover:underline"
                  onClick={() => setUseEmail(!useEmail)}
                >
                  {useEmail ? "Usar teléfono" : "Usar correo"}
                </button>

                <div>
                  <label className="font-bold block mb-1 text-[15px]">
                    Fecha de nacimiento
                  </label>
                  <p className="text-gray-400 text-sm mb-3 leading-tight">
                    Esta información no será pública.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      required
                      className="mama p-3 rounded-md border border-gray-700 bg-black text-white focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                    >
                      <option value="">Mes</option>
                      <option>Enero</option>
                      <option>Febrero</option>
                      <option>Marzo</option>
                      <option>Abril</option>
                      <option>Mayo</option>
                      <option>Junio</option>
                      <option>Julio</option>
                      <option>Agosto</option>
                      <option>Septiembre</option>
                      <option>Octubre</option>
                      <option>Noviembre</option>
                      <option>Diciembre</option>
                    </select>

                    <select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      required
                      className="mama p-3 rounded-md border border-gray-700 bg-black text-white focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                    >
                      <option value="">Día</option>
                      {[...Array(31)].map((_, i) => (
                        <option key={i}>{i + 1}</option>
                      ))}
                    </select>

                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                      className="mama p-3 rounded-md border border-gray-700 bg-black text-white focus:outline-none focus:border-[#1d9bf0] text-[15px]"
                    >
                      <option value="">Año</option>
                      {[...Array(100)].map((_, i) => {
                        const y = 2025 - i;
                        return <option key={y}>{y}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mama bg-[#e7e9ea] text-black font-bold py-3 rounded-full hover:bg-gray-300 transition mt-6"
                >
                  Siguiente
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

