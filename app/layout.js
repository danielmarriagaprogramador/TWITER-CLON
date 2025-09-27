import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "Mi App",
  icons: {
    icon: "/x-favicon.svg",
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
