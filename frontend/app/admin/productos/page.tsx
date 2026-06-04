"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function AdminProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [imagenSubiendo, setImagenSubiendo] = useState(false);
  const [editando, setEditando] = useState<any>(null);

  const [imagenPrincipal, setImagenPrincipal] = useState("");
  const [landing1, setLanding1] = useState("");
  const [landing2, setLanding2] = useState("");
  const [landing3, setLanding3] = useState("");
  const [landing4, setLanding4] = useState("");
  const [landing5, setLanding5] = useState("");
  const [precio2Activo, setPrecio2Activo] = useState(false)
  const [precio2, setPrecio2] = useState(0)
  const [pais, setPais] = useState<"CO" | "EC">("CO")
  const [precio2Antes, setPrecio2Antes] = useState(0)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      cargarProductos();
    });

    return () => unsub();
  }, [router]);

  async function cargarProductos() {
    try {
      const res = await api.get("/productos");
      setProductos(res.data);
    } catch (error: any) {
      console.error(error);

      if (error.response?.status === 401) {
        return;
      }

      alert("Error cargando productos");
    }
  }

  async function subirImagen(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagenSubiendo(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/upload/imagen", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setter(res.data.url);
    } catch (error) {
      console.error(error);
      alert("❌ Error subiendo imagen");
    } finally {
      setImagenSubiendo(false);
    }
  }

  function cargarParaEditar(producto: any) {
  setEditando(producto);
  setImagenPrincipal(producto.imagen || "");
  setLanding1(producto.imagenesLanding?.imagen1 || "");
  setLanding2(producto.imagenesLanding?.imagen2 || "");
  setLanding3(producto.imagenesLanding?.imagen3 || "");
  setLanding4(producto.imagenesLanding?.imagen4 || "");
  setLanding5(producto.imagenesLanding?.imagen5 || "");
  setPais(producto.pais || "CO")

  // ✅ Leer desde la estructura anidada
  setPrecio2Activo(producto.precio2?.activo || false);
  setPrecio2(producto.precio2?.precio || 0);
  setPrecio2Antes(producto.precio2?.precioAntes || 0);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

  function limpiarFormulario(form?: HTMLFormElement) {
    setEditando(null);
    setImagenPrincipal("");
    setLanding1("");
    setLanding2("");
    setLanding3("");
    setLanding4("");
    setLanding5("");
    setPrecio2Activo(false);
    setPrecio2(0);
    setPrecio2Antes(0);
    setPais("CO")
    if (form) {
      form.reset();
    }
  }

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

  const data = {
    nombre,
    precio: Number(form.get("precio") || 0),
    precioAntes: Number(form.get("precioAntes") || 0),
    imagen: imagenPrincipal,
      pais: pais,  // 👈 AGREGAR ESTA LÍNEA

    // ✅ Enviar precio2 como objeto anidado
    precio2: {
      activo: precio2Activo,
      precio: Number(precio2),
      precioAntes: Number(precio2Antes)
    },
    
    imagenesLanding: {
      imagen1: landing1,
      imagen2: landing2,
      imagen3: landing3,
      imagen4: landing4,
      imagen5: landing5,
    },
    mostrarContador: form.get("mostrarContador") === "on",
    minutosContador: Number(form.get("minutosContador") || 28),
    mostrarEstrellas: form.get("mostrarEstrellas") === "on",
    textoEstrellas: String(form.get("textoEstrellas") || ""),
    textoBoton: String(
      form.get("textoBoton") || "COMPRAR AHORA Y PAGAR AL RECIBIR",
    ),
    mostrarInfoCompra: form.get("mostrarInfoCompra") === "on",
    textoDescuento: String(
      form.get("textoDescuento") ||
      "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS",
    ),
    queIncluye: String(form.get("queIncluye") || ""),
    informacionEnvio: String(form.get("informacionEnvio") || ""),
    devolucionesReembolsos: String(form.get("devolucionesReembolsos") || ""),
    mostrarResenas: form.get("mostrarResenas") === "on",
    preguntasFrecuentes: [
      {
        pregunta: String(form.get("faqPregunta1") || ""),
        respuesta: String(form.get("faqRespuesta1") || ""),
      },
      {
        pregunta: String(form.get("faqPregunta2") || ""),
        respuesta: String(form.get("faqRespuesta2") || ""),
      },
      {
        pregunta: String(form.get("faqPregunta3") || ""),
        respuesta: String(form.get("faqRespuesta3") || ""),
      },
    ].filter((faq) => faq.pregunta || faq.respuesta),
    activo: true,
  };

  try {
    if (editando) {
      await api.patch(`/productos/${editando.id}`, data);
      alert("✅ Producto actualizado");
    } else {
      await api.post("/productos", data);
      alert("✅ Producto creado");
    }

    limpiarFormulario(e.currentTarget);
    await cargarProductos();
  } catch (error) {
    console.error(error);
    alert("❌ Error guardando producto");
  } finally {
    setLoading(false);
  }
}

  async function eliminarProducto(id: string) {
    if (!confirm("⚠️ ¿Eliminar este producto?")) return;

    try {
      await api.delete(`/productos/${id}`);
      await cargarProductos();
      alert("✅ Producto eliminado");
    } catch (error) {
      console.error(error);
      alert("❌ Error eliminando producto");
    }
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Header simplificado */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  📦 Productos
                </h1>
                <p className="text-gray-400 text-sm mt-0.5">
                  Gestionar productos
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

          {/* Formulario - Simplificado pero funcional */}
          <form
            onSubmit={guardarProducto}
            className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4"
          >
            {/* Nombre y precios */}
            {/* Nombre del producto */}
            <input
              name="nombre"
              placeholder="📝 Nombre del producto"
              defaultValue={editando?.nombre || ""}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              required
            />

{/* 👇 SELECTOR DE PAÍS - AGREGAR ESTO */}
<div className="border border-gray-700 rounded-lg p-4 space-y-3">
  <h3 className="text-md font-semibold text-gray-300">🌎 País de venta</h3>
  <div className="flex gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="pais"
        value="CO"
        checked={pais === "CO"}
        onChange={(e) => setPais(e.target.value as "CO")}
        className="w-4 h-4 accent-purple-600"
      />
      <span className="text-white">🇨🇴 Colombia</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="pais"
        value="EC"
        checked={pais === "EC"}
        onChange={(e) => setPais(e.target.value as "EC")}
        className="w-4 h-4 accent-purple-600"
      />
      <span className="text-white">🇪🇨 Ecuador</span>
    </label>
  </div>
</div>
            {/* PRECIO 1 UNIDAD (siempre activo) */}
            <div className="border border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="text-md font-semibold text-gray-300">💰 Precio 1 Unidad</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="precio"
                  type="number"
                  placeholder="💰 Precio"
                  defaultValue={editando?.precio || ""}
                  className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
                <input
                  name="precioAntes"
                  type="number"
                  placeholder="🏷️ Precio antes (tachado)"
                  defaultValue={editando?.precioAntes || ""}
                  className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* PRECIO 2 UNIDADES (opcional con checkbox) */}
            <div className="border border-purple-600 rounded-lg p-4 space-y-3 bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-purple-400">🎁 Precio 2 Unidades</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-gray-300 text-sm">Activar</span>
                  <input
                    type="checkbox"
                    checked={precio2Activo}
                    onChange={(e) => setPrecio2Activo(e.target.checked)}
                    className="w-5 h-5 accent-purple-600"
                  />
                </label>
              </div>

              {precio2Activo && (
                <div className="space-y-3 pl-4 border-l-2 border-purple-500">
                  <p className="text-gray-400 text-sm">Configura el precio especial para 2 unidades</p>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="💰 Precio 2 unidades"
                      value={precio2}
                      onChange={(e) => setPrecio2(Number(e.target.value))}
                      className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="number"
                      placeholder="🏷️ Precio antes (tachado)"
                      value={precio2Antes}
                      onChange={(e) => setPrecio2Antes(Number(e.target.value))}
                      className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Configuración Landing */}
            <div className="border border-gray-700 rounded-lg p-4 space-y-3">
              <h2 className="text-lg font-bold text-white">
                ⚙️ Configuración Landing
              </h2>

              {/* Contenedor precio/envío */}
              <div className="border border-gray-700 rounded-lg p-4 space-y-3">
                <h3 className="text-md font-semibold text-gray-300">
                  📦 Contenedor compra
                </h3>

                <label className="flex gap-2 items-center text-gray-300">
                  <input
                    type="checkbox"
                    name="mostrarInfoCompra"
                    defaultChecked={editando?.mostrarInfoCompra ?? true}
                    className="w-4 h-4"
                  />
                  Mostrar contenedor compra
                </label>

                <input
                  name="textoDescuento"
                  placeholder="🎯 Texto descuento"
                  defaultValue={
                    editando?.textoDescuento ||
                    "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS"
                  }
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />

                <textarea
                  name="queIncluye"
                  placeholder="📦 ¿Qué incluye?"
                  defaultValue={editando?.queIncluye || ""}
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />

                <textarea
                  name="informacionEnvio"
                  placeholder="🚚 Información de envío"
                  defaultValue={editando?.informacionEnvio || ""}
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />

                <textarea
                  name="devolucionesReembolsos"
                  placeholder="🔄 Devoluciones y reembolsos"
                  defaultValue={editando?.devolucionesReembolsos || ""}
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              {/* Contador */}
              <div className="space-y-2">
                <label className="flex gap-2 items-center text-gray-300">
                  <input
                    type="checkbox"
                    name="mostrarContador"
                    defaultChecked={editando?.mostrarContador ?? true}
                    className="w-4 h-4"
                  />
                  ⏱️ Mostrar contador
                </label>

                <input
                  name="minutosContador"
                  type="number"
                  placeholder="Minutos contador"
                  defaultValue={editando?.minutosContador || 28}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              {/* Estrellas */}
              <div className="space-y-2">
                <label className="flex gap-2 items-center text-gray-300">
                  <input
                    type="checkbox"
                    name="mostrarEstrellas"
                    defaultChecked={editando?.mostrarEstrellas ?? true}
                    className="w-4 h-4"
                  />
                  ⭐ Mostrar barra estrellas
                </label>

                <input
                  name="textoEstrellas"
                  placeholder="+100.000 Colombianos arreglaron sus uñas"
                  defaultValue={editando?.textoEstrellas || ""}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              {/* Botón */}
              <input
                name="textoBoton"
                placeholder="🔘 Texto botón"
                defaultValue={
                  editando?.textoBoton || "COMPRAR AHORA Y PAGAR AL RECIBIR"
                }
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />
              {/* Reseñas */}

              <div className="space-y-2 border border-gray-700 rounded-lg p-4">
                <label className="flex gap-2 items-center text-gray-300">
                  <input
                    type="checkbox"
                    name="mostrarResenas"
                    defaultChecked={editando?.mostrarResenas ?? true}
                    className="w-4 h-4"
                  />
                  ⭐ Mostrar reseñas
                </label>
              </div>

              {/* FAQs */}

              <div className="border border-gray-700 rounded-lg p-4 space-y-4">
                <h3 className="text-md font-semibold text-gray-300">
                  ❓ Preguntas frecuentes
                </h3>

                {[1, 2, 3].map((num, index) => (
                  <div key={num} className="space-y-2">
                    <input
                      name={`faqPregunta${num}`}
                      placeholder={`Pregunta ${num}`}
                      defaultValue={
                        editando?.preguntasFrecuentes?.[index]?.pregunta || ""
                      }
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />

                    <textarea
                      name={`faqRespuesta${num}`}
                      placeholder={`Respuesta ${num}`}
                      defaultValue={
                        editando?.preguntasFrecuentes?.[index]?.respuesta || ""
                      }
                      rows={3}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Imágenes */}
            <div className="grid grid-cols-2 gap-4">
              {/* Imagen Principal */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2">🖼️ Imagen principal</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => subirImagen(e, setImagenPrincipal)}
                  className="text-gray-400 text-sm w-full text-ellipsis"
                />
                {imagenPrincipal && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={imagenPrincipal}
                      alt="Principal"
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

              {/* Landing 1 */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2">📸 Landing 1</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => subirImagen(e, setLanding1)}
                  className="text-gray-400 text-sm w-full text-ellipsis"
                />
                {landing1 && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={landing1}
                      alt="Landing 1"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setLanding1("")}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Landing 2 */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2">📸 Landing 2</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => subirImagen(e, setLanding2)}
                  className="text-gray-400 text-sm w-full text-ellipsis"
                />
                {landing2 && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={landing2}
                      alt="Landing 2"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setLanding2("")}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Landing 3 */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2">📸 Landing 3</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => subirImagen(e, setLanding3)}
                  className="text-gray-400 text-sm w-full text-ellipsis"
                />
                {landing3 && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={landing3}
                      alt="Landing 3"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setLanding3("")}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Landing 4 */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2">📸 Landing 4</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => subirImagen(e, setLanding4)}
                  className="text-gray-400 text-sm w-full text-ellipsis"
                />
                {landing4 && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={landing4}
                      alt="Landing 4"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setLanding4("")}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Landing 5 */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2">📸 Landing 5</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => subirImagen(e, setLanding5)}
                  className="text-gray-400 text-sm w-full text-ellipsis"
                />
                {landing5 && (
                  <div className="relative inline-block mt-2">
                    <img
                      src={landing5}
                      alt="Landing 5"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setLanding5("")}
                      className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>


            {imagenSubiendo && (
              <p className="text-blue-400 text-sm">⏳ Subiendo imagen...</p>
            )}
            <div className="border border-gray-700 rounded-lg p-4 space-y-4">
              <label className="flex gap-2 items-center text-gray-300">
                <input
                  type="checkbox"
                  name="mostrarResenas"
                  defaultChecked={editando?.mostrarResenas ?? true}
                  className="w-4 h-4"
                />
                ⭐ Mostrar reseñas automáticas
              </label>
            </div>
            {/* Botones */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || imagenSubiendo}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading
                  ? "⏳ Guardando..."
                  : editando
                    ? "✏️ Actualizar producto"
                    : "➕ Crear producto"}
              </button>

              {editando && (
                <button
                  type="button"
                  onClick={() => limpiarFormulario()}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista de productos */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white mb-4">
              📋 Productos existentes
            </h2>

            {productos.map((producto) => (
              <div
                key={producto.id}
                className="bg-gray-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between"
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
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
                  <button
                    onClick={() => cargarParaEditar(producto)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors"
                  >
                    ✏️ Editar
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

            {productos.length === 0 && (
              <div className="text-center py-12 bg-gray-800 rounded-xl">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-gray-400">No hay productos aún</p>
                <p className="text-gray-500 text-sm mt-1">
                  Crea tu primer producto con el formulario
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}
