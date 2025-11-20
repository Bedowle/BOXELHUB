export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8FFE6] via-[#AEFFA3] to-[#46FF2E]">
      {/* Header */}
      <header className="flex flex-col shadow-lg bg-white/80 backdrop-blur-md">
        {/* Primera línea: logo + buscador + opciones */}
        <div className="flex items-center justify-between px-8 py-5">
          {/* Logo + nombre */}
          <a href="/" className="flex items-center space-x-2">
            <span className="text-3xl font-extrabold text-[#B1BF30] drop-shadow-lg tracking-wide">
              Voxelhub
            </span>
          </a>

          {/* Buscador */}
          <div className="flex-1 mx-8">
            <input
              type="text"
              placeholder="🔍 Buscar modelos..."
              className="w-full px-4 py-2 rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B1BF30]"
            />
          </div>

          {/* Opciones */}
          <div className="flex space-x-4">
            <a
              href="/cliente"
              className="px-5 py-2 rounded-full bg-[#B1BF30] text-white font-semibold hover:bg-[#97FF8A] transition transform hover:scale-105 shadow-md"
            >
              Registro / Iniciar Sesión
            </a>
            <a
              href="/maker"
              className="px-5 py-2 rounded-full bg-[#B1BF30] text-white font-semibold hover:bg-[#97FF8A] transition transform hover:scale-105 shadow-md"
            >
              Tengo una Impresora 3D
            </a>
          </div>
        </div>

        {/* Segunda línea: categorías */}
        <nav className="flex justify-center space-x-8 bg-[#AEFFA3] py-4 shadow-inner">
          {["Arte", "Hogar", "Videojuegos", "Juguetes", "Moda", "Sorpréndeme"].map(
            (cat) => (
              <a
                key={cat}
                href={`/categoria/${cat.toLowerCase()}`}
                className="text-lg font-semibold text-gray-700 hover:text-[#B1BF30] transition"
              >
                {cat}
              </a>
            )
          )}
        </nav>
      </header>

      {/* Contenido principal */}
      <main className="px-8 py-12">
        <h2 className="text-4xl font-extrabold text-[#B1BF30] drop-shadow-lg mb-10 text-center">
          Recomendaciones
        </h2>

        {/* Grid de recomendaciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 justify-items-center">
          {/* Tarjeta de ejemplo */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition duration-300 w-80">
            <img
              src="https://via.placeholder.com/400x250"
              alt="Modelo 3D"
              className="w-full h-52 object-cover"
            />
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Modelo de ejemplo
              </h3>
              <p className="text-gray-600">Descripción breve del modelo.</p>
            </div>
          </div>

          {/* Otra tarjeta */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform hover:scale-105 transition duration-300 w-80">
            <img
              src="https://via.placeholder.com/400x250"
              alt="Modelo 3D"
              className="w-full h-52 object-cover"
            />
            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Otro modelo
              </h3>
              <p className="text-gray-600">Descripción breve del modelo.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}