"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import AdminGuard from "@/components/AdminGuard"
import { api } from "@/lib/api"

interface BlacklistItem {
  numero: string
  motivo?: string
  agregadoEn?: string
}

const PAGE_SIZE = 10

function BlacklistContent() {
  const [items, setItems] = useState<BlacklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [numero, setNumero] = useState("")
  const [motivo, setMotivo] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")

  const [busqueda, setBusqueda] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [orden, setOrden] = useState<"reciente" | "antiguo">("reciente")

  // ── Paginación con cursor ──
  const [pagina, setPagina] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState<number | null>(null)
  const [paginasConocidas, setPaginasConocidas] = useState(1)
  const cursors = useRef<(string | null)[]>([null])
  const cache = useRef<Map<number, { items: BlacklistItem[]; hasMore: boolean }>>(new Map())
  const reqId = useRef(0)

  const cargarPagina = async (p: number, force = false) => {
    const cached = cache.current.get(p)
    if (!force && cached) {
      setItems(cached.items)
      setHasMore(cached.hasMore)
      setPagina(p)
      return
    }

    const id = ++reqId.current
    setLoading(true)
    try {
      const params: Record<string, any> = { limit: PAGE_SIZE, orden }
      const cur = cursors.current[p]
      if (cur) params.cursor = cur
      if (busqueda.trim()) params.q = busqueda.trim()
      if (fechaDesde) params.desde = fechaDesde
      if (fechaHasta) params.hasta = fechaHasta

      const res = await api.get("/blacklist/", { params })
      if (id !== reqId.current) return

      const { items: nuevos, next_cursor, has_more, total: totalRes } = res.data
      cache.current.set(p, { items: nuevos, hasMore: has_more })
      if (has_more) {
        cursors.current[p + 1] = next_cursor
        setPaginasConocidas((prev) => Math.max(prev, p + 2))
      }
      if (totalRes !== null && totalRes !== undefined) setTotal(totalRes)

      setItems(nuevos)
      setHasMore(has_more)
      setPagina(p)
      setError("")
    } catch (e) {
      if (id !== reqId.current) return
      console.error("Error cargando blacklist:", e)
      setError("No se pudo cargar la lista")
    } finally {
      if (id === reqId.current) setLoading(false)
    }
  }

  // Reinicia todo y carga la página 1
  const cargar = () => {
    cursors.current = [null]
    cache.current.clear()
    setPaginasConocidas(1)
    return cargarPagina(0, true)
  }

  // Carga inicial y recarga cuando cambian los filtros (con pausa al escribir)
  useEffect(() => {
    const t = setTimeout(() => cargar(), 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, fechaDesde, fechaHasta, orden])

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!numero.trim()) {
      setError("Ingresa un número")
      return
    }

    setEnviando(true)
    try {
      await api.post("/blacklist/", null, {
        params: { numero: numero.trim(), motivo: motivo.trim() },
      })
      setNumero("")
      setMotivo("")
      await cargar()
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error al agregar el número")
    } finally {
      setEnviando(false)
    }
  }

  const eliminar = async (num: string) => {
    if (!confirm(`¿Quitar ${num} de la blacklist?`)) return

    try {
      await api.delete(`/blacklist/${num}`)
      await cargar()
    } catch (e) {
      console.error("Error eliminando:", e)
      alert("No se pudo eliminar")
    }
  }

  const inicio = pagina * PAGE_SIZE + 1
  const fin = pagina * PAGE_SIZE + items.length
  const hayFiltros = !!(busqueda.trim() || fechaDesde || fechaHasta)

  return (
    <main className="min-h-screen bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white">🚫 Blacklist</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Números bloqueados para eventos de Meta/TikTok
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/admin/pedidos"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                📋 Inicio
              </Link>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form
          onSubmit={agregar}
          className="bg-gray-800 rounded-xl p-6 mb-6 space-y-3"
        >
          <input
            type="text"
            placeholder="📱 Número (ej: 0991234567)"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <input
            type="text"
            placeholder="📝 Motivo (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {enviando ? "⏳ Agregando..." : "➕ Agregar a blacklist"}
          </button>
        </form>

        {/* Buscador y filtros */}
        {(items.length > 0 || hayFiltros) && (
          <div className="mb-4 space-y-3">
            <input
              type="text"
              placeholder="🔍 Buscar por número (desde el inicio)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1">Orden</label>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value as "reciente" | "antiguo")}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="reciente">Más reciente</option>
                  <option value="antiguo">Más antiguo</option>
                </select>
              </div>
              {hayFiltros && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setBusqueda("")
                      setFechaDesde("")
                      setFechaHasta("")
                    }}
                    className="w-full p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
                  >
                    ✕ Limpiar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
            <p>Cargando...</p>
          </div>
        ) : items.length === 0 && !hayFiltros ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-gray-400">No hay números bloqueados.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-400">Sin resultados para los filtros aplicados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.numero}
                className="bg-gray-800 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-mono font-semibold text-white">
                    {item.numero}
                  </p>
                  {item.motivo && (
                    <p className="text-sm text-gray-400">{item.motivo}</p>
                  )}
                  {item.agregadoEn && (
                    <p className="text-xs text-gray-500 mt-1">
                      📅 Agregado el{" "}
                      {new Date(item.agregadoEn).toLocaleString("es-EC", {
                        timeZone: "America/Guayaquil",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => eliminar(item.numero)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                >
                  🗑️ Quitar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {items.length > 0 && (
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-400 text-sm">
            <div>
              Mostrando {inicio} - {fin}
              {total !== null ? ` de ${total}` : ""}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => cargarPagina(pagina - 1)}
                disabled={pagina === 0 || loading}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ◀
              </button>
              {Array.from({ length: paginasConocidas }, (_, i) => (
                <button
                  key={i}
                  onClick={() => cargarPagina(i)}
                  disabled={loading || !(cache.current.has(i) || cursors.current[i] !== undefined)}
                  className={`px-3 py-1 rounded transition disabled:opacity-40 ${
                    i === pagina
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
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
          📊 Total: {total !== null ? total : items.length} números bloqueados
        </div>
      </div>
    </main>
  )
}

export default function BlacklistPage() {
  return (
    <AdminGuard>
      <BlacklistContent />
    </AdminGuard>
  )
}