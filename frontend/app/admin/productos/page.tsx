"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import Image from "next/image"; // 👈 IMPORTANTE: Optimiza las imágenes
import AdminGuard from "@/components/AdminGuard";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

// ═══════════════════════════════════════════════════════════════
// PLANTILLA INICIAL — bloque por defecto al crear un producto
// ═══════════════════════════════════════════════════════════════
function plantillaInicial() {
  const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `b_${Math.random().toString(36).slice(2)}_${Date.now()}`;

  return {
    version: 2,
    tema: {
      colorPrimario: "#cb1515",
      colorFondo: "#121212",
      tipografia: "Inter",
      anchoMax: 480,
    },
    bloques: [
      {
        id: newId(),
        tipo: "banner_contador",
        props: {
          texto: "DESCUENTO POR\nTIEMPO LIMITADO",
          minutos: 28,
          colorBanner: "#E06000",
        },
      },
      {
        id: newId(),
        tipo: "barra_estrellas",
        props: { texto: "+100.000 clientes satisfechos" },
      },
      {
        id: newId(),
        tipo: "cabecera_producto",
        props: {},
      },
      {
        id: newId(),
        tipo: "boton_comprar",
        props: {
          texto: "PEDIR AHORA Y PAGAR AL RECIBIR",
          subtitulo: "",
          color: "#cb1515",
        },
      },
      {
        id: newId(),
        tipo: "bloque_compra",
        props: {
          textoDescuento: "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS",
          queIncluye: "",
          informacionEnvio: "",
          devoluciones: "",
        },
      },
      {
        id: newId(),
        tipo: "boton_comprar",
        props: {
          texto: "PEDIR AHORA Y PAGAR AL RECIBIR",
          subtitulo: "",
          color: "#cb1515",
        },
      },
    ],
  };
}

