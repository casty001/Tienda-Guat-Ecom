"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

function defaultConfig() {
  return {
    mostrarContador: true,
    minutosContador: "28",
    colorBanner: "#E06000",
    mostrarEstrellas: true,
    textoEstrellas: "+100.000 clientes satisfechos",
    textoBoton: "COMPRAR AHORA Y PAGAR AL RECIBIR",
    mostrarInfoCompra: true,
    textoDescuento: "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS",
    queIncluye: "",
    informacionEnvio: "",
    devolucionesReembolsos: "",
    mostrarOrdenesHoy: true,
    ordenesHoy: "137",
    mostrarOpinionesVerificadas: true,
    opinionesVerificadasCount: "1247",
    caracteristicasDestacadas: "",
    mostrarSubtituloModal: true,
    subtituloModal: "Por alta demanda, este pedido se reserva por pocos minutos. Finaliza tu compra antes de que se agote.",
    mostrarTextoImportanteModal: true,
    textoImportanteModal: "⚡IMPORTANTE⚡\n📲Confirmar tu pedido por WPP para poder enviarle\n📍Si prefieres retirar en Servientrega, solicita por WPP",
    beneficiosChecklist: [
      { titulo: "", descripcion: "" },
      { titulo: "", descripcion: "" },
      { titulo: "", descripcion: "" },
    ],
  };
}

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
  const [precio2Activo, setPrecio2Activo] = useState(false);
  const [precio2, setPrecio2] = useState<string>("");
  const [precio2Antes, setPrecio2Antes] = useState<string>("");
  const [textoOferta1, setTextoOferta1] = useState("1 Unidad + Regalo");
  const [textoOferta2, setTextoOferta2] = useState("2 Unidades + Regalo");

  // 👇 Qué pestaña estás VIENDO/EDITANDO en el formulario ahora mismo (solo UI)
  // 👇 Único selector: qué diseño se usa Y se está editando ahora mismo.
  const [disenoLanding, setDisenoLanding] = useState<"clasico" | "moderno">(
    "clasico",
  );

  // 👇 Config completa e independiente de cada diseño
  const [configClasico, setConfigClasico] = useState<any>(defaultConfig());
  const [configModerno, setConfigModerno] = useState<any>(defaultConfig());

  // Atajo: la config y el setter del diseño seleccionado
  const config = disenoLanding === "moderno" ? configModerno : configClasico;
  const setConfig = disenoLanding === "moderno" ? setConfigModerno : setConfigClasico;

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

  function cargarConfig(cfg: any) {
    const base = defaultConfig();

    const checklist = cfg?.beneficiosChecklist || [];

    return {
      ...base,
      ...(cfg || {}),
      beneficiosChecklist: [
        ...checklist,
        ...Array(Math.max(0, 3 - checklist.length)).fill({
          titulo: "",
          descripcion: "",
        }),
      ],
    };
  }

  function cargarParaEditar(producto: any) {
    setEditando(producto);
    setImagenPrincipal(producto.imagen || "");
    setLanding1(producto.imagenesLanding?.imagen1 || "");
    setLanding2(producto.imagenesLanding?.imagen2 || "");
    setLanding3(producto.imagenesLanding?.imagen3 || "");
    setLanding4(producto.imagenesLanding?.imagen4 || "");
    setLanding5(producto.imagenesLanding?.imagen5 || "");
    setTextoOferta1(producto.textoOferta1 || "1 Unidad + Regalo");
    setTextoOferta2(producto.textoOferta2 || "2 Unidades + Regalo");
    setPrecio2Activo(producto.precio2?.activo || false);
    setPrecio2(producto.precio2?.precio?.toString() || "");
    setPrecio2Antes(producto.precio2?.precioAntes?.toString() || "");

    const diseno = producto.disenoLanding || "clasico";
    setDisenoLanding(diseno);

    setConfigClasico(cargarConfig(producto.disenoClasico));
    setConfigModerno(cargarConfig(producto.disenoModerno));

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
    setPrecio2("");
    setPrecio2Antes("");
    setTextoOferta1("1 Unidad + Regalo");
    setTextoOferta2("2 Unidades + Regalo");
    setDisenoLanding("clasico");
    setConfigClasico(defaultConfig());
    setConfigModerno(defaultConfig());

    if (form) {
      form.reset();
    }
  }

  function buildConfigPayload(cfg: any) {
  return {
    ...cfg,
    minutosContador: Number(cfg.minutosContador) || 0,
    colorBanner: cfg.colorBanner || "#E06000",
    ordenesHoy: Number(cfg.ordenesHoy) || 0,
    opinionesVerificadasCount: Number(cfg.opinionesVerificadasCount) || 0,
    mostrarSubtituloModal: cfg.mostrarSubtituloModal ?? true,
    subtituloModal: cfg.subtituloModal || "",
    mostrarTextoImportanteModal: cfg.mostrarTextoImportanteModal ?? true,
    textoImportanteModal: cfg.textoImportanteModal || "",
    beneficiosChecklist: (cfg.beneficiosChecklist || []).map((b: any) => ({
      titulo: b.titulo || "",
      descripcion: b.descripcion || "",
    })),
  };
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

    const precio =
      parseFloat(String(form.get("precio") || "0").replace(",", ".")) || 0;
    const precioAntes =
      parseFloat(String(form.get("precioAntes") || "0").replace(",", ".")) || 0;
    const precio2Num = parseFloat(String(precio2).replace(",", ".")) || 0;
    const precio2AntesNum =
      parseFloat(String(precio2Antes).replace(",", ".")) || 0;

    const data = {
      nombre,
      precio: precio,
      precioAntes: precioAntes,
      imagen: imagenPrincipal,
      disenoLanding: disenoLanding,
      textoOferta1: textoOferta1,
      textoOferta2: textoOferta2,
      precio2: {
        activo: precio2Activo,
        precio: precio2Num,
        precioAntes: precio2AntesNum,
      },
      imagenesLanding: {
        imagen1: landing1,
        imagen2: landing2,
        imagen3: landing3,
        imagen4: landing4,
        imagen5: landing5,
      },

      // 👇 Cada diseño manda SU config, completamente independiente
      disenoClasico: buildConfigPayload(configClasico),
      disenoModerno: buildConfigPayload(configModerno),

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
          {/* Header */}
          <div className="bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white">📦 Productos</h1>
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

          <form
            onSubmit={guardarProducto}
            className="bg-gray-800 rounded-xl p-6 mb-8 space-y-4"
          >
            {/* Nombre del producto */}
            <input
              name="nombre"
              placeholder="📝 Nombre del producto"
              defaultValue={editando?.nombre || ""}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              required
            />

            {/* PRECIO 1 UNIDAD */}
            <div className="border border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="text-md font-semibold text-gray-300">
                💰 Precio 1 Unidad
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="precio"
                  type="text"
                  placeholder="💰 Precio"
                  defaultValue={editando?.precio || ""}
                  className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
                <input
                  name="precioAntes"
                  type="text"
                  placeholder="🏷️ Precio antes (tachado)"
                  defaultValue={editando?.precioAntes || ""}
                  className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* PRECIO 2 UNIDADES */}
            <div className="border border-purple-600 rounded-lg p-4 space-y-3 bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold text-purple-400">
                  🎁 Precio 2 Unidades
                </h3>
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
                  <p className="text-gray-400 text-sm">
                    Configura el precio especial para 2 unidades
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="💰 Precio 2 unidades"
                      value={precio2}
                      onChange={(e) => setPrecio2(e.target.value)}
                      className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="🏷️ Precio antes (tachado)"
                      value={precio2Antes}
                      onChange={(e) => setPrecio2Antes(e.target.value)}
                      className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border border-gray-700 rounded-lg p-4 space-y-3">
              <h3 className="text-md font-semibold text-gray-300">
                📝 Textos de ofertas
              </h3>
              <input
                type="text"
                placeholder="Texto oferta 1 unidad"
                value={textoOferta1}
                onChange={(e) => setTextoOferta1(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                placeholder="Texto oferta 2 unidades"
                value={textoOferta2}
                onChange={(e) => setTextoOferta2(e.target.value)}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* 👇 ÚNICO selector: elige el diseño de este producto.
                Al seleccionarlo, se muestra Y edita su configuración abajo.
                Es lo que se guarda como activo en la tienda al enviar. */}
            <div className="border-2 border-purple-600 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold text-white">
                  🎨 Diseño de este producto
                </h2>
                <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setDisenoLanding("clasico")}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      disenoLanding === "clasico"
                        ? "bg-purple-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Diseño 1 — Clásico
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisenoLanding("moderno")}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                      disenoLanding === "moderno"
                        ? "bg-purple-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Diseño 2 — Moderno
                  </button>
                </div>
              </div>
{/* 🚨 NUEVO: Configuración de Textos del Modal */}
<div className="border border-purple-500/40 bg-purple-950/20 rounded-lg p-4 space-y-4">
  <h3 className="text-md font-semibold text-purple-300 flex items-center gap-2">
    💬 Configuración de Textos del Modal
  </h3>

  {/* 1. Alerta Superior Modal */}
  <div className="space-y-2 border-b border-gray-700/60 pb-3">
    <label className="flex gap-2 items-center text-gray-200 cursor-pointer font-medium">
      <input
        type="checkbox"
        checked={config.mostrarSubtituloModal ?? true}
        onChange={(e) =>
          setConfig({ ...config, mostrarSubtituloModal: e.target.checked })
        }
        className="w-4 h-4 accent-purple-600"
      />
      Mostrar alerta superior en el modal
    </label>

    {config.mostrarSubtituloModal && (
      <textarea
        placeholder="Ej: Por alta demanda, este pedido se reserva por pocos minutos..."
        value={config.subtituloModal || ""}
        onChange={(e) =>
          setConfig({ ...config, subtituloModal: e.target.value })
        }
        rows={2}
        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
      />
    )}
  </div>

  {/* 2. Bloque Nota Importante Modal */}
  <div className="space-y-2">
    <label className="flex gap-2 items-center text-gray-200 cursor-pointer font-medium">
      <input
        type="checkbox"
        checked={config.mostrarTextoImportanteModal ?? true}
        onChange={(e) =>
          setConfig({
            ...config,
            mostrarTextoImportanteModal: e.target.checked,
          })
        }
        className="w-4 h-4 accent-purple-600"
      />
      Mostrar bloque de nota "IMPORTANTE" antes de enviar
    </label>

    {config.mostrarTextoImportanteModal && (
      <textarea
        placeholder="Ej: ⚡IMPORTANTE⚡&#10;📲Confirmar tu pedido por WPP..."
        value={config.textoImportanteModal || ""}
        onChange={(e) =>
          setConfig({ ...config, textoImportanteModal: e.target.value })
        }
        rows={3}
        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
      />
    )}
  </div>
