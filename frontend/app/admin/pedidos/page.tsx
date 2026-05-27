"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  async function cargarPedidos() {
    try {
      const user = auth.currentUser;

      if (!user) {
        router.replace("/login");
        return;
      }

      const token = await user.getIdToken();

      const res = await api.get("/pedidos/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPedidos(res.data);
    } catch (error: any) {
      console.error(error);

      if (error.response?.status === 401) {
        router.replace("/login");
        return;
      }

      alert("Error cargando pedidos");
    } finally {
      setLoading(false);
    }
  }

  async function cambiarEstado(id: string, estado: string) {
    setUpdatingId(id);
    try {
      await api.patch(`/pedidos/${id}/estado?estado=${estado}`);
      // Actualización optimista
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado } : p)),
      );
    } catch (error) {
      console.error(error);
      alert("Error cambiando estado");
    } finally {
      setUpdatingId(null);
    }
  }

  const getEstadoStyle = (estado: string) => {
    switch (estado) {
      case "aceptado":
        return "bg-green-600";
      case "cancelado":
        return "bg-red-600";
      default:
        return "bg-yellow-600";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
          <p>Cargando pedidos...</p>
        </div>
      </main>
    );
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header simplificado */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">📦 Pedidos</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  Gestionar pedidos
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/admin/productos"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  📋 Productos
                </Link>

                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  🚪 Salir
                </button>
              </div>
            </div>
          </div>

          {/* Tabla optimizada */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700 border-b border-gray-600">
                    <th className="p-3 text-left text-gray-200 font-medium">
                      🛍️ Producto
                    </th>
                    <th className="p-3 text-left text-gray-200 font-medium">
                      📅 Fecha
                    </th>
                    <th className="p-3 text-left text-gray-200 font-medium">
                      👤 Cliente
                    </th>
                    <th className="p-3 text-left text-gray-200 font-medium">
                      🏠 Dirección
                    </th>
                    <th className="p-3 text-left text-gray-200 font-medium">
                      📍 Departamento
                    </th>
                    <th className="p-3 text-left text-gray-200 font-medium">
                      🏙️ Ciudad
                    </th>
                    <th className="p-3 text-left text-gray-200 font-medium">
                      💰 Precio
                    </th>
                    <th className="p-3 text-left text-gray-200 font-medium">
                      📊 Estado
                    </th>
                    <th className="p-3 text-left text-gray-200 font-medium">
                      ⚡ Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr
                      key={pedido.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50"
                    >
                      <td className="p-3 text-gray-300 max-w-[180px] truncate">
                        {pedido.productoNombre}
                      </td>
                      <td className="p-3 text-gray-300">
                        {pedido.creadoEn
                          ? new Date(pedido.creadoEn).toLocaleDateString(
                              "es-CO",
                            )
                          : "-"}
                      </td>
                      <td className="p-3 text-white">
                        {pedido.nombre}
                        <div className="text-gray-400 text-xs">
                          {pedido.telefono}
                        </div>
                      </td>
                      <td className="p-3 text-gray-300 max-w-[220px]">
                        {pedido.direccion}
                        {pedido.referencia && (
                          <div className="text-gray-500 text-xs">
                            {pedido.referencia}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-gray-300">
                        {pedido.departamento}
                      </td>
                      <td className="p-3 text-gray-300">{pedido.ciudad}</td>
                      <td className="p-3 text-white font-medium">
                        ${Number(pedido.precio || 0).toLocaleString("es-CO")}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs text-white ${getEstadoStyle(pedido.estado)}`}
                        >
                          {pedido.estado === "aceptado"
                            ? "✓ Aceptado"
                            : pedido.estado === "cancelado"
                              ? "✗ Cancelado"
                              : "⏳ Pendiente"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => cambiarEstado(pedido.id, "aceptado")}
                            disabled={updatingId === pedido.id}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded disabled:opacity-50 transition-colors"
                          >
                            {updatingId === pedido.id ? "..." : "✓"}
                          </button>
                          <button
                            onClick={() =>
                              cambiarEstado(pedido.id, "cancelado")
                            }
                            disabled={updatingId === pedido.id}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded disabled:opacity-50 transition-colors"
                          >
                            {updatingId === pedido.id ? "..." : "✗"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pedidos.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                <p>No hay pedidos aún</p>
              </div>
            )}
          </div>

          {/* Footer minimalista */}
          <div className="mt-4 text-center text-xs text-gray-500">
            📊 Total: {pedidos.length} pedidos
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