export default function AdminProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados de paginación y búsqueda
  const [cargandoLista, setCargandoLista] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [imagenPrincipal, setImagenPrincipal] = useState("");
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);

  // ─── Auth ───
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
    });
    return () => unsub();
  }, [router]);

  // ─── Función unificada de carga ───
  async function cargarProductos(reset: boolean = true, cursor: string | null = null) {
    if (reset) setCargandoLista(true);
    try {
      const res = await api.get("/productos", {
        params: { 
          limit: 10, 
          search: busqueda || undefined, 
          start_after: cursor || undefined 
        },
      });
      setProductos((prev) => (reset ? res.data.items : [...prev, ...res.data.items]));
      setNextCursor(res.data.next_cursor);
    } catch (error: any) {
      console.error(error);
      if (error.response?.status !== 401) alert("Error cargando productos");
    } finally {
      setCargandoLista(false);
    }
  }

  // ─── Debounce para el buscador ───
  useEffect(() => {
    const t = setTimeout(() => {
      cargarProductos(true, null);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  // ─── Duplicar (Usa la ruta rápida del backend) ───
  async function duplicarProducto(id: string) {
    if (!confirm("¿Seguro que quieres duplicar este producto?")) return;
    setDuplicandoId(id);
    try {
      const res = await api.post(`/productos/${id}/duplicar`);
      setProductos((prev) => [res.data.producto, ...prev]);
      alert("✅ Producto duplicado con éxito");
    } catch (error) {
      console.error(error);
      alert("❌ Error al duplicar el producto");
    } finally {
      setDuplicandoId(null);
    }
  }

  // ─── Subir Imagen ───
  async function subirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagenSubiendo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload/imagen", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImagenPrincipal(res.data.url);
    } catch (error) {
      console.error(error);
      alert("❌ Error subiendo imagen");
    } finally {
      setImagenSubiendo(false);
      if (e.target) e.target.value = "";
    }
  }

  // ─── Guardar Producto Nuevo ───
  async function guardarProducto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const nombre = String(form.get("nombre") || "").trim();

    if (!nombre) {
      alert("❌ Falta el nombre del producto");
      setLoading(false);
      return;
    }
    if (!imagenPrincipal) {
      alert("❌ Falta la imagen principal");
      setLoading(false);
      return;
    }

    const precio =
      parseFloat(String(form.get("precio") || "0").replace(",", ".")) || 0;
    const precioAntes =
      parseFloat(String(form.get("precioAntes") || "0").replace(",", ".")) || 0;

    const data = {
      nombre,
      precio,
      precioAntes,
      imagen: imagenPrincipal,
      activo: true,
      plantilla: plantillaInicial(),
    };

    const formEl = e.currentTarget;

    try {
      const res = await api.post("/productos", data);
      setImagenPrincipal("");
      formEl.reset();
      router.push(`/admin/productos/${res.data.id}/editor`);
    } catch (error) {
      console.error(error);
      alert("❌ Error creando producto");
    } finally {
      setLoading(false);
    }
  }

  // ─── Eliminar Producto ───
  async function eliminarProducto(id: string) {
    if (!confirm("⚠️ ¿Eliminar este producto?")) return;
    try {
      await api.delete(`/productos/${id}`);
      setProductos((prev) => prev.filter((p) => p.id !== id));
      alert("✅ Producto eliminado");
    } catch (error) {
      console.error(error);
      alert("❌ Error eliminando producto");
    }
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-6">
          
          {/* Header */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">📦 Productos</h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  Crea productos y edítalos visualmente
                </p>
              </div>
              <Link
                href="/admin/pedidos"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                📋 Pedidos
              </Link>
            </div>
          </div>

          {/* Formulario Nuevo Producto */}
          <form
            onSubmit={guardarProducto}
            className="bg-gray-800 rounded-xl p-6 space-y-4 mb-8"
          >
            <h2 className="text-lg font-bold text-white">➕ Nuevo producto</h2>
            <input
              name="nombre"
              placeholder="📝 Nombre del producto"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                name="precio"
                type="text"
                placeholder="💰 Precio"
                className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                required
              />
              <input
                name="precioAntes"
                type="text"
                placeholder="🏷️ Precio antes (opcional)"
                className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="border border-gray-700 rounded-lg p-4">
              <h3 className="font-bold text-white mb-2">🖼️ Imagen principal</h3>
              <input
                type="file"
                accept="image/*"
                onChange={subirImagen}
                className="text-gray-400 text-sm w-full text-ellipsis"
              />
              {imagenPrincipal && (
                <div className="relative inline-block mt-2">
                  {/* 👇 IMAGE OPTIMIZADA EN EL FORMULARIO */}
                  <Image
                    src={imagenPrincipal}
                    alt="Principal"
                    width={96}
                    height={96}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImagenPrincipal("")}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {imagenSubiendo && (
              <p className="text-blue-400 text-sm">⏳ Subiendo imagen...</p>
            )}

            <button
              type="submit"
              disabled={loading || imagenSubiendo}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "⏳ Creando..." : "➕ Crear producto y continuar al editor"}
            </button>
          </form>

          {/* Lista de productos */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h2 className="text-xl font-bold text-white">
                📋 Productos
              </h2>
              
              <input
                type="text"
                placeholder="🔍 Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full sm:w-64 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            {cargandoLista ? (
              <div className="text-center py-12 bg-gray-800 rounded-xl">
                <div className="text-4xl mb-3 animate-spin">⏳</div>
                <p className="text-gray-400">Cargando productos...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-xl">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-400">No se encontraron productos</p>
              </div>
            ) : (
              <>
                {productos.map((producto) => (
                  <div
                    key={producto.id}
                    className="bg-gray-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between"
                  >
                    <div className="flex gap-4 items-center">
                      {/* 👇 IMAGE OPTIMIZADA EN LA LISTA */}
                      <Image
                        src={producto.imagen}
                        alt={producto.nombre}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="text-white font-semibold">
                          {producto.nombre}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          💰 ${producto.precio}
                        </p>
                        {producto.precioAntes > 0 && (
                          <p className="text-gray-500 text-xs line-through">
                            ${producto.precioAntes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/admin/productos/${producto.id}/editor`}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                      >
                        🎨 Editar
                      </Link>
                      <button
                        onClick={() => duplicarProducto(producto.id)}
                        disabled={duplicandoId === producto.id}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                      >
                        {duplicandoId === producto.id ? "⏳" : "⧉ Duplicar"}
                      </button>
                      <button
                        onClick={() => eliminarProducto(producto.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                {/* Botón Cargar Más */}
                {nextCursor && (
                  <div className="flex justify-center mt-6 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => cargarProductos(false, nextCursor)}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
                    >
                      ⬇️ Cargar más productos
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}