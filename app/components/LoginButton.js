import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";

const LoginButton = () => {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Usuario autenticado:", user);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  return (
    <button onClick={handleLogin} style={{ padding: "10px", fontSize: "16px" }}>
      Iniciar sesión con Google
    </button>
  );
};

export default LoginButton;