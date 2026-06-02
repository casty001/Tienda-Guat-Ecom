"use client";

import { useState } from "react"

const departamentos = [
  "Bogotá", "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar",
  "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar",
  "Chocó", "Córdoba", "Cundinamarca", "Huila", "La Guajira",
  "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo",
  "Quindío", "Risaralda", "Santander", "Sucre", "Tolima",
  "Valle del Cauca", "Vaupés", "Vichada"
]

export default function FloatingOrderModal({
  open,
  onClose,
  producto,
  onSubmit,
  enviando,
}: any) {
  const [envioPrioritario, setEnvioPrioritario] = useState(false)
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<"1" | "2">("1")
  
  if (!open) return null

  // Oferta 1: 1 Unidad (siempre presente)
  const oferta1Precio = Number(producto.precio || 0)
  const oferta1PrecioAntes = Number(producto.precioAntes || 0)

  // Oferta 2: 2 Unidades (solo si está activa en el admin)
  const oferta2Activa = producto.precio2?.activo === true
  const oferta2Precio = Number(producto.precio2?.precio || 0)
  const oferta2PrecioAntes = Number(producto.precio2?.precioAntes || 0)
  const oferta2Titulo = "2 Unidades + Regalo"

  // Precio según oferta seleccionada
  const precioBase = ofertaSeleccionada === "1" ? oferta1Precio : oferta2Precio
  const precioEnvio = envioPrioritario ? 4900 : 0
  const precioTotal = precioBase + precioEnvio

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    
    const datosExtras = {
      ofertaSeleccionada: ofertaSeleccionada,
      ofertaTitulo: ofertaSeleccionada === "1" ? "1 Unidad + Regalo" : "2 Unidades + Regalo",
      cantidad: ofertaSeleccionada === "1" ? 1 : 2,
      precio: precioTotal,
      precioBase: precioBase,
      envioPrioritario: envioPrioritario,
      costoEnvio: precioEnvio
    }
    
    onSubmit(e, datosExtras)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-3">
      <div className="bg-white w-full max-w-md max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg text-gray-900">
            🎁 OFERTA DE TIEMPO LIMITADO
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-600 hover:text-gray-900"
            type="button"
          >
            ×
          </button>
        </div>

        <img src="/selecciona-tu-oferta.webp" className="w-full" alt="Oferta" />

        <div className="p-4">
          {/* OFERTA 1 - 1 Unidad */}
          <div 
            onClick={() => setOfertaSeleccionada("1")}
            className={`border-2 rounded-xl p-3 flex gap-3 items-center mb-3 cursor-pointer transition-all ${
              ofertaSeleccionada === "1" 
                ? "border-purple-600 bg-purple-100" 
                : "border-gray-200 bg-white hover:border-purple-300"
            }`}
          >
            <img
              src={producto.imagen}
              className="w-16 h-16 object-cover rounded-lg"
              alt="1 Unidad"
            />
            <div className="flex-1">
              <p className="font-bold text-gray-900">1 Unidad + Regalo</p>
              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                Precio Especial 🔥
              </span>
            </div>
            <div className="text-right">
              {oferta1PrecioAntes > 0 && (
                <div className="text-gray-400 line-through text-sm">
                  ${oferta1PrecioAntes.toLocaleString("es-CO")}
                </div>
              )}
              <p className="font-bold text-gray-900">
                ${oferta1Precio.toLocaleString("es-CO")}
              </p>
            </div>
          </div>

          {/* OFERTA 2 - 2 Unidades (solo si está activa) */}
          {oferta2Activa && oferta2Precio > 0 && (
            <div 
              onClick={() => setOfertaSeleccionada("2")}
              className={`border-2 rounded-xl p-3 flex gap-3 items-center mb-4 cursor-pointer transition-all ${
                ofertaSeleccionada === "2" 
                  ? "border-purple-600 bg-purple-100" 
                  : "border-gray-200 bg-white hover:border-purple-300"
              }`}
            >
              <img
                src={producto.precio2?.imagen || producto.imagen}
                className="w-16 h-16 object-cover rounded-lg"
                alt="2 Unidades"
              />
              <div className="flex-1">
                <p className="font-bold text-gray-900">{oferta2Titulo}</p>
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded">
                  🔥 Más Vendido
                </span>
              </div>
              <div className="text-right">
                {oferta2PrecioAntes > 0 && (
                  <div className="text-gray-400 line-through text-sm">
                    ${oferta2PrecioAntes.toLocaleString("es-CO")}
                  </div>
                )}
                <p className="font-bold text-gray-900">
                  ${oferta2Precio.toLocaleString("es-CO")}
                </p>
              </div>
            </div>
          )}
          

          {/* Resumen de compra */}
          <div className="border rounded-xl p-4 mb-4 bg-gray-50">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>${precioBase.toLocaleString("es-CO")}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Envío</span>
              {envioPrioritario ? (
                <span className="text-purple-600 font-semibold">+ $4.900 (Prioritario)</span>
              ) : (
                <span className="text-green-600">Gratis</span>
              )}
            </div>
            <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">${precioTotal.toLocaleString("es-CO")}</span>
            </div>
          </div>

          <img src="/ingresa-tus-datos.webp" className="w-full" alt="Oferta" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="font-bold text-black mb-1 block">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                name="nombre"
                placeholder="Ej: Mateo Rodriguez Castaño"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                name="telefono"
                placeholder="304458627"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Dirección <span className="text-red-500">*</span>
              </label>
              <input
                name="direccion"
                placeholder="Ej: Calle 62a #55-66"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Referencia
              </label>
              <input
                name="referencia"
                placeholder="Ej: Torre B, Apto 201"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Departamento <span className="text-red-500">*</span>
              </label>
              <select
                name="departamento"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecciona un departamento</option>
                {departamentos.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                name="ciudad"
                placeholder="Ej: Bogotá"
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Checkbox envío prioritario */}
            <div 
              className="border border-purple-500 rounded-lg p-3 mb-4"
              style={{
                backgroundColor: "rgba(238, 217, 255, 1)",
                backgroundImage: "linear-gradient(90deg, rgba(143, 27, 214, 1) 50%, transparent 50%), linear-gradient(90deg, rgba(143, 27, 214, 1) 50%, transparent 50%), linear-gradient(0deg, rgba(143, 27, 214, 1) 50%, transparent 50%), linear-gradient(0deg, rgba(143, 27, 214, 1) 50%, transparent 50%)",
                backgroundRepeat: "repeat-x, repeat-x, repeat-y, repeat-y",
                backgroundSize: "13px 2px, 13px 2px, 2px 13px, 2px 13px",
                backgroundPosition: "left top, right bottom, left bottom, right top",
                animation: "rsiTickUpsBorder 0.3s linear infinite"
              }}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="prioritario"
                  checked={envioPrioritario}
                  onChange={(e) => setEnvioPrioritario(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex flex-col">
                  <span className="text-black">
                    Agrega <b>ENVÍO PRIORITARIO + GARANTÍA EXTENDIDA</b> por solo{" "}
                    <b>$4.900</b>
                  </span>
                  <span className="text-gray-600 text-sm">
                    Si activas envío prioritario tu orden estará en primera fila
                  </span>
                </div>
              </label>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={enviando}
              className="bg-red-600 text-white p-4 rounded-lg font-bold disabled:opacity-50 hover:bg-red-700 transition-colors"
            >
              {enviando
                ? "Enviando pedido..."
                : `COMPLETA TU COMPRA - $${precioTotal.toLocaleString("es-CO")}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}