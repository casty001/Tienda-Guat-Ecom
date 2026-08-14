"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import AdminGuard from "@/components/AdminGuard"
import { api } from "@/lib/api"

interface BlacklistItem {
  numero: string
  motivo?: string
  agregadoEn?: string
}

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
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 10

  const cargar = async () => {
    setLoading(true)
    try {
      const res = await api.get("/blacklist/")
      setItems(res.data)
    } catch (e) {
      console.error("Error cargando blacklist:", e)
      setError("No se pudo cargar la lista")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

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
      setPaginaActual(1)
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

  // 👇 Filtro por número o motivo
  const itemsFiltrados = items
    .filter((item) => {
      const q = busqueda.trim().toLowerCase()
      if (!q) return true
      return (
        item.numero.toLowerCase().includes(q) ||
        (item.motivo || "").toLowerCase().includes(q)
      )
    })
    .filter((item) => {
      if (!item.agregadoEn) return !fechaDesde && !fechaHasta
      const fechaItem = item.agregadoEn.slice(0, 10) // YYYY-MM-DD
      if (fechaDesde && fechaItem < fechaDesde) return false
      if (fechaHasta && fechaItem > fechaHasta) return false
      return true
    })
    .sort((a, b) => {
      const fa = a.agregadoEn || ""
      const fb = b.agregadoEn || ""
      return orden === "reciente" ? fb.localeCompare(fa) : fa.localeCompare(fb)
    })

  // 👇 Paginación
  const totalItems = itemsFiltrados.length
  const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina))
  const inicio = (paginaActual - 1) * itemsPorPagina
  const fin = inicio + itemsPorPagina
  const itemsPagina = itemsFiltrados.slice(inicio, fin)

  const irPagina = (pagina: number) => {
    if (pagina < 1 || pagina > totalPaginas) return
    setPaginaActual(pagina)
  }

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
        {items.length > 0 && (
          <div className="mb-4 space-y-3">
            <input
              type="text"
              placeholder="🔍 Buscar por número o motivo..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaActual(1)
              }}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => {
                    setFechaDesde(e.target.value)
                    setPaginaActual(1)
                  }}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => {
                    setFechaHasta(e.target.value)
                    setPaginaActual(1)
                  }}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="text-xs text-gray-500 block mb-1">
                  Orden
                </label>
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value as "reciente" | "antiguo")}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="reciente">Más reciente</option>
                  <option value="antiguo">Más antiguo</option>
                </select>
              </div>
              {(fechaDesde || fechaHasta || busqueda) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setBusqueda("")
                      setFechaDesde("")
                      setFechaHasta("")
                      setPaginaActual(1)
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
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-gray-400">No hay números bloqueados.</p>
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-400">
              Sin resultados para los filtros aplicados
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {itemsPagina.map((item) => (
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
        {totalItems > itemsPorPagina && (
          <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-400 text-sm">
            <div>
              Mostrando {inicio + 1} - {Math.min(fin, totalItems)} de{" "}
              {totalItems}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => irPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ◀
              </button>
              {[...Array(totalPaginas)].map((_, i) => {
                const num = i + 1
                const esActiva = num === paginaActual
                return (
                  <button
                    key={num}
                    onClick={() => irPagina(num)}
                    className={`px-3 py-1 rounded transition ${
                      esActiva
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    }`}
                  >
                    {num}
                  </button>
                )
              })}
              <button
                onClick={() => irPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ▶
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 text-center text-xs text-gray-500">
          📊 Total: {items.length} números bloqueados
          {(busqueda || fechaDesde || fechaHasta) &&
            ` · ${itemsFiltrados.length} con los filtros aplicados`}
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