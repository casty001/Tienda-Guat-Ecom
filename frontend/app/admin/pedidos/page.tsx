"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

type PaginaCache = { items: any[]; hasMore: boolean };

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [paginasConocidas, setPaginasConocidas] = useState(1);
  const router = useRouter();

  // cursors.current[i] = cursor necesario para pedir la página i
  const cursors = useRef<(string | null)[]>([null]);
  const pagesCache = useRef<Map<number, PaginaCache>>(new Map());

  // 1) Solo verifica sesión
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, [router]);

  // 2) Carga la primera página cuando hay sesión
  useEffect(() => {
    if (authReady) recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  function recargar() {
    cursors.current = [null];
    pagesCache.current.clear();
    setPaginasConocidas(1);
    cargarPagina(0, true);
  }

  async function cargarPagina(p: number, force = false) {
    // Si ya la vimos, no se vuelve a leer de Firestore
    const cached = pagesCache.current.get(p);
    if (!force && cached) {
      setPedidos(cached.items);
      setHasMore(cached.hasMore);
      setPagina(p);
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, any> = { limit: PAGE_SIZE };
      const cur = cursors.current[p];
      if (cur) params.cursor = cur;

      const res = await api.get("/pedidos/", { params });
      const { items, next_cursor, has_more, total: totalRes } = res.data;

      pagesCache.current.set(p, { items, hasMore: has_more });
      if (has_more) {
        cursors.current[p + 1] = next_cursor;
        setPaginasConocidas((prev) => Math.max(prev, p + 2));
      }
      if (totalRes !== null && totalRes !== undefined) setTotal(totalRes);

      setPedidos(items);
      setHasMore(has_more);
      setPagina(p);
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
      setPedidos((prev) => {
        const nuevos = prev.map((p) => (p.id === id ? { ...p, estado } : p));
        const c = pagesCache.current.get(pagina);
        if (c) pagesCache.current.set(pagina, { ...c, items: nuevos });
        return nuevos;
      });
    } catch (error) {
      console.error(error);
      alert("Error cambiando estado");
    } finally {
      setUpdatingId(null);
    }
  }

const ESTADOS: Record<string, { label: string; style: string }> = {
  pendiente:    { label: "⏳ Pendiente",    style: "bg-yellow-600" },
  aceptado:     { label: "✓ Aceptado",      style: "bg-green-600" },
  guia_enviada: { label: "🚚 Guía enviada", style: "bg-blue-600" },
  entregado:    { label: "📦 Entregado",    style: "bg-emerald-700" },
  cancelado:    { label: "✗ Cancelado",     style: "bg-red-600" },
};

const getEstado = (estado: string) => ESTADOS[estado] ?? ESTADOS.pendiente;

  // Texto "Mostrando X - Y de N"
  const inicio = pagina * PAGE_SIZE + 1;
  const fin = pagina * PAGE_SIZE + pedidos.length;

  if (!authReady) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
          <p>Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">📦 Pedidos</h1>
                <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/30">
                  🇪🇨 Ecuador
                </span>
              </div>

              <div className="grid grid-cols-2 md:flex gap-2">
                <button
                  onClick={recargar}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Cargando...
                    </>
                  ) : (
                    <>🔄 Actualizar</>
                  )}
                </button>

                <Link
                  href="/admin/blacklist"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors text-center"
                >
                  🚫 Blacklist
                </Link>

                <Link
                  href="/admin/productos"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors text-center"
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

          {/* Tabla */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-700 border-b border-gray-600">
                    {[
                      "🛍️ Producto",
                      "📅 Fecha",
                      "👤 Cliente",
                      "🏠 Dirección",
                      "📍 Departamento",
                      "🏙️ Ciudad",
                      "💰 Precio",
                      "📊 Estado",
                      "⚡ Acciones",
                    ].map((h) => (
                      <th
                        key={h}
                        className="p-3 text-left text-gray-200 font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400">
                        <div className="inline-block w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                        <p>Cargando pedidos...</p>
                      </td>
                    </tr>
                  ) : pedidos.length > 0 ? (
                    pedidos.map((pedido) => (
                      <tr
                        key={pedido.id}
                        className="border-b border-gray-700 hover:bg-gray-700/50"
                      >
                        <td className="p-3 text-gray-300 max-w-[180px] truncate">
                          {pedido.productoNombre}
                        </td>
                        <td className="p-3 text-gray-300 whitespace-nowrap text-xs">
                          {pedido.creadoEn
                            ? new Date(pedido.creadoEn).toLocaleString("es-CO", {
                                timeZone: "America/Bogota",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
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
                        <td className="p-3 text-gray-300">{pedido.departamento}</td>
                        <td className="p-3 text-gray-300">{pedido.ciudad}</td>
                        <td className="p-3 text-white font-medium">
                          ${Number(pedido.precio || 0).toLocaleString("es-CO")}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs text-white whitespace-nowrap ${getEstado(pedido.estado).style}`}
                          >
                            {getEstado(pedido.estado).label}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={pedido.estado || "pendiente"}
                            onChange={(e) => cambiarEstado(pedido.id, e.target.value)}
                            disabled={updatingId === pedido.id}
                            className="bg-gray-700 text-white text-xs rounded px-2 py-1.5 border border-gray-600 disabled:opacity-50 cursor-pointer"
                          >
                            {Object.entries(ESTADOS).map(([valor, { label }]) => (
                              <option key={valor} value={valor}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400">
                        <div className="text-4xl mb-2">📭</div>
                        <p>No hay pedidos aún</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINACIÓN */}
          {pedidos.length > 0 && (
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-400 text-sm">
              <div>
                Mostrando {inicio} - {fin}
                {total !== null ? ` de ${total}` : ""} pedidos
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => cargarPagina(pagina - 1)}
                  disabled={pagina === 0 || loading}
                  className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ◀
                </button>
                {Array.from({ length: paginasConocidas }, (_, i) => {
                  const esActiva = i === pagina;
                  // Solo se puede ir a páginas ya visitadas o a la siguiente
                  const alcanzable =
                    pagesCache.current.has(i) || cursors.current[i] !== undefined;
                  return (
                    <button
                      key={i}
                      onClick={() => cargarPagina(i)}
                      disabled={loading || !alcanzable}
                      className={`px-3 py-1 rounded transition ${
                        esActiva
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      } disabled:opacity-40`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => cargarPagina(pagina + 1)}
                  disabled={!hasMore || loading}
                  className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ▶
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 text-center text-xs text-gray-500">
            📊 Total: {total !== null ? total : pedidos.length} pedidos
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}