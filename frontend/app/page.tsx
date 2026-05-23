"use client"

import { useEffect, useState } from "react"

import Link from "next/link"

import { api } from "@/lib/api"

export default function HomePage() {

  const [productos, setProductos] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {

    try {

      const res = await api.get(
        "/productos"
      )

      setProductos(res.data)

    } catch (error) {

      console.error(error)

      alert("Error cargando productos")

    } finally {

      setLoading(false)
    }
  }

  if (loading) {

    return (
      <main className="min-h-screen flex items-center justify-center">
        Cargando catálogo...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-10">

          <h1 className="text-5xl font-bold">
            Tienda Drop
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {productos.map((producto) => (

            <div
              key={producto.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >

              <img
                src={producto.imagen}
                alt={producto.nombre}
                className="w-full h-80 object-cover"
              />

              <div className="p-5">

                <h2 className="text-2xl font-bold mb-3">
                  {producto.nombre}
                </h2>

                <div className="mb-4">

                  {producto.precioAntes > 0 && (
                    <p className="text-gray-400 line-through">
                      Antes: $
                      {Number(
                        producto.precioAntes
                      ).toLocaleString("es-CO")}
                    </p>
                  )}

                  <p className="text-3xl font-bold text-green-600">
                    $
                    {Number(
                      producto.precio
                    ).toLocaleString("es-CO")}
                  </p>

                </div>

                <Link
                  href={`/producto/${producto.id}`}
                  className="block bg-red-600 text-white text-center py-4 rounded-xl font-bold text-lg"
                >
                  VER OFERTA
                </Link>

              </div>
            </div>
          ))}

        </div>
      </div>
    </main>
  )
}