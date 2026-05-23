"use client"

import {
  useEffect,
  useState
} from "react"

import { api } from "@/lib/api"

import Link from "next/link"

import AdminGuard from "@/components/AdminGuard"

import {
  signOut
} from "firebase/auth"

import { auth } from "@/lib/firebase"

import { useRouter } from "next/navigation"

export default function AdminPedidosPage() {

  const [pedidos, setPedidos] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  const router = useRouter()

  useEffect(() => {
    cargarPedidos()
  }, [])

  async function logout() {

    await signOut(auth)

    router.push("/login")
  }

  async function cargarPedidos() {

    try {

      const res = await api.get(
        "/pedidos"
      )

      setPedidos(res.data)

    } catch (error) {

      console.error(error)

      alert("Error cargando pedidos")

    } finally {

      setLoading(false)
    }
  }

  async function cambiarEstado(
    id: string,
    estado: string
  ) {

    try {

      await api.patch(
        `/pedidos/${id}/estado?estado=${estado}`
      )

      await cargarPedidos()

    } catch (error) {

      console.error(error)

      alert("Error cambiando estado")
    }
  }

  if (loading) {

    return (
      <main className="p-10">
        Cargando pedidos...
      </main>
    )
  }

  return (
    <AdminGuard>

      <main className="p-10">

        <div className="flex justify-between items-center mb-8">

          <h1 className="text-4xl font-bold">
            Pedidos
          </h1>

          <div className="flex gap-4">

            <Link
              href="/admin/productos"
              className="bg-black text-white px-5 py-3 rounded-xl"
            >
              Productos
            </Link>

            <button
              onClick={logout}
              className="bg-red-600 text-white px-5 py-3 rounded-xl"
            >
              Cerrar sesión
            </button>

          </div>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full border">

            <thead>

              <tr className="bg-gray-100 text-left">

                <th className="p-3 border">
                  Cliente
                </th>

                <th className="p-3 border">
                  Teléfono
                </th>

                <th className="p-3 border">
                  Ciudad
                </th>

                <th className="p-3 border">
                  Producto
                </th>

                <th className="p-3 border">
                  Precio
                </th>

                <th className="p-3 border">
                  Estado
                </th>

                <th className="p-3 border">
                  Acciones
                </th>

              </tr>
            </thead>

            <tbody>

              {pedidos.map((pedido) => (

                <tr key={pedido.id}>

                  <td className="p-3 border">
                    {pedido.nombre}
                  </td>

                  <td className="p-3 border">
                    {pedido.telefono}
                  </td>

                  <td className="p-3 border">
                    {pedido.ciudad}
                  </td>

                  <td className="p-3 border">
                    {pedido.productoNombre}
                  </td>

                  <td className="p-3 border">
                    ${pedido.precio}
                  </td>

                  <td className="p-3 border">
                    {pedido.estado}
                  </td>

                  <td className="p-3 border flex gap-2">

                    <button
                      onClick={() =>
                        cambiarEstado(
                          pedido.id,
                          "aceptado"
                        )
                      }
                      className="bg-green-600 text-white px-3 py-2 rounded-lg"
                    >
                      Aceptar
                    </button>

                    <button
                      onClick={() =>
                        cambiarEstado(
                          pedido.id,
                          "cancelado"
                        )
                      }
                      className="bg-red-600 text-white px-3 py-2 rounded-lg"
                    >
                      Cancelar
                    </button>

                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </main>
    </AdminGuard>
  )
}