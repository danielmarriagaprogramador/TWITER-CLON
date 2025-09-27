import Image from "next/image";
import AuthButton from "@/components/AuthButton";
import CreateAccountModal from "@/components/CreateAccountModal";
import LoginModal from "@/components/LoginModal";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Columna izquierda - Logo */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-sm lg:max-w-lg">
            <Image
              src="/twitter-x-logo-white (2).svg"
              alt="Twitter X Logo"
              width={400}
              height={400}
              priority
              className="w-full h-auto max-w-[280px] lg:max-w-[400px] mx-auto"
            />
          </div>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-16 max-w-lg lg:max-w-xl mx-auto lg:mx-0">
          {/* Títulos principales */}
          <div className="mb-8 lg:mb-12 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-8 lg:mb-12">
              Lo que está <br /> pasando ahora
            </h1>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8">
              Únete Hoy
            </h2>
          </div>

          {/* Botones de acción */}
          <div className="space-y-4 mb-6 flex flex-col items-center lg:items-stretch">
            <AuthButton />
            
            {/* Divisor */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-600"></div>
              <span className="px-4 text-gray-400 text-sm">o</span>
              <div className="flex-1 border-t border-gray-600"></div>
            </div>
            
            <CreateAccountModal />
          </div>

          {/* Términos de servicio */}
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-8 lg:mb-12 text-center lg:text-left">
            Al registrarte, aceptas los{" "}
            <a
              href="https://x.com/es/tos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Términos de servicio
            </a>{" "}
            y la{" "}
            <a
              href="https://x.com/es/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Política de privacidad
            </a>
            , incluida la política de{" "}
            <a
              href="https://x.com/es/cookies"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Uso de Cookies
            </a>
            .
          </p>

          {/* Login */}
          <div className="space-y-4 flex flex-col items-center lg:items-stretch">
            <h3 className="text-lg font-bold text-center">¿Ya tienes una cuenta?</h3>
            <LoginModal />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav>
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-400">
              <li><a href="https://about.x.com/es" className="hover:underline">Información</a></li>
              <li><a href="https://help.x.com/en/using-x/download-the-x-app" className="hover:underline">Descarga la app de X</a></li>
              <li><a href="https://grok.com/" className="hover:underline">Grok</a></li>
              <li><a href="https://help.x.com/es" className="hover:underline">Centro de Ayuda</a></li>
              <li><a href="https://x.com/es/tos" className="hover:underline">Condiciones de Servicio</a></li>
              <li><a href="https://x.com/es/privacy" className="hover:underline">Política de Privacidad</a></li>
              <li><a href="https://x.com/es/cookies" className="hover:underline">Política de cookies</a></li>
              <li><a href="https://x.com/es/accessibility" className="hover:underline">Accesibilidad</a></li>
              <li><a href="https://ads.x.com/" className="hover:underline">Información de anuncios</a></li>
              <li><a href="https://blog.x.com/" className="hover:underline">Blog</a></li>
              <li><a href="https://careers.x.com/" className="hover:underline">Empleos</a></li>
              <li><a href="https://brands.x.com/" className="hover:underline">Recursos para marcas</a></li>
              <li><a href="https://ads.x.com/" className="hover:underline">Publicidad</a></li>
              <li><a href="https://marketing.x.com/es" className="hover:underline">Marketing</a></li>
              <li><a href="https://business.x.com/es?ref=web-twc-ao-gbl-twitterforbusiness&utm_source=twc&utm_medium=web&utm_campaign=ao&utm_content=twitterforbusiness" className="hover:underline">X para empresas</a></li>
              <li><a href="https://developer.x.com/en" className="hover:underline">Desarrolladores</a></li>
              <li><a href="https://x.com/i/directory/profiles" className="hover:underline">Guía</a></li>
              <li><a href="https://x.com/settings/account/personalization" className="hover:underline">Configuración</a></li>
              <li className="text-gray-500">© 2025 X Corp.</li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}