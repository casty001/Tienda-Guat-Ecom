"use client"

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
  if (!open) return null

  const precio = Number(producto.precio || 0)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-3">
      <div className="bg-white w-full max-w-md max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl">
        {/* Header - Texto negro legible */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg text-gray-900">
            OFERTA DE TIEMPO LIMITADO 🔥
          </h2>

          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-600 hover:text-gray-900"
            type="button"
          >
            ×
          </button>
        </div>

        {producto.imagen && (
          <img src={"/selecciona-tu-oferta.webp"} className="w-full" />
        )}

        <div className="p-4">
          {/* Tarjeta de oferta - Texto negro */}
          <div className="border-2 border-purple-600 bg-purple-100 rounded-xl p-3 flex gap-3 items-center mb-4">
            <img
              src={producto.imagen}
              className="w-16 h-16 object-cover rounded-lg"
            />

            <div className="flex-1">
              <p className="font-bold text-gray-900">1 Unidad + Regalo</p>
              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                Precio Especial 🔥
              </span>
            </div>

            <p className="font-bold text-gray-900">
              ${precio.toLocaleString("es-CO")}
            </p>
          </div>

          {/* Resumen de compra - Texto negro */}
          <div className="border rounded-xl p-4 mb-4 bg-gray-50">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>${precio.toLocaleString("es-CO")}</span>
            </div>

            <div className="flex justify-between text-gray-700">
              <span>Envío</span>
              <span className="text-green-600">Gratis</span>
            </div>

            <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">${precio.toLocaleString("es-CO")}</span>
            </div>
          </div>

          {/* Título - Texto negro */}
          <p className="text-center font-bold mb-4 text-gray-900">
            Ingrese su dirección de envío
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            {/* Inputs con texto negro */}
            <input
              name="nombre"
placeholder="Ej: Mateo Rodriguez Castaño"
              className="border p-3 rounded-lg text-gray-900 placeholder-gray-400"
              required
            />

            <input
              name="telefono"
placeholder="304458627"
              className="border p-3 rounded-lg text-gray-900 placeholder-gray-400"
              required
            />

            <input
              name="direccion"
placeholder="Ej: Calle 62a #55-66"              className="border p-3 rounded-lg text-gray-900 placeholder-gray-400"
              required
            />

            <input
              name="referencia"
placeholder="Ej: Torre B, Apto 201"              className="border p-3 rounded-lg text-gray-900 placeholder-gray-400"
            />

            <select
              name="departamento"
              className="border p-3 rounded-lg text-gray-900"
              required
            >
              <option value="" className="text-gray-500">Departamento</option>
              {departamentos.map((dep) => (
                <option key={dep} value={dep} className="text-gray-900">
                  {dep}
                </option>
              ))}
            </select>

            <input
              name="ciudad"
              placeholder="Ciudad"
              className="border p-3 rounded-lg text-gray-900 placeholder-gray-400"
              required
            />

            {/* Checkbox con texto negro */}
            <label className="border border-purple-500 bg-purple-100 p-3 rounded-lg flex gap-2 text-sm text-gray-900">
              <input type="checkbox" name="prioritario" className="mt-0.5" />
              <span>
                Agrega <b>ENVÍO PRIORITARIO + GARANTÍA EXTENDIDA</b> por solo{" "}
                <b>$4.900</b>
              </span>
            </label>

            {/* Botón principal - Texto blanco sobre rojo */}
            <button
              type="submit"
              disabled={enviando}
              className="bg-red-600 text-white p-4 rounded-lg font-bold disabled:opacity-50 hover:bg-red-700 transition-colors"
            >
              {enviando
                ? "Enviando pedido..."
                : `COMPLETA TU COMPRA CON PAGO CONTRA ENTREGA - $${precio.toLocaleString("es-CO")}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}