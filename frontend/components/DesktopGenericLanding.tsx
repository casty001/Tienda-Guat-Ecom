export default function DesktopGenericLanding() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-10">
      <section className="max-w-6xl grid grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-5xl font-black mb-6">
            🚲 Bicicletas para todos
          </h1>

          <p className="text-xl mb-6">
            Explora ofertas especiales en bicicletas, accesorios y productos para movilidad.
          </p>

          <a
            href="/"
            className="inline-block bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-xl"
          >
            Ver catálogo
          </a>
        </div>

        <div className="bg-gray-100 rounded-3xl p-10 text-center">
          <div className="text-9xl mb-6">🚲</div>
          <h2 className="text-3xl font-bold">
            Landing optimizada para escritorio
          </h2>
        </div>
      </section>
    </main>
  )
}