</div>
              {/* Contenedor precio/envío */}
              <div className="border border-gray-700 rounded-lg p-4 space-y-3">
                <h3 className="text-md font-semibold text-gray-300">
                  📦 Contenedor compra
                </h3>

                <label className="flex gap-2 items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={config.mostrarInfoCompra}
                    onChange={(e) =>
                      setConfig({ ...config, mostrarInfoCompra: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  Mostrar contenedor compra
                </label>

                <input
                  placeholder="🎯 Texto descuento"
                  value={config.textoDescuento}
                  onChange={(e) =>
                    setConfig({ ...config, textoDescuento: e.target.value })
                  }
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />

                <textarea
                  placeholder="📦 ¿Qué incluye?"
                  value={config.queIncluye}
                  onChange={(e) =>
                    setConfig({ ...config, queIncluye: e.target.value })
                  }
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />

                <textarea
                  placeholder="🚚 Información de envío"
                  value={config.informacionEnvio}
                  onChange={(e) =>
                    setConfig({ ...config, informacionEnvio: e.target.value })
                  }
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />

                <textarea
                  placeholder="🔄 Devoluciones y reembolsos"
                  value={config.devolucionesReembolsos}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      devolucionesReembolsos: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />
              </div>

              {/* Contador */}
              <div className="space-y-2">
                <label className="flex gap-2 items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={config.mostrarContador}
                    onChange={(e) =>
                      setConfig({ ...config, mostrarContador: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  ⏱️ Mostrar contador
                </label>

                <input
                  type="number"
                  placeholder="Minutos contador"
                  value={config.minutosContador}
                  onChange={(e) =>
                    setConfig({ ...config, minutosContador: e.target.value })
                  }
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />

                {/* 🎨 NUEVO: color del banner del contador, editable desde el admin */}
                <label className="flex items-center gap-3 text-gray-300 text-sm">
                  <span>🎨 Color del banner</span>
                  <input
                    type="color"
                    value={config.colorBanner || "#E06000"}
                    onChange={(e) =>
                      setConfig({ ...config, colorBanner: e.target.value })
                    }
                    className="h-9 w-14 rounded border border-gray-600 bg-gray-700 cursor-pointer"
                  />
                  <span className="text-gray-500 text-xs">
                    {config.colorBanner || "#E06000"}
                  </span>
                </label>
              </div>

              {/* Estrellas */}
              <div className="space-y-2">
                <label className="flex gap-2 items-center text-gray-300">
                  <input
                    type="checkbox"
                    checked={config.mostrarEstrellas}
                    onChange={(e) =>
                      setConfig({ ...config, mostrarEstrellas: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  ⭐ Mostrar barra estrellas
                </label>

                <input
                  placeholder="+100.000 clientes satisfechos"
                  value={config.textoEstrellas}
                  onChange={(e) =>
                    setConfig({ ...config, textoEstrellas: e.target.value })
                  }
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>

              {/* Botón */}
              <input
                placeholder="🔘 Texto botón"
                value={config.textoBoton}
                onChange={(e) =>
                  setConfig({ ...config, textoBoton: e.target.value })
                }
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
              />

              {/* Prueba social — SOLO aplica al diseño moderno, se oculta en clásico */}
              {disenoLanding === "moderno" && (
                <div className="border border-gray-700 rounded-lg p-4 space-y-3">
                  <h3 className="text-md font-semibold text-gray-300">
                    🔥 Prueba social
                  </h3>

                  <label className="flex gap-2 items-center text-gray-300">
                    <input
                      type="checkbox"
                      checked={config.mostrarOrdenesHoy}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          mostrarOrdenesHoy: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    Mostrar "X órdenes hoy"
                  </label>
                  <input
                    type="number"
                    placeholder="137"
                    value={config.ordenesHoy}
                    onChange={(e) =>
                      setConfig({ ...config, ordenesHoy: e.target.value })
                    }
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />

                  <label className="flex gap-2 items-center text-gray-300">
                    <input
                      type="checkbox"
                      checked={config.mostrarOpinionesVerificadas}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          mostrarOpinionesVerificadas: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    Mostrar contador de opiniones verificadas
                  </label>
                  <input
                    type="number"
                    placeholder="1247"
                    value={config.opinionesVerificadasCount}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        opinionesVerificadasCount: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />

                  <textarea
                    placeholder="Característica 1 ● Característica 2 ● Característica 3"
                    value={config.caracteristicasDestacadas}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        caracteristicasDestacadas: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />

                  <p className="text-gray-400 text-sm font-semibold mt-2">
                    ✓ Checklist de beneficios
                  </p>
                  {config.beneficiosChecklist.map((b: any, i: number) => (
                    <div key={i} className="flex gap-2">
                      <input
                        placeholder="Título"
                        value={b.titulo}
                        onChange={(e) => {
                          const nuevos = [...config.beneficiosChecklist];
                          nuevos[i] = { ...nuevos[i], titulo: e.target.value };
                          setConfig({ ...config, beneficiosChecklist: nuevos });
                        }}
                        className="w-1/3 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                      <input
                        placeholder="Descripción"
                        value={b.descripcion}
                        onChange={(e) => {
                          const nuevos = [...config.beneficiosChecklist];
                          nuevos[i] = {
                            ...nuevos[i],
                            descripcion: e.target.value,
                          };
                          setConfig({ ...config, beneficiosChecklist: nuevos });
                        }}
                        className="w-2/3 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reseñas — compartidas entre diseños (dato real del producto) */}
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

            {/* FAQs — compartidas entre diseños */}
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

            {/* Imágenes — compartidas entre diseños */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2">
                  🖼️ Imagen principal
                </h3>
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
                    <p className="text-gray-500 text-xs mt-0.5">
                      🎨{" "}
                      {producto.disenoLanding === "moderno"
                        ? "Moderno"
                        : "Clásico"}
                    </p>
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