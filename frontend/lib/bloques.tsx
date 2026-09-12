"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type Bloque = {
  id: string;
  tipo: string;
  props: Record<string, any>;
};

export type Tema = {
  colorPrimario: string;
  colorFondo: string;
  tipografia: string;
  anchoMax: number;
};

export type Plantilla = {
  version: number;
  bloques: Bloque[];       // legacy (versión 2)
  secciones?: Seccion[];   // nuevo (versión 3)
  tema: Tema;
};

export type PropSchema = {
  key: string;
  label: string;
  tipo: "text" | "textarea" | "number" | "toggle" | "color" | "imagen" | "repeater" | "select";
  options?: string[];
};

export type BloqueDef = {
  nombre: string;
  icono: string;
  max: number;                          // instancias máximas (0 = sin límite)
  defaults: Record<string, any>;        // props por defecto
  schema: PropSchema[];                 // para generar el panel de edición
  Render: (props: any) => React.ReactNode;
};

// ═══════════════════════════════════════════════════════════════
// RENDERERS (componentes puros — sin tracking, sin cookies)
// ═══════════════════════════════════════════════════════════════

function useContador(minutosIniciales: number, activo: boolean) {
  const [tiempo, setTiempo] = useState({
    horas: 0,
    minutos: minutosIniciales,
    segundos: 59,
  });
  useEffect(() => {
    if (!activo) return;
    setTiempo({ horas: 0, minutos: minutosIniciales, segundos: 59 });
    const id = setInterval(() => {
      setTiempo((prev) => {
        let { horas, minutos, segundos } = prev;
        if (segundos > 0) segundos--;
        else {
          segundos = 59;
          if (minutos > 0) minutos--;
          else {
            minutos = 59;
            if (horas > 0) horas--;
            else {
              horas = 0;
              minutos = minutosIniciales;
              segundos = 59;
            }
          }
        }
        return { horas, minutos, segundos };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [minutosIniciales, activo]);
  return tiempo;
}

function BannerContador({ minutos, colorBanner, texto }: any) {
  const tiempo = useContador(Number(minutos ?? 28), true);
  return (
    <section
      className="text-white py-3"
      style={{ backgroundColor: colorBanner || "#E06000" }}
    >
      <div className="flex items-center justify-center gap-4">
        <div className="text-center font-black italic leading-tight text-sm md:text-xl whitespace-pre-line">
          {texto || "DESCUENTO POR\nTIEMPO LIMITADO"}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white text-black rounded-xl px-4 py-3 text-xl font-black">
            {String(tiempo.horas).padStart(2, "0")}
          </div>
          <span className="font-black text-xl">:</span>
          <div className="bg-white text-black rounded-xl px-4 py-3 text-xl font-black">
            {String(tiempo.minutos).padStart(2, "0")}
          </div>
          <span className="font-black text-xl">:</span>
          <div className="bg-white text-black rounded-xl px-4 py-3 text-xl font-black">
            {String(tiempo.segundos).padStart(2, "0")}
          </div>
        </div>
      </div>
    </section>
  );
}

function BarraEstrellas({ texto }: any) {
  return (
    <div className="bg-white text-black text-center text-sm md:text-base font-bold py-1">
      ⭐⭐⭐⭐⭐ {texto || "+100.000 clientes satisfechos"}
    </div>
  );
}

function HeroImagen({ url, alt }: any) {
  if (!url) return null;
  return (
    <Image
      src={url}
      alt={alt || ""}
      width={1200}
      height={1600}
      sizes="100vw"
      className="w-full h-auto"
    />
  );
}

function BotonComprar({ texto, subtitulo, color, onComprar, flotante }: any) {
  const svgCarrito = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-6 h-6 fill-white shrink-0"
    >
      <path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );

  // 👇 Si es flotante → botón fijo abajo
  if (flotante) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <button
          onClick={onComprar}
          className="w-full flex items-center justify-center gap-3 text-white py-3.5 rounded-xl font-extrabold uppercase btn-shake hover:scale-[1.01] transition"
          style={{ backgroundColor: color || "#cb1515" }}
        >
          {svgCarrito}
          <div className="flex flex-col leading-tight">
            <span className="text-[14px] md:text-[16px]">
              {texto || "PEDIR AHORA Y PAGAR AL RECIBIR"}
            </span>
            {subtitulo && (
              <span className="text-[10px] md:text-[11px] font-medium opacity-90 normal-case">
                {subtitulo}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  // 👇 Si NO es flotante → botón inline (como hoy)
  return (
    <button
      onClick={onComprar}
      className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden btn-shake hover:scale-[1.01] transition"
      style={{ backgroundColor: color || "#cb1515" }}
    >
      {svgCarrito}
      <div className="flex flex-col leading-tight">
        <span className="text-[15px] md:text-[18px]">
          {texto || "PEDIR AHORA Y PAGAR AL RECIBIR"}
        </span>
        {subtitulo && (
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">
            {subtitulo}
          </span>
        )}
      </div>
    </button>
  );
}

function BloqueCompra({ textoDescuento, queIncluye, informacionEnvio, devoluciones, precio }: any) {
  return (
    <section className="bg-[#121212] text-white p-6 text-center">
      {textoDescuento && (
        <h2 className="text-2xl md:text-4xl font-black leading-tight">
          {textoDescuento}
        </h2>
      )}
      {typeof precio === "number" && (
        <h3 className="text-2xl md:text-4xl font-black mt-3">
          PRECIO FINAL <span className="text-red-600">${precio.toFixed(2)}</span>
        </h3>
      )}
      <div className="mt-8 text-left max-w-3xl mx-auto divide-y divide-[#2a2a2a]">
        {queIncluye && (
          <details className="p-5">
            <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
              <span>📦 ¿Qué incluye?</span>
              <span>▼</span>
            </summary>
            <p className="mt-4 text-gray-200">{queIncluye}</p>
          </details>
        )}
        {informacionEnvio && (
          <details className="p-5">
            <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
              <span>🚚 Información de envío</span>
              <span>▼</span>
            </summary>
            <p className="mt-4 text-gray-200">{informacionEnvio}</p>
          </details>
        )}
        {devoluciones && (
          <details className="p-5">
            <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
              <span>↩️ Devoluciones y reembolsos</span>
              <span>▼</span>
            </summary>
            <p className="mt-4 text-gray-200">{devoluciones}</p>
          </details>
        )}
      </div>
    </section>
  );
}

function PruebaSocial({ ordenesHoy, opinionesVerificadas, caracteristicas, beneficios }: any) {
  return (
    <section className="px-6 pt-3 pb-8 text-center bg-white">
      {ordenesHoy > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-black text-black tracking-tight uppercase">
            +{ordenesHoy} ÓRDENES HOY
          </span>
        </div>
      )}
      {opinionesVerificadas > 0 && (
        <div className="flex flex-col items-start gap-1 mb-3">
          <span className="text-gray-500 text-xs">
            ({Number(opinionesVerificadas).toLocaleString("es-CO")} Opiniones verificadas)
          </span>
        </div>
      )}
      {caracteristicas && (
        <p className="text-[#D66700] font-bold text-sm md:text-base mt-2 whitespace-pre-line text-left">
          {caracteristicas}
        </p>
      )}
      {Array.isArray(beneficios) && beneficios.length > 0 && (
        <div className="mt-6 space-y-3 text-left max-w-md mx-auto">
          {beneficios.map((b: any, i: number) => {
            if (!b.titulo && !b.descripcion) return null;
            return (
              <div key={i} className="flex items-start gap-3">
                <span className="text-[#D66700] text-lg flex-shrink-0">✓</span>
                <p className="text-[#181818] text-sm md:text-base">
                  <strong>{b.titulo}</strong>
                  {b.descripcion && <>: {b.descripcion}</>}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Faqs({ titulo, items }: any) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <section className="bg-[#121212] p-6">
      <h2 className="text-white text-3xl font-bold text-center mb-6">
        {titulo || "Preguntas frecuentes"}
      </h2>
      <div className="space-y-4">
        {items.map((faq: any, i: number) => {
          if (!faq.pregunta) return null;
          return (
            <div key={i} className="bg-white rounded-xl p-4">
              <h3 className="text-[#121212] font-bold">{faq.pregunta}</h3>
              <p className="text-[#121212]">{faq.respuesta}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Resenas({ titulo, items }: any) {
  if (!Array.isArray(items) || !items.length) return null;
  return (
    <section className="bg-white text-black p-6">
      <h2 className="text-3xl font-black text-center mb-6">
        {titulo || "Opiniones de clientes"}
      </h2>
      <div className="space-y-4">
        {items.map((r: any, i: number) => (
          <div key={i} className="border rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-bold">{r.nombre}</h3>
                <p className="text-sm text-gray-500">
                  {r.ciudad} · {r.fecha}
                </p>
              </div>
              {r.verificado && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                  Verificado
                </span>
              )}
            </div>
            <div className="text-yellow-500 mb-2">
              {"⭐".repeat(Number(r.puntuacion || 5))}
            </div>
            <p className="text-gray-700">{r.resena}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
function CabeceraProducto({
  titulo,
  mostrarPrecio,
  mostrarPrecioAntes,
  mostrarBadge,
  textoBadge,
  colorTitulo,
  colorPrecio,
  colorPrecioAntes,
  colorBadgeTexto,
  colorBadgeBorde,
  colorBadgeFondo,
  tamanioTitulo,
  alineacion,
  producto,
}: any) {
  const precio = Number(producto?.precio || 0);
  const precioAntes = Number(producto?.precioAntes || 0);

  const textoFinal = titulo?.trim() || producto?.nombre || "Producto";

  const calcularDescuento = () => {
    if (!precioAntes || precioAntes <= precio) return null;
    return Math.round(((precioAntes - precio) / precioAntes) * 100);
  };

  const descuento = calcularDescuento();
  const textoBadgeFinal =
    textoBadge === "auto" || !textoBadge
      ? descuento
        ? `$${Math.round(precioAntes - precio)} OFF`
        : null
      : textoBadge;

  const tamanios: Record<string, string> = {
    sm: "text-lg",
    md: "text-xl md:text-2xl",
    lg: "text-2xl md:text-3xl",
    xl: "text-3xl md:text-4xl",
  };
  const claseTitulo = tamanios[tamanioTitulo || "lg"] || tamanios.lg;

  const alineaciones: Record<string, string> = {
    izq: "items-start text-left",
    centro: "items-center text-center",
    der: "items-end text-right",
  };
  const claseAlineacion = alineaciones[alineacion || "izq"] || alineaciones.izq;

  return (
    <section className={`px-6 py-5 flex flex-col gap-3 ${claseAlineacion}`}>
      <h1
        className={`font-black leading-tight ${claseTitulo}`}
        style={{ color: colorTitulo || "#121212" }}
      >
        {textoFinal}
      </h1>

      <div className="flex items-center gap-3 flex-wrap">
        {mostrarPrecio !== false && (
          <span
            className="text-2xl md:text-3xl font-black"
            style={{ color: colorPrecio || "#1d4ed8" }}
          >
            ${precio.toFixed(2)}
          </span>
        )}

        {mostrarPrecioAntes !== false && precioAntes > 0 && (
          <span
            className="text-lg md:text-xl font-semibold line-through"
            style={{ color: colorPrecioAntes || "#a1a1a1" }}
          >
            ${precioAntes.toFixed(2)}
          </span>
        )}

        {mostrarBadge !== false && textoBadgeFinal && (
          <span
            className="px-3 py-1 rounded-full border-2 border-dashed text-sm font-bold"
            style={{
              color: colorBadgeTexto || "#cb1515",
              borderColor: colorBadgeBorde || "#cb1515",
              backgroundColor: colorBadgeFondo || "#fef2f2",
            }}
          >
            {textoBadgeFinal}
          </span>
        )}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// REGISTRY — fuente única de verdad
// ═══════════════════════════════════════════════════════════════

export const BLOQUES: Record<string, BloqueDef> = {
  banner_contador: {
    nombre: "Banner contador",
    icono: "⏱️",
    max: 1,
    defaults: {
      texto: "DESCUENTO POR\nTIEMPO LIMITADO",
      minutos: 28,
      colorBanner: "#E06000",
    },
    schema: [
      { key: "texto", label: "Texto", tipo: "textarea" },
      { key: "minutos", label: "Minutos", tipo: "number" },
      { key: "colorBanner", label: "Color del banner", tipo: "color" },
    ],
    Render: BannerContador,
  },

  barra_estrellas: {
    nombre: "Barra de estrellas",
    icono: "⭐",
    max: 1,
    defaults: { texto: "+100.000 clientes satisfechos" },
    schema: [{ key: "texto", label: "Texto", tipo: "text" }],
    Render: BarraEstrellas,
  },

  hero_imagen: {
    nombre: "Imagen",
    icono: "🖼️",
    max: 0,
    defaults: { url: "", alt: "" },
    schema: [
      { key: "url", label: "Imagen", tipo: "imagen" },
      { key: "alt", label: "Texto alternativo (SEO)", tipo: "text" },
    ],
    Render: HeroImagen,
  },

  boton_comprar: {
    nombre: "Botón comprar",
    icono: "🛒",
    max: 0,
    defaults: {
      texto: "PEDIR AHORA Y PAGAR AL RECIBIR",
      subtitulo: "",
      color: "#cb1515",
          flotante: false,             // 👈 NUEVO

    },
    schema: [
      { key: "texto", label: "Texto principal", tipo: "text" },
      { key: "subtitulo", label: "Subtítulo", tipo: "text" },
      { key: "color", label: "Color", tipo: "color" },
          { key: "flotante", label: "📌 Fijo abajo (flotante)", tipo: "toggle" },   // 👈 NUEVO

    ],
    Render: BotonComprar,
  },

  bloque_compra: {
    nombre: "Bloque de compra (acordeón)",
    icono: "💰",
    max: 3,
    defaults: {
      textoDescuento: "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS",
      queIncluye: "",
      informacionEnvio: "",
      devoluciones: "",
    },
    schema: [
      { key: "textoDescuento", label: "Texto descuento", tipo: "textarea" },
      { key: "queIncluye", label: "¿Qué incluye?", tipo: "textarea" },
      { key: "informacionEnvio", label: "Información de envío", tipo: "textarea" },
      { key: "devoluciones", label: "Devoluciones y reembolsos", tipo: "textarea" },
    ],
    Render: BloqueCompra,
  },

  prueba_social: {
    nombre: "Prueba social",
    icono: "🔥",
    max: 2,
    defaults: {
      ordenesHoy: 137,
      opinionesVerificadas: 1247,
      caracteristicas: "",
      beneficios: [],
    },
    schema: [
      { key: "ordenesHoy", label: "Órdenes hoy", tipo: "number" },
      { key: "opinionesVerificadas", label: "Opiniones verificadas", tipo: "number" },
      { key: "caracteristicas", label: "Características destacadas", tipo: "textarea" },
      { key: "beneficios", label: "Checklist de beneficios", tipo: "repeater" },
    ],
    Render: PruebaSocial,
  },

  faqs: {
    nombre: "Preguntas frecuentes",
    icono: "❓",
    max: 2,
    defaults: { titulo: "Preguntas frecuentes", items: [] },
    schema: [
      { key: "titulo", label: "Título", tipo: "text" },
      { key: "items", label: "Preguntas", tipo: "repeater" },
    ],
    Render: Faqs,
  },

  resenas: {
    nombre: "Reseñas",
    icono: "🌟",
    max: 2,
    defaults: { titulo: "Opiniones de clientes", items: [] },
    schema: [
      { key: "titulo", label: "Título", tipo: "text" },
      { key: "items", label: "Reseñas", tipo: "repeater" },
    ],
    Render: Resenas,
  },
    cabecera_producto: {
    nombre: "Cabecera de producto",
    icono: "🏷️",
    max: 1,
    defaults: {
      titulo: "",
      mostrarPrecio: true,
      mostrarPrecioAntes: true,
      mostrarBadge: true,
      textoBadge: "auto",
      colorTitulo: "#121212",
      colorPrecio: "#1d4ed8",
      colorPrecioAntes: "#a1a1a1",
      colorBadgeTexto: "#cb1515",
      colorBadgeBorde: "#cb1515",
      colorBadgeFondo: "#fef2f2",
      tamanioTitulo: "lg",
      alineacion: "izq",
    },
    schema: [
      { key: "titulo", label: "Título (vacío = nombre del producto)", tipo: "text" },
      { key: "tamanioTitulo", label: "Tamaño del título", tipo: "select", options: ["sm", "md", "lg", "xl"] },
      { key: "alineacion", label: "Alineación", tipo: "select", options: ["izq", "centro", "der"] },
      { key: "mostrarPrecio", label: "Mostrar precio actual", tipo: "toggle" },
      { key: "colorPrecio", label: "Color del precio", tipo: "color" },
      { key: "mostrarPrecioAntes", label: "Mostrar precio antes", tipo: "toggle" },
      { key: "colorPrecioAntes", label: "Color del precio antes", tipo: "color" },
      { key: "mostrarBadge", label: "Mostrar badge de descuento", tipo: "toggle" },
      { key: "textoBadge", label: 'Texto del badge ("auto" calcula OFF)', tipo: "text" },
      { key: "colorBadgeTexto", label: "Color texto badge", tipo: "color" },
      { key: "colorBadgeBorde", label: "Color borde badge", tipo: "color" },
      { key: "colorBadgeFondo", label: "Color fondo badge", tipo: "color" },
      { key: "colorTitulo", label: "Color del título", tipo: "color" },
    ],
    Render: CabeceraProducto,
  },
};
// ═══════════════════════════════════════════════════════════════
// SECCIONES (agrupan bloques)
// ═══════════════════════════════════════════════════════════════

export type TipoSeccion = "header" | "hero" | "detalles" | "testimonios" | "faq";

export type AjustesSeccion = {
  // Tamaño
  ancho: "fill" | "ajustar";
  anchoMax: number;

  // Apariencia
  colorFondo: string | null;   // null = hereda del tema

  // Bordes 
  radioEsquinas: number;

  // Relleno
  paddingArriba: number;
  paddingAbajo: number;
  paddingLados: number;
};

export type Seccion = {
  id: string;
  tipo: TipoSeccion;
  nombre: string;
  visible: boolean;
  bloques: Bloque[];
  ajustes: AjustesSeccion;   // 👈 NUEVO
};

// Valores por defecto para las secciones nuevas o migradas
export const AJUSTES_DEFAULT: AjustesSeccion = {
  ancho: "fill",
  anchoMax: 480,
  colorFondo: null,
  radioEsquinas: 0,
  paddingArriba: 0,
  paddingAbajo: 0,
  paddingLados: 0,
};

export type SeccionDef = {
  tipo: TipoSeccion;
  nombre: string;
  icono: string;
  bloquesPermitidos: string[];   // qué tipos de bloque pueden ir aquí
};

// Catálogo de secciones fijas
export const SECCIONES: Record<TipoSeccion, SeccionDef> = {
  header: {
    tipo: "header",
    nombre: "Encabezado",
    icono: "🧭",
    bloquesPermitidos: ["banner_contador", "barra_estrellas"],
  },
  hero: {
    tipo: "hero",
    nombre: "Producto",
    icono: "🎯",
    bloquesPermitidos: ["cabecera_producto", "hero_imagen", "prueba_social"],
  },
  detalles: {
    tipo: "detalles",
    nombre: "Compra",
    icono: "💰",
    bloquesPermitidos: ["bloque_compra", "boton_comprar"],
  },
  testimonios: {
    tipo: "testimonios",
    nombre: "Testimonios",
    icono: "⭐",
    bloquesPermitidos: ["prueba_social", "resenas"],
  },
  faq: {
    tipo: "faq",
    nombre: "Preguntas",
    icono: "❓",
    bloquesPermitidos: ["faqs"],
  },
};

// Orden canónico de las secciones en la landing
export const ORDEN_SECCIONES: TipoSeccion[] = [
  "header",
  "hero",
  "detalles",
  "testimonios",
  "faq",
];

// Dónde va cada bloque si se migra desde el formato viejo plano
const BLOQUE_A_SECCION: Record<string, TipoSeccion> = {
  banner_contador: "header",
  barra_estrellas: "header",
  cabecera_producto: "hero",
  hero_imagen: "hero",
  prueba_social: "hero",
  bloque_compra: "detalles",
  boton_comprar: "detalles",
  resenas: "testimonios",
  faqs: "faq",
};
// ═══════════════════════════════════════════════════════════════
// MIGRACIÓN — convierte un producto viejo a Plantilla con bloques
// ═══════════════════════════════════════════════════════════════

const ORDEN_DEFAULT = [
  "banner_contador",
  "barra_estrellas",
  "galeria_y_compra",
  "faqs",
  "resenas",
];

export function construirPlantilla(producto: any): Plantilla {
  const diseno = producto.disenoLanding === "moderno" ? "disenoModerno" : "disenoClasico";
  const cfg = producto[diseno] || {};
  const orden: string[] = cfg.ordenSecciones?.length ? cfg.ordenSecciones : ORDEN_DEFAULT;
  const img = producto.imagenesLanding || {};
  const bloques: Bloque[] = [];
  const newId = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `b_${Math.random().toString(36).slice(2)}_${Date.now()}`;

  for (const key of orden) {
    if (key === "banner_contador" && cfg.mostrarContador !== false) {
      bloques.push({
        id: newId(),
        tipo: "banner_contador",
        props: {
          texto: "DESCUENTO POR\nTIEMPO LIMITADO",
          minutos: Number(cfg.minutosContador) || 28,
          colorBanner: cfg.colorBanner || "#E06000",
        },
      });
    }

    if (key === "barra_estrellas" && cfg.mostrarEstrellas !== false) {
      bloques.push({
        id: newId(),
        tipo: "barra_estrellas",
        props: { texto: cfg.textoEstrellas || "+100.000 clientes satisfechos" },
      });
    }

    if (key === "galeria_y_compra") {
      // Descompone el monolítico en atómicos
      if (img.imagen1) {
        bloques.push({
          id: newId(),
          tipo: "hero_imagen",
          props: { url: img.imagen1, alt: producto.nombre || "" },
        });
      }

      bloques.push({
        id: newId(),
        tipo: "boton_comprar",
        props: {
          texto: cfg.textoBoton || "PEDIR AHORA Y PAGAR AL RECIBIR",
          subtitulo: "",
          color: "#cb1515",
        },
      });

      if (cfg.mostrarInfoCompra !== false) {
        bloques.push({
          id: newId(),
          tipo: "bloque_compra",
          props: {
            textoDescuento: cfg.textoDescuento || "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS",
            queIncluye: cfg.queIncluye || "",
            informacionEnvio: cfg.informacionEnvio || "",
            devoluciones: cfg.devolucionesReembolsos || "",
          },
        });

        bloques.push({
          id: newId(),
          tipo: "boton_comprar",
          props: {
            texto: cfg.textoBoton || "PEDIR AHORA Y PAGAR AL RECIBIR",
            subtitulo: "",
            color: "#cb1515",
          },
        });
      }

      // Imágenes 2-5, con botón entre cada una (igual que hoy)
      for (const i of [2, 3, 4, 5]) {
        const url = img[`imagen${i}`];
        if (!url) continue;
        bloques.push({
          id: newId(),
          tipo: "hero_imagen",
          props: { url, alt: producto.nombre || "" },
        });
        bloques.push({
          id: newId(),
          tipo: "boton_comprar",
          props: {
            texto: cfg.textoBoton || "PEDIR AHORA Y PAGAR AL RECIBIR",
            subtitulo: "",
            color: "#cb1515",
          },
        });
      }
    }

    if (key === "faqs" && producto.preguntasFrecuentes?.length) {
      bloques.push({
        id: newId(),
        tipo: "faqs",
        props: {
          titulo: "Preguntas frecuentes",
          items: producto.preguntasFrecuentes,
        },
      });
    }

    if (key === "resenas" && producto.mostrarResenas !== false && producto.resenas?.length) {
      bloques.push({
        id: newId(),
        tipo: "resenas",
        props: {
          titulo: "Opiniones de clientes",
          items: producto.resenas,
        },
      });
    }
  }

  // Prueba social (solo si el diseño era moderno o tiene datos)
  if (
    (cfg.mostrarOrdenesHoy || cfg.mostrarOpinionesVerificadas || cfg.caracteristicasDestacadas) &&
    diseno === "disenoModerno"
  ) {
    // Insertar después del primer botón
    const idx = bloques.findIndex((b) => b.tipo === "boton_comprar");
    const prueba: Bloque = {
      id: newId(),
      tipo: "prueba_social",
      props: {
        ordenesHoy: cfg.mostrarOrdenesHoy !== false ? Number(cfg.ordenesHoy) || 137 : 0,
        opinionesVerificadas:
          cfg.mostrarOpinionesVerificadas !== false
            ? Number(cfg.opinionesVerificadasCount) || 1247
            : 0,
        caracteristicas: cfg.caracteristicasDestacadas || "",
        beneficios: Array.isArray(cfg.beneficiosChecklist) ? cfg.beneficiosChecklist : [],
      },
    };
    bloques.splice(idx >= 0 ? idx + 1 : bloques.length, 0, prueba);
  }

  return {
    version: 2,
    bloques,
    tema: {
      colorPrimario: "#cb1515",
      colorFondo: diseno === "disenoModerno" ? "#ffffff" : "#121212",
      tipografia: "Inter",
      anchoMax: 480,
    },
  };
}
// ═══════════════════════════════════════════════════════════════
// SECCIONES — construcción y normalización
// ═══════════════════════════════════════════════════════════════

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `s_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

// Crea una sección vacía con el nombre por defecto
export function crearSeccion(tipo: TipoSeccion): Seccion {
  const def = SECCIONES[tipo];
  return {
    id: newId(),
    tipo,
    nombre: def.nombre,
    visible: true,
    bloques: [],
    ajustes: { ...AJUSTES_DEFAULT },
  };
}

// Crea las 5 secciones vacías en orden canónico
export function crearSeccionesVacias(): Seccion[] {
  return ORDEN_SECCIONES.map((tipo) => crearSeccion(tipo));
}

// Toma una plantilla vieja (bloques planos) y devuelve una nueva con secciones
export function migrarASecciones(plantilla: Plantilla): Plantilla {
  // Si ya tiene secciones, normalizarlas (agregar ajustes si faltan)
  if (Array.isArray(plantilla.secciones) && plantilla.secciones.length > 0) {
    return {
      ...plantilla,
      secciones: plantilla.secciones.map((s: any) => ({
        ...s,
        ajustes: { ...AJUSTES_DEFAULT, ...(s.ajustes || {}) },
      })),
    };
  }

  // Crear las 5 secciones vacías
  const mapa: Record<TipoSeccion, Seccion> = {} as any;
  ORDEN_SECCIONES.forEach((tipo) => {
    mapa[tipo] = crearSeccion(tipo);
  });

  // Meter cada bloque en su sección correspondiente
  for (const bloque of plantilla.bloques || []) {
    const tipoSeccion = BLOQUE_A_SECCION[bloque.tipo];
    if (tipoSeccion && mapa[tipoSeccion]) {
      mapa[tipoSeccion].bloques.push(bloque);
    } else {
      // Bloque desconocido → lo mandamos a "hero" por defecto
      mapa.hero.bloques.push(bloque);
    }
  }

  return {
    version: 3,
    bloques: plantilla.bloques || [],
    secciones: ORDEN_SECCIONES.map((t) => mapa[t]),
    tema: plantilla.tema,
  };
}
// ═══════════════════════════════════════════════════════════════
// RENDERER — puro. No dispara tracking, no lee cookies.
// ═══════════════════════════════════════════════════════════════

export function ProductRenderer({
  plantilla,
  producto,
  onComprar,
  modo = "ver",
}: {
  plantilla: Plantilla;
  producto: any;
  onComprar?: () => void;
  modo?: "ver" | "editor";
}) {
  if (!plantilla) return null;

  // 👇 Normalizar: si tiene secciones las usa, si no migra los bloques planos
  const plantillaNormalizada = migrarASecciones(plantilla);

  const precio = Number(producto?.precio || 0);

  // Función que renderiza un bloque
  function renderBloque(b: Bloque) {
    const def = BLOQUES[b.tipo];
    if (!def) return null;
    const props = { ...b.props };
    if (b.tipo === "boton_comprar") props.onComprar = onComprar;
    if (b.tipo === "bloque_compra") props.precio = precio;

    const contenido = <def.Render {...props} producto={producto} />;

    // 👇 Si estamos en modo editor, envolver para detectar hover/click
    if (modo === "editor") {
      return (
        <div
          key={b.id}
          data-bloque-id={b.id}
          style={{ position: "relative" }}
          onMouseEnter={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            window.parent.postMessage(
              {
                type: "BLOQUE_HOVER",
                id: b.id,
                rect: {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                },
              },
              "*"
            );
          }}
          onMouseLeave={() => {
            window.parent.postMessage(
              { type: "BLOQUE_LEAVE", id: b.id },
              "*"
            );
          }}
          onClick={(e) => {
            e.stopPropagation();
            window.parent.postMessage(
              { type: "BLOQUE_SELECT", id: b.id },
              "*"
            );
          }}
        >
          {contenido}
        </div>
      );
    }

    return <span key={b.id}>{contenido}</span>;
  }

  // Iterar secciones
  const secciones = plantillaNormalizada.secciones || [];
  if (secciones.length === 0) return null;

  // Detectar si hay algún botón flotante activo
  const hayBotonFlotante = secciones.some((s) =>
    s.bloques.some(
      (b) => b.tipo === "boton_comprar" && b.props.flotante === true
    )
  );

  return (
    <div style={{ paddingBottom: hayBotonFlotante ? "96px" : undefined }}>
      {secciones.map((seccion) => {
        if (!seccion.visible) return null;
        if (!seccion.bloques || seccion.bloques.length === 0) return null;

        const aj = seccion.ajustes || AJUSTES_DEFAULT;

        const style: React.CSSProperties = {
          paddingTop: aj.paddingArriba ? `${aj.paddingArriba}px` : undefined,
          paddingBottom: aj.paddingAbajo ? `${aj.paddingAbajo}px` : undefined,
          paddingLeft: aj.paddingLados ? `${aj.paddingLados}px` : undefined,
          paddingRight: aj.paddingLados ? `${aj.paddingLados}px` : undefined,
          backgroundColor: aj.colorFondo || undefined,
          borderRadius: aj.radioEsquinas ? `${aj.radioEsquinas}px` : undefined,
          width: "100%",
        };

        const containerStyle: React.CSSProperties =
          aj.ancho === "ajustar"
            ? { maxWidth: `${aj.anchoMax}px`, margin: "0 auto" }
            : {};

        return (
          <div
            key={seccion.id}
            data-seccion={seccion.tipo}
            style={containerStyle}
          >
            <div style={style}>{seccion.bloques.map(renderBloque)}</div>
          </div>
        );
      })}
    </div>
  );
}