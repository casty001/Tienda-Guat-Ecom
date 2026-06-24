export default function DesktopGenericLanding() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header/Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚲</span>
          <span className="font-bold text-xl text-gray-800">LunioStore</span>
        </div>
        <div className="flex gap-6 text-gray-600">
          <span>Inicio</span>
          <span>Productos</span>
          <span>Ofertas</span>
          <span>Contacto</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
            🔥 OFERTA DEL DÍA
          </span>
          <h1 className="text-5xl font-black leading-tight mb-4">
            Bicicletas para <br />
            <span className="text-red-600">todos los estilos</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Encuentra la bicicleta perfecta para tu rutina. Desde montaña hasta
            ciudad, tenemos lo que necesitas con los mejores precios.
          </p>
          <div className="flex gap-4">
            <button className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition shadow-lg shadow-red-200">
              Ver catálogo
            </button>
            <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition">
              Ofertas
            </button>
          </div>
          <div className="flex gap-8 mt-8">
            <div>
              <p className="text-2xl font-bold text-gray-800">+2,000</p>
              <p className="text-sm text-gray-500">Clientes felices</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">⭐ 4.9</p>
              <p className="text-sm text-gray-500">Calificación promedio</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">-50%</p>
              <p className="text-sm text-gray-500">En ofertas especiales</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-3xl p-8">
            <div className="text-center">
              <div className="text-8xl mb-4">🚲</div>
              <p className="text-2xl font-bold text-gray-800">
                Bicicleta Montaña
              </p>
              <p className="text-gray-600">Ideal para terrenos difíciles</p>
              <div className="mt-4 flex justify-center gap-4">
                <span className="line-through text-gray-400 text-xl">
                  $1,200
                </span>
                <span className="text-3xl font-bold text-red-600">$599</span>
              </div>
              <button className="mt-4 bg-white px-6 py-3 rounded-xl font-bold text-gray-800 shadow-lg hover:shadow-xl transition">
                Ver detalles
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-200">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">
            ¿Por qué elegirnos?
          </h2>
          <p className="text-gray-500">Calidad y confianza en cada pedalada</p>
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl mb-3">🚚</div>
            <h3 className="font-bold text-gray-800">Envío gratis</h3>
            <p className="text-sm text-gray-500">
              En compras superiores a $100
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-3">🛡️</div>
            <h3 className="font-bold text-gray-800">Garantía 1 año</h3>
            <p className="text-sm text-gray-500">Respaldamos cada producto</p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-3">⭐</div>
            <h3 className="font-bold text-gray-800">Atención 24/7</h3>
            <p className="text-sm text-gray-500">Soporte siempre disponible</p>
          </div>
        </div>
      </section>
    </main>
  );
}
