"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export type EstilosBloque = {
  // 📏 Espaciado
  paddingArriba?: number;
  paddingAbajo?: number;
  paddingLados?: number;
  marginArriba?: number;
  marginAbajo?: number;

  // 📐 Tamaño
  ancho?: "auto" | "fill" | "ajustar";
  anchoMax?: number;

  // 🎨 Apariencia
  colorFondo?: string | null; // null = sin fondo
  opacidad?: number; // 0-100

  // 🔲 Bordes
  radioEsquinas?: number;
  mostrarBorde?: boolean;
  grosorBorde?: number;
  colorBorde?: string;

  // ↔️ Alineación
  alineacion?: "izq" | "centro" | "der";

  // 🔤 Tipografía
  tamanoFuente?: number; // px
  pesoFuente?: "normal" | "bold" | "black";
  cursiva?: boolean;
  mayusculas?: boolean;
  interlineado?: number; // 1.0 - 2.5
  espaciadoLetras?: number; // px

  // 👁️ Visibilidad
  oculto?: boolean;
};

export type Bloque = {
  id: string;
  tipo: string;
  props: Record<string, any>;
  estilos?: EstilosBloque; // 👈 NUEVO
};

export type Nav = {
  mostrar: boolean;
  logoUrl: string;
  logoAltura: number;
  colorFondo: string;
  colorIconos: string;
  mostrarHamburguesa: boolean;
};

export const NAV_DEFAULT: Nav = {
  mostrar: true,
  logoUrl: "/logo.svg",
  logoAltura: 40,
  colorFondo: "#ffffff",
  colorIconos: "#000000",
  mostrarHamburguesa: true,
};

export type Tema = {
  colorPrimario: string;
  colorFondo: string;
  tipografia: string;
  anchoMax: number;
  nav: Nav; // 👈 NUEVO
};

export type Plantilla = {
  version: number;
  bloques: Bloque[]; // legacy (versión 2)
  secciones?: Seccion[]; // nuevo (versión 3)
  tema: Tema;
};

export type PropSchema = {
  key: string;
  label: string;
  tipo:
    | "text"
    | "textarea"
    | "number"
    | "toggle"
    | "color"
    | "imagen"
    | "repeater"
    | "select";
  options?: string[];
};

export type EstiloGrupo =
  | "tipografia"
  | "tamano"
  | "apariencia"
  | "bordes"
  | "relleno"
  | "margen"
  | "alineacion"
  | "visibilidad";

export type BloqueDef = {
  nombre: string;
  icono: string;
  max: number;
  defaults: Record<string, any>;
  schema: PropSchema[];
  Render: (props: any) => React.ReactNode;
  aplicaEstilos?: EstiloGrupo[]; // 👈 NUEVO
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
// ═══════════════════════════════════════════════════════════════
// HELPER: convierte las props de tipografía en CSS
// ═══════════════════════════════════════════════════════════════
function aplicarTipografia(e: EstilosBloque): React.CSSProperties {
  return {
    fontSize: e.tamanoFuente ? `${e.tamanoFuente}px` : undefined,
    fontWeight:
      e.pesoFuente === "normal"
        ? 400
        : e.pesoFuente === "bold"
          ? 700
          : e.pesoFuente === "black"
            ? 900
            : undefined,
    fontStyle: e.cursiva ? "italic" : undefined,
    textTransform: e.mayusculas ? "uppercase" : undefined,
    lineHeight: e.interlineado ?? undefined,
    letterSpacing: e.espaciadoLetras ? `${e.espaciadoLetras}px` : undefined,
  };
}
// ═══════════════════════════════════════════════════════════════
// HELPER: detecta si un color es claro u oscuro
// ═══════════════════════════════════════════════════════════════
function isColorClaro(hex: string): boolean {
  if (!hex) return true;
  const c = hex.replace("#", "");
  const full =
    c.length === 3
      ? c
          .split("")
          .map((x) => x + x)
          .join("")
      : c.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.5;
}
// ═══════════════════════════════════════════════════════════════
// NORMALIZAR COLORES
// Unifica los colores que están en props al objeto estilos
// ═══════════════════════════════════════════════════════════════

function normalizarColores(bloque: Bloque): Bloque {
  if (!bloque.estilos?.colorFondo && bloque.props) {
    const colorProp =
      bloque.tipo === "banner_contador"
        ? bloque.props.colorBanner
        : bloque.tipo === "boton_comprar"
          ? bloque.props.color
          : undefined;

    if (colorProp) {
      return {
        ...bloque,
        estilos: { ...(bloque.estilos || {}), colorFondo: colorProp },
      };
    }
  }
  return bloque;
}
// ═══════════════════════════════════════════════════════════════
// NORMALIZAR ALINEACIÓN
// Unifica props.alineacion → estilos.alineacion (una sola fuente)
// ═══════════════════════════════════════════════════════════════
function normalizarAlineacion(bloque: Bloque): Bloque {
  const propsAlign = bloque.props?.alineacion;
  const estilosAlign = bloque.estilos?.alineacion;

  // Si ya está en estilos, no tocar
  if (estilosAlign) return bloque;

  // Si está en props, moverlo
  if (propsAlign) {
    return {
      ...bloque,
      estilos: { ...(bloque.estilos || {}), alineacion: propsAlign },
    };
  }

  // Ni uno ni otro → sin alineación (el render usará "izq" por defecto)
  return bloque;
}
// ═══════════════════════════════════════════════════════════════
// NAVBAR — renderiza el nav configurable desde el tema
// ═══════════════════════════════════════════════════════════════
function NavBar({ nav, onMenuClick }: { nav: Nav; onMenuClick?: () => void }) {
  if (!nav?.mostrar) return null;

  return (
    <header
      className="sticky top-0 z-30 w-full"
      style={{
        backgroundColor: nav.colorFondo || "#ffffff",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="relative flex items-center justify-center px-4 py-3">
        {/* Hamburguesa */}
        {nav.mostrarHamburguesa && (
          <button
            type="button"
            onClick={onMenuClick}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center"
            style={{ color: nav.colorIconos || "#000000" }}
            aria-label="Menú"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* Logo centrado */}
        {nav.logoUrl ? (
          <Image
            src={nav.logoUrl}
            alt="Logo"
            width={240}
            height={80}
            priority
            style={{ height: nav.logoAltura || 40, width: "auto" }}
            className="object-contain"
          />
        ) : (
          <span
            className="font-bold text-lg"
            style={{ color: nav.colorIconos || "#000000" }}
          >
            Mi Tienda
          </span>
        )}
      </div>
    </header>
  );
}
function BannerContador({ minutos, texto, estilos = {} }: any) {
  const tiempo = useContador(Number(minutos ?? 28), true);
  const sectionStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || "#E06000",
    paddingTop: estilos.paddingArriba
      ? `${estilos.paddingArriba}px`
      : undefined,
    paddingBottom: estilos.paddingAbajo
      ? `${estilos.paddingAbajo}px`
      : undefined,
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    paddingRight: estilos.paddingLados
      ? `${estilos.paddingLados}px`
      : undefined,
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas
      ? `${estilos.radioEsquinas}px`
      : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
    maxWidth:
      estilos.ancho === "ajustar" && estilos.anchoMax
        ? `${estilos.anchoMax}px`
        : undefined,
    marginLeft: estilos.ancho === "ajustar" ? "auto" : undefined,
    marginRight: estilos.ancho === "ajustar" ? "auto" : undefined,
    border:
      estilos.mostrarBorde && estilos.grosorBorde
        ? `${estilos.grosorBorde}px solid ${estilos.colorBorde || "#e5e7eb"}`
        : undefined,
  };
  return (
    <section className="text-white py-3" style={sectionStyle}>
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

function BarraEstrellas({ texto, estilos = {} }: any) {
  const style: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || "#ffffff",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "4px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "4px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    paddingRight: estilos.paddingLados
      ? `${estilos.paddingLados}px`
      : undefined,
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas
      ? `${estilos.radioEsquinas}px`
      : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
    border:
      estilos.mostrarBorde && estilos.grosorBorde
        ? `${estilos.grosorBorde}px solid ${estilos.colorBorde || "#e5e7eb"}`
        : undefined,
  };

  // 👇 alineación configurable
  const textAlign =
    estilos.alineacion === "izq"
      ? "left"
      : estilos.alineacion === "der"
        ? "right"
        : "center";

  const textoBase = (texto ?? "").trim();
  const tieneEstrellas = /⭐/.test(textoBase);
  const contenido = textoBase
    ? tieneEstrellas
      ? textoBase
      : ` ${textoBase}`
    : " +100.000 clientes satisfechos";

  return (
    <div
      className="text-black text-sm md:text-base font-bold"
      style={{
        ...style,
        textAlign,
        whiteSpace: "pre-line", // permite saltos de línea si el admin los pone
      }}
    >
      {contenido}
    </div>
  );
}

function HeroImagen({ url, alt, estilos = {}, esPrimera = false }: any) {
  if (!url) return null;

  const wrapperStyle: React.CSSProperties = {
    paddingTop: estilos.paddingArriba
      ? `${estilos.paddingArriba}px`
      : undefined,
    paddingBottom: estilos.paddingAbajo
      ? `${estilos.paddingAbajo}px`
      : undefined,
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    paddingRight: estilos.paddingLados
      ? `${estilos.paddingLados}px`
      : undefined,
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    backgroundColor: estilos.colorFondo || undefined,
    borderRadius: estilos.radioEsquinas
      ? `${estilos.radioEsquinas}px`
      : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
  };

  return (
    <div style={wrapperStyle}>
      <Image
        src={url}
        alt={alt || ""}
        width={1200}
        height={1600}
        sizes="100vw"
        className="w-full h-auto"
        priority={esPrimera}
        loading={esPrimera ? undefined : "lazy"}
        fetchPriority={esPrimera ? "high" : undefined}
      />
    </div>
  );
}

function BotonComprar({
  texto,
  subtitulo,
  onComprar,
  flotante,
  opcionSeleccionada,
  tema, // 👈 NUEVO
  estilos = {},
}: any) {
  const svgCarrito = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-6 h-6 fill-white shrink-0"
    >
      <path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );

  // Estilos compartidos del botón real
  const buttonStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || tema?.colorPrimario || "#cb1515",
    paddingTop: estilos.paddingArriba
      ? `${estilos.paddingArriba}px`
      : undefined,
    paddingBottom: estilos.paddingAbajo
      ? `${estilos.paddingAbajo}px`
      : undefined,
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    paddingRight: estilos.paddingLados
      ? `${estilos.paddingLados}px`
      : undefined,
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius:
      estilos.radioEsquinas !== undefined
        ? `${estilos.radioEsquinas}px`
        : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
    maxWidth:
      estilos.ancho === "ajustar" && estilos.anchoMax
        ? `${estilos.anchoMax}px`
        : undefined,
    width: estilos.ancho === "fill" ? "100%" : undefined,
    border:
      estilos.mostrarBorde && estilos.grosorBorde
        ? `${estilos.grosorBorde}px solid ${estilos.colorBorde || "#e5e7eb"}`
        : undefined,
  };
  const etiquetaPrecio = opcionSeleccionada?.titulo
    ? ` · ${opcionSeleccionada.titulo}`
    : "";
  // 👇 Si es flotante → botón fijo abajo
  if (flotante) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => onComprar?.(opcionSeleccionada)}
          className="w-full flex items-center justify-center gap-3 text-white py-3.5 rounded-xl font-extrabold uppercase btn-shake hover:scale-[1.01] transition"
          style={{ ...buttonStyle, width: "100%" }}
        >
          {svgCarrito}
          <div className="flex flex-col leading-tight">
            <span className="text-[14px] md:text-[16px]">
              {texto || "PEDIR AHORA Y PAGAR AL RECIBIR"}
            </span>
            {(subtitulo || etiquetaPrecio) && (
              <span className="text-[10px] md:text-[11px] font-medium opacity-90 normal-case">
                {subtitulo}
                {etiquetaPrecio}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  // 👇 Si NO es flotante → botón inline
  // 👇 Si NO es flotante → botón inline
  return (
    <button
      onClick={() => onComprar?.(opcionSeleccionada)}
      className="mx-auto flex items-center justify-center gap-3 text-white font-extrabold uppercase shadow-lg relative overflow-hidden btn-shake hover:scale-[1.01] transition"
      style={{
        ...buttonStyle,
        paddingTop: buttonStyle.paddingTop || "16px",
        paddingBottom: buttonStyle.paddingBottom || "16px",
        paddingLeft: buttonStyle.paddingLeft || "24px",
        paddingRight: buttonStyle.paddingRight || "24px",
        borderRadius: buttonStyle.borderRadius || "6px",
        width: buttonStyle.width || "90%",
        marginTop: buttonStyle.marginTop || "24px",
        marginBottom: buttonStyle.marginBottom || "24px",
        lineHeight: aplicarTipografia(estilos).lineHeight, // 👈 hereda el lineHeight
      }}
    >
      {svgCarrito}
      <div className="flex flex-col leading-tight">
        <span style={aplicarTipografia(estilos)}>
          {" "}
          {/* 👈 aplica los estilos al span */}
          {texto || "PEDIR AHORA Y PAGAR AL RECIBIR"}
        </span>
        {subtitulo && (
          <span
            className="font-medium opacity-90 normal-case"
            style={{
              fontSize: estilos.tamanoFuente
                ? `${Math.max(10, estilos.tamanoFuente * 0.7)}px` // 👈 proporcional
                : undefined,
            }}
          >
            {subtitulo}
          </span>
        )}
      </div>
    </button>
  );
}

function BloqueCompra({
  textoDescuento,
  queIncluye,
  informacionEnvio,
  devoluciones,
  precio,
  estilos = {},
}: any) {
  const sectionStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || "#121212",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "24px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "24px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas
      ? `${estilos.radioEsquinas}px`
      : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
    border:
      estilos.mostrarBorde && estilos.grosorBorde
        ? `${estilos.grosorBorde}px solid ${estilos.colorBorde || "#e5e7eb"}`
        : undefined,
  };

  // 👇 Alineación dinámica
  const textAlign =
    estilos.alineacion === "izq"
      ? "left"
      : estilos.alineacion === "der"
        ? "right"
        : "center";

  // 👇 Tamaños base — si el admin define `tamanoFuente`, se usa
  const fontBase = estilos.tamanoFuente || 16;
  const fontTitulo = fontBase * 1.6; // título principal
  const fontSubtitulo = fontBase * 1.6; // precio final
  const fontAcordeon = fontBase * 1.15; // summary del acordeón
  const fontContenido = fontBase; // texto dentro del acordeón

  const pesoFuente =
    estilos.pesoFuente === "normal"
      ? 400
      : estilos.pesoFuente === "bold"
        ? 700
        : estilos.pesoFuente === "black"
          ? 900
          : 900; // default: negro para títulos

  const estilosTipografia: React.CSSProperties = {
    fontStyle: estilos.cursiva ? "italic" : undefined,
    textTransform: estilos.mayusculas ? "uppercase" : undefined,
    lineHeight: estilos.interlineado ?? undefined,
    letterSpacing: estilos.espaciadoLetras
      ? `${estilos.espaciadoLetras}px`
      : undefined,
  };

  return (
    <section style={{ ...sectionStyle, textAlign }}>
      {textoDescuento && (
        <h2
          style={{
            fontSize: `${fontTitulo}px`,
            fontWeight: pesoFuente,
            ...estilosTipografia,
          }}
        >
          {textoDescuento}
        </h2>
      )}

      {typeof precio === "number" && (
        <h3
          style={{
            fontSize: `${fontSubtitulo}px`,
            fontWeight: pesoFuente,
            marginTop: "12px",
            ...estilosTipografia,
          }}
        >
          PRECIO FINAL{" "}
          <span style={{ color: "#dc2626" }}>${precio.toFixed(2)}</span>
        </h3>
      )}

      <div
        className="mt-8 max-w-3xl mx-auto"
        style={{
          textAlign: "left", // el acordeón siempre a la izquierda
          borderTop: "1px solid #2a2a2a",
        }}
      >
        {queIncluye && (
          <details
            className="p-5"
            style={{ borderBottom: "1px solid #2a2a2a" }}
          >
            <summary
              className="cursor-pointer flex justify-between items-center"
              style={{
                fontSize: `${fontAcordeon}px`,
                fontWeight: 700,
                lineHeight: estilos.interlineado ?? undefined,
                letterSpacing: estilos.espaciadoLetras
                  ? `${estilos.espaciadoLetras}px`
                  : undefined,
                fontStyle: estilos.cursiva ? "italic" : undefined,
                textTransform: estilos.mayusculas ? "uppercase" : undefined,
              }}
            >
              <span>📦 ¿Qué incluye?</span>
              <span>▼</span>
            </summary>
            <p
              className="mt-4"
              style={{
                fontSize: `${fontContenido}px`,
                color: "#e5e7eb",
                lineHeight: estilos.interlineado ?? undefined,
                fontStyle: estilos.cursiva ? "italic" : undefined,
              }}
            >
              {queIncluye}
            </p>
          </details>
        )}

        {informacionEnvio && (
          <details
            className="p-5"
            style={{ borderBottom: "1px solid #2a2a2a" }}
          >
            <summary
              className="cursor-pointer flex justify-between items-center"
              style={{
                fontSize: `${fontAcordeon}px`,
                fontWeight: 700,
                lineHeight: estilos.interlineado ?? undefined,
                letterSpacing: estilos.espaciadoLetras
                  ? `${estilos.espaciadoLetras}px`
                  : undefined,
                fontStyle: estilos.cursiva ? "italic" : undefined,
                textTransform: estilos.mayusculas ? "uppercase" : undefined,
              }}
            >
              <span>🚚 Información de envío</span>
              <span>▼</span>
            </summary>
            <p
              className="mt-4"
              style={{
                fontSize: `${fontContenido}px`,
                color: "#e5e7eb",
                lineHeight: estilos.interlineado ?? undefined,
                fontStyle: estilos.cursiva ? "italic" : undefined,
              }}
            >
              {informacionEnvio}
            </p>
          </details>
        )}

        {devoluciones && (
          <details
            className="p-5"
            style={{ borderBottom: "1px solid #2a2a2a" }}
          >
            <summary
              className="cursor-pointer flex justify-between items-center"
              style={{
                fontSize: `${fontAcordeon}px`,
                fontWeight: 700,
                lineHeight: estilos.interlineado ?? undefined,
                letterSpacing: estilos.espaciadoLetras
                  ? `${estilos.espaciadoLetras}px`
                  : undefined,
                fontStyle: estilos.cursiva ? "italic" : undefined,
                textTransform: estilos.mayusculas ? "uppercase" : undefined,
              }}
            >
              <span>↩️ Devoluciones y reembolsos</span>
              <span>▼</span>
            </summary>
            <p
              className="mt-4"
              style={{
                fontSize: `${fontContenido}px`,
                color: "#e5e7eb",
                lineHeight: estilos.interlineado ?? undefined,
                fontStyle: estilos.cursiva ? "italic" : undefined,
              }}
            >
              {devoluciones}
            </p>
          </details>
        )}
      </div>
    </section>
  );
}

function PruebaSocial({
  ordenesHoy,
  opinionesVerificadas,
  caracteristicas,
  beneficios,
  estilos = {},
}: any) {
  const sectionStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || "#ffffff",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "12px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "32px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas
      ? `${estilos.radioEsquinas}px`
      : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
    border:
      estilos.mostrarBorde && estilos.grosorBorde
        ? `${estilos.grosorBorde}px solid ${estilos.colorBorde || "#e5e7eb"}`
        : undefined,
  };

  const fondo = estilos.colorFondo || "#ffffff";
  const esClaro = isColorClaro(fondo);
  const colorTexto = esClaro ? "#121212" : "#ffffff";
  const colorTextoSuave = esClaro ? "#6b7280" : "rgba(255,255,255,0.65)";

  const align = estilos.alineacion || "centro";
  const textAlign =
    align === "izq" ? "left" : align === "der" ? "right" : "center";
  const flexAlign =
    align === "izq" ? "flex-start" : align === "der" ? "flex-end" : "center";

  const fontBase = estilos.tamanoFuente || 14;
  const pesoBase =
    estilos.pesoFuente === "bold"
      ? 700
      : estilos.pesoFuente === "black"
        ? 900
        : 700;

  const estilosTipografia: React.CSSProperties = {
    fontStyle: estilos.cursiva ? "italic" : undefined,
    textTransform: estilos.mayusculas ? "uppercase" : undefined,
    lineHeight: estilos.interlineado ?? undefined,
    letterSpacing: estilos.espaciadoLetras
      ? `${estilos.espaciadoLetras}px`
      : undefined,
  };

  return (
    <section style={{ ...sectionStyle, textAlign }}>
      {ordenesHoy > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: flexAlign,
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: `${fontBase * 0.85}px`,
              fontWeight: pesoBase,
              color: colorTexto,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              ...estilosTipografia,
            }}
          >
            +{ordenesHoy} ÓRDENES HOY
          </span>
        </div>
      )}

      {opinionesVerificadas > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: flexAlign,
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              fontSize: `${fontBase * 0.8}px`,
              color: colorTextoSuave,
              ...estilosTipografia,
            }}
          >
            ({Number(opinionesVerificadas).toLocaleString("es-CO")} Opiniones
            verificadas)
          </span>
        </div>
      )}

      {caracteristicas && (
        <p
          style={{
            fontSize: `${fontBase}px`,
            fontWeight: pesoBase,
            color: "#D66700",
            whiteSpace: "pre-line",
            marginTop: "8px",
            textAlign,
            ...estilosTipografia,
          }}
        >
          {caracteristicas}
        </p>
      )}

      {Array.isArray(beneficios) && beneficios.length > 0 && (
        <div
          style={{
            marginTop: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            maxWidth: "28rem",
            marginLeft: flexAlign === "flex-start" ? 0 : "auto",
            marginRight: flexAlign === "flex-end" ? 0 : "auto",
            textAlign: "left",
          }}
        >
          {beneficios.map((b: any, i: number) => {
            if (!b.titulo && !b.descripcion) return null;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    color: "#D66700",
                    fontSize: `${fontBase * 1.2}px`,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <p
                  style={{
                    fontSize: `${fontBase}px`,
                    color: colorTexto,
                    margin: 0,
                    ...estilosTipografia,
                  }}
                >
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

function Faqs({
  titulo,
  items,
  colorTitulo,
  colorPregunta,
  colorRespuesta,
  colorAcento,        // 👈 NUEVO
  colorFondo,         // 👈 NUEVO
  colorSeparador,     // 👈 NUEVO
  estilos = {},
}: any) {
  if (!Array.isArray(items) || !items.length) return null;

  const sectionStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || colorFondo || "#ffffff",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "32px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "32px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "20px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "20px",
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas
      ? `${estilos.radioEsquinas}px`
      : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
  };

  const fondo = estilos.colorFondo || colorFondo || "#ffffff";
  const esClaro = isColorClaro(fondo);
  const colorTexto = esClaro ? "#121212" : "#ffffff";
  const colorTextoSuave = esClaro ? "#4b5563" : "rgba(255,255,255,0.7)";
  const separador = colorSeparador || (esClaro ? "#e5e7eb" : "rgba(255,255,255,0.15)");
  const acento = colorAcento || "#2d5f1e"; // verde oscuro como en la imagen

  const fontBase = estilos.tamanoFuente || 15;

  return (
    <section style={sectionStyle}>
      {/* Título con líneas a los lados */}
      {titulo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          <span
            style={{
              flex: "0 0 auto",
              width: "32px",
              height: "3px",
              backgroundColor: acento,
              borderRadius: "9999px",
            }}
          />
          <h2
            style={{
              fontSize: `${fontBase * 1.3}px`,
              fontWeight: 900,
              color: colorTitulo || acento,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              textAlign: "center",
              lineHeight: 1.2,
            }}
          >
            {titulo}
          </h2>
          <span
            style={{
              flex: "0 0 auto",
              width: "32px",
              height: "3px",
              backgroundColor: acento,
              borderRadius: "9999px",
            }}
          />
        </div>
      )}

      {/* Lista de preguntas */}
      <div>
        {items.map((faq: any, i: number) => {
          if (!faq.pregunta) return null;
          return (
            <details
              key={i}
              open={i === 0}  // 👈 primera abierta por defecto
              style={{
                borderTop: i === 0 ? "none" : `1px solid ${separador}`,
              }}
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  padding: "18px 0",
                  cursor: "pointer",
                  listStyle: "none",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    fontSize: `${fontBase * 1.05}px`,
                    fontWeight: 800,
                    color: colorPregunta || colorTexto,
                    lineHeight: 1.35,
                    textAlign: "left",
                  }}
                >
                  {faq.pregunta}
                </span>
                <span
                  style={{
                    fontSize: `${fontBase * 1.5}px`,
                    fontWeight: 300,
                    color: acento,
                    lineHeight: 1,
                    flexShrink: 0,
                    transition: "transform 0.2s",
                  }}
                  className="faq-icono"
                >
                  <span className="faq-mas">＋</span>
                  <span className="faq-menos" style={{ display: "none" }}>✕</span>
                </span>
              </summary>
              {faq.respuesta && (
                <p
                  style={{
                    fontSize: `${fontBase}px`,
                    color: colorRespuesta || colorTextoSuave,
                    lineHeight: 1.6,
                    margin: "0 0 20px 0",
                    textAlign: "left",
                    paddingRight: "32px",
                  }}
                >
                  {faq.respuesta}
                </p>
              )}
            </details>
          );
        })}
      </div>

      {/* Estilos para el toggle del icono */}
      <style jsx>{`
        details[open] .faq-mas {
          display: none;
        }
        details[open] .faq-menos {
          display: inline !important;
        }
        summary::-webkit-details-marker {
          display: none;
        }
      `}</style>
    </section>
  );
}
function Resenas({
  titulo,
  promedio,
  totalResenas,
  mostrarBotonResena,
  textoBotonResena,
  colorAcento,
  colorEstrella,
  colorBarra,
  colorBarraFondo,
  distribucion,
  items,
  estilos = {},
}: any) {
  const listaDistribucion = Array.isArray(distribucion) ? distribucion : [];
  const listaItems = Array.isArray(items) ? items : [];

  // No renderizar si no hay nada
  if (listaDistribucion.length === 0 && listaItems.length === 0) return null;

  const sectionStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || "#ffffff",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "24px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "24px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "20px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "20px",
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
  };

  const acento = colorAcento || "#1b5e20";
  const estrellaColor = colorEstrella || acento;
  const barraColor = colorBarra || "#84cc16";
  const barraFondo = colorBarraFondo || "#ecfccb";
  const fondo = estilos.colorFondo || "#ffffff";
  const esClaro = isColorClaro(fondo);
  const colorTexto = esClaro ? "#121212" : "#ffffff";
  const colorTextoSuave = esClaro ? "#6b7280" : "rgba(255,255,255,0.65)";
  const colorBorde = esClaro ? "#e5e7eb" : "rgba(255,255,255,0.15)";
  const colorTarjeta = esClaro ? "#ffffff" : "rgba(255,255,255,0.03)";

  const fontBase = estilos.tamanoFuente || 15;

  // 👇 Usar la distribución MANUAL del admin
const distribucionFinal = listaDistribucion.length > 0
  ? [...listaDistribucion].sort((a, b) => b.estrellas - a.estrellas)
  : [
      { estrellas: 5, cantidad: 0 },
      { estrellas: 4, cantidad: 0 },
      { estrellas: 3, cantidad: 0 },
      { estrellas: 2, cantidad: 0 },
      { estrellas: 1, cantidad: 0 },
    ];

  const maxCantidad = Math.max(...distribucionFinal.map((d) => d.cantidad || 0), 1);

  // Suma de la distribución manual
  const sumaTotal = distribucionFinal.reduce((acc, d) => acc + (d.cantidad || 0), 0);
  const totalMostrar = totalResenas || sumaTotal;

  return (
    <section style={sectionStyle}>
      <div
        style={{
          border: `1px solid ${colorBorde}`,
          borderRadius: "16px",
          padding: "24px 20px",
          backgroundColor: colorTarjeta,
        }}
      >
        {titulo && (
          <h2
            style={{
              fontSize: `${fontBase * 1.5}px`,
              fontWeight: 900,
              color: acento,
              margin: "0 0 16px 0",
              lineHeight: 1.2,
            }}
          >
            {titulo}
          </h2>
        )}

        {/* PROMEDIO + ESTRELLAS */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={"prom-" + n} style={{ fontSize: `${fontBase * 1.6}px`, color: estrellaColor, lineHeight: 1 }}>
                ★
              </span>
            ))}
          </div>
          <span style={{ fontSize: `${fontBase * 1.5}px`, fontWeight: 900, color: acento }}>
            {promedio || "4.9"} de 5
          </span>
        </div>

        <p style={{ fontSize: `${fontBase * 0.95}px`, color: colorTextoSuave, margin: "0 0 24px 0" }}>
          Basado en {totalMostrar} clientes verificados
        </p>

        {/* DISTRIBUCIÓN MANUAL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {distribucionFinal.map(({ estrellas, cantidad }, idx) => {
            const porcentaje = ((cantidad || 0) / maxCantidad) * 100;
            return (
              <div
                key={"dist-" + estrellas + "-" + idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 40px",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                {/* Estrellas */}
                <div style={{ display: "flex", gap: "2px" }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={"fila-" + estrellas + "-" + n}
                      style={{
                        fontSize: `${fontBase * 0.9}px`,
                        color: n <= estrellas ? estrellaColor : "#e5e7eb",
                        lineHeight: 1,
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Barra */}
                <div
                  style={{
                    height: "12px",
                    backgroundColor: barraFondo,
                    borderRadius: "9999px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(porcentaje, cantidad > 0 ? 4 : 0)}%`,
                      height: "100%",
                      backgroundColor: barraColor,
                      borderRadius: "9999px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* Cantidad */}
                <span
                  style={{
                    fontSize: `${fontBase * 1.05}px`,
                    fontWeight: 800,
                    color: acento,
                    textAlign: "right",
                  }}
                >
                  {cantidad || 0}
                </span>
              </div>
            );
          })}
        </div>

        {/* BOTÓN ESCRIBIR RESEÑA */}
        {mostrarBotonResena !== false && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              // Solo demo, no guarda nada
            }}
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: acento,
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: `${fontBase * 1.05}px`,
              fontWeight: 700,
              cursor: "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {textoBotonResena || "Escribir una reseña"}
          </button>
        )}
      </div>

      {/* LISTADO DE RESEÑAS */}
      {listaItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
          {listaItems.map((r: any, i: number) => {
            const puntuacion = Math.min(5, Math.max(1, Number(r.estrellas || 5)));
            return (
              <div
                key={i}
                style={{
                  border: `1px solid ${colorBorde}`,
                  borderRadius: "16px",
                  padding: "20px",
                  backgroundColor: colorTarjeta,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ display: "flex", gap: "3px" }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={"resena-" + i + "-" + n}
                        style={{
                          fontSize: `${fontBase * 1.1}px`,
                          color: n <= puntuacion ? estrellaColor : "#e5e7eb",
                          lineHeight: 1,
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  {r.fecha && (
                    <span style={{ fontSize: `${fontBase * 0.85}px`, color: colorTextoSuave }}>
                      {r.fecha}
                    </span>
                  )}
                </div>

                {r.titulo && (
                  <h3
                    style={{
                      fontSize: `${fontBase * 1.1}px`,
                      fontWeight: 800,
                      color: colorTexto,
                      margin: "0 0 8px 0",
                      lineHeight: 1.35,
                    }}
                  >
                    {r.titulo}
                  </h3>
                )}

                {r.texto && (
                  <p
                    style={{
                      fontSize: `${fontBase}px`,
                      color: colorTextoSuave,
                      margin: 0,
                      lineHeight: 1.55,
                    }}
                  >
                    {r.texto}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
function BeneficiosNumerados({
  badge,
  titulo,
  beneficios,
  colorAcento, // 👈 NUEVO
  colorFondoIcono, // 👈 NUEVO
  estilos = {},
}: any) {
  if (!Array.isArray(beneficios) || beneficios.length === 0) return null;

  const sectionStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || "#ffffff",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "32px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "32px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas
      ? `${estilos.radioEsquinas}px`
      : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
  };

  const fondo = estilos.colorFondo || "#ffffff";
  const esClaro = isColorClaro(fondo);
  const colorTexto = esClaro ? "#121212" : "#ffffff";
  const colorTextoSuave = esClaro ? "#4b5563" : "rgba(255,255,255,0.7)";

  // 👇 COLORES CONFIGURABLES
  const colorPrincipal = colorAcento || "#7cb342";
  const colorFondoCaja = colorFondoIcono || `${colorPrincipal}10`;

  const fontBase = estilos.tamanoFuente || 16;

  return (
    <section style={sectionStyle}>
      {badge && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: colorPrincipal,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: `${fontBase * 0.85}px`,
              fontWeight: 800,
              color: colorPrincipal,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            {badge}
          </span>
        </div>
      )}

      {titulo && (
        <h2
          style={{
            fontSize: `${fontBase * 2}px`,
            fontWeight: 900,
            color: colorTexto,
            margin: "0 0 32px 0",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          {titulo}
        </h2>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        {beneficios.map((b: any, i: number) => {
          if (!b.titulo) return null;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "18px",
              }}
            >
             <div
  style={{
    width: "48px",
    height: "48px",
    borderRadius: "50%",  // 👈 círculo en vez de cuadrado con esquinas redondeadas
    border: `2px solid ${colorPrincipal}`,  // 👈 borde más grueso, color sólido
    backgroundColor: "transparent",  // 👈 sin relleno
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }}
>
  <span
    style={{
      fontSize: "22px",  // 👈 emoji grande
      lineHeight: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {b.icono || "★"}
  </span>
</div>

              <div style={{ flex: 1, paddingTop: "4px" }}>
                <h3
                  style={{
                    fontSize: `${fontBase * 1.15}px`,
                    fontWeight: 800,
                    color: colorTexto,
                    margin: "0 0 6px 0",
                    lineHeight: 1.3,
                  }}
                >
                  {i + 1}. {b.titulo}
                </h3>
                {b.descripcion && (
                  <p
                    style={{
                      fontSize: `${fontBase}px`,
                      color: colorTextoSuave,
                      margin: 0,
                      lineHeight: 1.55,
                    }}
                  >
                    {b.descripcion}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
function TablaComparativa({
  tituloProducto,
  tituloCompetencia,
  filas,
  colorProducto, // 👈 NUEVO: color del texto verde
  colorFondoProducto, // 👈 NUEVO: fondo del header verde
  colorBordeProducto, // 👈 NUEVO: borde superior verde
  colorFondoFilaProducto, // 👈 NUEVO: fondo de las filas del producto
  producto, // 👈 NUEVO: para auto-título
  estilos = {},
}: any) {
  if (!Array.isArray(filas) || filas.length === 0) return null;

  const sectionStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || "#ffffff",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "24px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "24px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "16px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "16px",
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas
      ? `${estilos.radioEsquinas}px`
      : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
  };

  // 👇 COLORES CONFIGURABLES
  const verde = colorProducto || "#2d5f1e";
  const verdeFondo = colorFondoProducto || "#e8f0e0";
  const verdeBorde = colorBordeProducto || "#4a7c2c";
  const verdeFilaFondo = colorFondoFilaProducto || "#f7faf4";

  const grisTexto = "#6b7280";
  const grisFondo = "#f3f4f6";
  const grisBorde = "#e5e7eb";

  const fontBase = estilos.tamanoFuente || 15;

  // 👇 Título automático si está vacío
  const tituloProductoFinal =
    tituloProducto?.trim() || producto?.nombre?.toUpperCase() || "TU PRODUCTO";

  return (
    <section style={sectionStyle}>
      <div
        style={{
          border: `1px solid ${grisBorde}`,
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {/* Columna producto */}
          <div
            style={{
              backgroundColor: verdeFondo,
              padding: "20px 16px",
              textAlign: "center",
              borderTop: `4px solid ${verdeBorde}`,
            }}
          >
            <h3
              style={{
                fontSize: `${fontBase * 1.1}px`,
                fontWeight: 900,
                color: verde,
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                lineHeight: 1.2,
              }}
            >
              {tituloProductoFinal}
            </h3>
          </div>

          {/* Columna competencia */}
          <div
            style={{
              backgroundColor: grisFondo,
              padding: "20px 16px",
              textAlign: "center",
              borderTop: "4px solid transparent",
            }}
          >
            <h3
              style={{
                fontSize: `${fontBase * 1.05}px`,
                fontWeight: 900,
                color: grisTexto,
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                lineHeight: 1.2,
              }}
            >
              {tituloCompetencia || "OTROS PRODUCTOS"}
            </h3>
          </div>
        </div>

        {/* FILAS */}
        {filas.map((fila: any, i: number) => {
          if (!fila.texto) return null;
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderTop: `1px solid ${grisBorde}`,
              }}
            >
              {/* Columna producto: check verde */}
              <div
                style={{
                  backgroundColor: verdeFilaFondo,
                  padding: "18px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRight: `1px solid ${grisBorde}`,
                }}
              >
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: verde,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: "16px", height: "16px" }}
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </span>
                <span
                  style={{
                    fontSize: `${fontBase}px`,
                    fontWeight: 800,
                    color: "#121212",
                    lineHeight: 1.3,
                    textAlign: "left",
                  }}
                >
                  {fila.texto}
                </span>
              </div>

              {/* Columna competencia: X gris */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  padding: "18px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: `2px solid ${grisBorde}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={grisTexto}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ width: "12px", height: "12px" }}
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </span>
              </div>
            </div>
          );
        })}
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
  estilos = {},
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

  // 👇 estilos tiene prioridad, luego la prop (compatibilidad con landings viejas)
  const align = estilos.alineacion || alineacion || "izq";

  const flexAlign =
    align === "centro" ? "center" : align === "der" ? "flex-end" : "flex-start";

  const textAlign =
    align === "centro" ? "center" : align === "der" ? "right" : "left";

  const tamanios: Record<string, number> = {
    sm: 18,
    md: 24,
    lg: 30,
    xl: 36,
  };
  const fontSizeTitulo =
    estilos.tamanoFuente || tamanios[tamanioTitulo || "lg"] || 30;

  const sectionStyle: React.CSSProperties = {
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "20px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "20px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    backgroundColor: estilos.colorFondo || undefined,
    borderRadius: estilos.radioEsquinas
      ? `${estilos.radioEsquinas}px`
      : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
    fontWeight:
      estilos.pesoFuente === "normal"
        ? 400
        : estilos.pesoFuente === "bold"
          ? 700
          : estilos.pesoFuente === "black"
            ? 900
            : undefined,
    fontStyle: estilos.cursiva ? "italic" : undefined,
    textTransform: estilos.mayusculas ? "uppercase" : undefined,
    lineHeight: estilos.interlineado ?? undefined,
    letterSpacing: estilos.espaciadoLetras
      ? `${estilos.espaciadoLetras}px`
      : undefined,
  };

  return (
    <section
      className="flex flex-col gap-3"
      style={{
        ...sectionStyle,
        alignItems: flexAlign,
        textAlign,
      }}
    >
      <h1
        style={{
          fontSize: `${fontSizeTitulo}px`,
          fontWeight:
            estilos.pesoFuente === "normal"
              ? 400
              : estilos.pesoFuente === "bold"
                ? 700
                : estilos.pesoFuente === "black"
                  ? 900
                  : 900,
          fontStyle: estilos.cursiva ? "italic" : undefined,
          textTransform: estilos.mayusculas ? "uppercase" : undefined,
          lineHeight: estilos.interlineado ?? 1.2,
          letterSpacing: estilos.espaciadoLetras
            ? `${estilos.espaciadoLetras}px`
            : undefined,
          color: colorTitulo || "#121212",
          textAlign,
          margin: 0,
        }}
      >
        {textoFinal}
      </h1>

      <div
        className="flex items-center gap-3 flex-wrap"
        style={{ justifyContent: flexAlign }}
      >
        {mostrarPrecio !== false && (
          <span
            style={{
              fontSize: `${fontSizeTitulo * 0.8}px`,
              fontWeight: 900,
              color: colorPrecio || "#1d4ed8",
            }}
          >
            ${precio.toFixed(2)}
          </span>
        )}

        {mostrarPrecioAntes !== false && precioAntes > precio && (
          <span
            style={{
              fontSize: `${fontSizeTitulo * 0.65}px`,
              fontWeight: 600,
              textDecoration: "line-through",
              color: colorPrecioAntes || "#a1a1a1",
            }}
          >
            ${precioAntes.toFixed(2)}
          </span>
        )}

        {mostrarBadge !== false && textoBadgeFinal && (
          <span
            className="px-3 py-1 rounded-full border-2 border-dashed"
            style={{
              fontSize: `${Math.max(12, fontSizeTitulo * 0.45)}px`,
              fontWeight: 700,
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
    },
    schema: [
      { key: "texto", label: "Texto", tipo: "textarea" },
      { key: "minutos", label: "Minutos", tipo: "number" },
    ],
    Render: BannerContador,
  },

  barra_estrellas: {
    nombre: "Barra de estrellas",
    icono: "⭐",
    max: 1,
    defaults: { texto: "⭐⭐⭐⭐⭐ +100.000 clientes satisfechos" },
    schema: [
      {
        key: "texto",
        label: "Texto",
        tipo: "textarea",
      },
    ],
    aplicaEstilos: [
      "tipografia",
      "apariencia",
      "bordes",
      "relleno",
      "margen",
      "alineacion",
    ],
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
      flotante: false,
    },
    schema: [
      { key: "texto", label: "Texto principal", tipo: "text" },
      { key: "subtitulo", label: "Subtítulo", tipo: "text" },
      { key: "flotante", label: "📌 Fijo abajo (flotante)", tipo: "toggle" },
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
      {
        key: "informacionEnvio",
        label: "Información de envío",
        tipo: "textarea",
      },
      {
        key: "devoluciones",
        label: "Devoluciones y reembolsos",
        tipo: "textarea",
      },
    ],
    Render: BloqueCompra,
  },
  selector_unidades: {
    nombre: "Selector de unidades",
    icono: "🎚️",
    max: 1,
    defaults: {
      tituloSeccion: "Elige tu pack",
      colorAcento: "#16a34a",
      opciones: [
        {
          titulo: "1 Unidad + Kit",
          items: "1 item",
          precio: 29.9,
          precioAntes: 0,
          badge: "",
          envioGratis: true,
          beneficios: [
            { texto: "texto" },
            { texto: "texto" },
            { texto: "texto" },
          ],
        },
        {
          titulo: "2 Unidades + 2 Kits",
          items: "2 items",
          precio: 46.9,
          precioAntes: 59.8,
          badge: "MEJOR OFERTA",
          envioGratis: true,
          beneficios: [
            { texto: "texto" },
            { texto: "texto" },
            { texto: "texto" },
            { texto: "texto" },
          ],
        },
      ],
    },
    schema: [
      { key: "tituloSeccion", label: "Título de la sección", tipo: "text" },
          { key: "colorAcento", label: "🎨 Color de acento", tipo: "color" },  // 👈 NUEVO
      { key: "opciones", label: "Opciones de compra", tipo: "repeater" },
    ],
    Render: SelectorUnidades,
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
      {
        key: "opinionesVerificadas",
        label: "Opiniones verificadas",
        tipo: "number",
      },
      {
        key: "caracteristicas",
        label: "Características destacadas",
        tipo: "textarea",
      },
      { key: "beneficios", label: "Checklist de beneficios", tipo: "repeater" },
    ],
    Render: PruebaSocial,
  },

 faqs: {
  nombre: "Preguntas frecuentes",
  icono: "❓",
  max: 2,
  defaults: {
    titulo: "PREGUNTAS FRECUENTES",
    items: [
      {
        pregunta: "¿Por qué es más efectivo que una crema facial?",
        respuesta:
          "Las cremas tópicas solo humectan la capa más superficial de la piel. Nuestro producto actúa desde el interior gracias a su absorción liposomal, llevando el NAD+ y Resveratrol directo al torrente sanguíneo para reactivar colágeno, elastina y firmeza celular en la raíz dérmica.",
      },
      {
        pregunta: "¿En cuánto tiempo comenzaré a notar los cambios?",
        respuesta:
          "Los primeros resultados se notan a las 2 semanas de uso constante. Entre los días 30 y 60, la piel gana densidad, mayor tonicidad dérmica y una reducción apreciable en líneas de expresión.",
      },
      {
        pregunta: "¿Cómo se toma y en qué momento del día?",
        respuesta:
          "Se recomienda tomar 2 cápsulas al día acompañadas con abundante agua, preferiblemente por la mañana junto con el desayuno.",
      },
      {
        pregunta: "¿Tiene efectos secundarios o daña el estómago?",
        respuesta:
          "No. Nuestra fórmula utiliza cápsulas 100% vegetales y microesferas liposomales que protegen los ingredientes del ácido gástrico. No produce pesadez ni malestar estomacal.",
      },
      {
        pregunta: "¿Para cuántos días rinde cada frasco?",
        respuesta:
          "Cada frasco contiene 60 cápsulas vegetales, dosis completa para 30 días de tratamiento continuo.",
      },
    ],
    colorAcento: "#2d5f1e",
    colorFondo: "#ffffff",
    colorSeparador: "#e5e7eb",
    colorPregunta: "#121212",
    colorRespuesta: "#4b5563",
  },
  schema: [
    { key: "titulo", label: "Título", tipo: "text" },
    { key: "colorAcento", label: "🎨 Color de acento (verde)", tipo: "color" },
    { key: "colorFondo", label: "🎨 Color de fondo", tipo: "color" },
    { key: "colorSeparador", label: "🎨 Color de los separadores", tipo: "color" },
    { key: "colorPregunta", label: "🎨 Color de la pregunta", tipo: "color" },
    { key: "colorRespuesta", label: "🎨 Color de la respuesta", tipo: "color" },
    { key: "items", label: "Preguntas", tipo: "repeater" },
  ],
  aplicaEstilos: [
    "tipografia",
    "apariencia",
    "bordes",
    "relleno",
    "margen",
  ],
  Render: Faqs,
},

resenas: {
  nombre: "Reseñas",
  icono: "🌟",
  max: 2,
  defaults: {
    titulo: "Opiniones y Resultados Reales",
    promedio: 4.9,
    totalResenas: 48,
    mostrarBotonResena: true,
    textoBotonResena: "Escribir una reseña",
    colorAcento: "#1b5e20",
    colorEstrella: "#1b5e20",
    colorBarra: "#84cc16",
    colorBarraFondo: "#ecfccb",
    // 👇 NUEVO: distribución manual
    distribucion: [
      { estrellas: 5, cantidad: 43 },
      { estrellas: 4, cantidad: 5 },
      { estrellas: 3, cantidad: 0 },
      { estrellas: 2, cantidad: 0 },
      { estrellas: 1, cantidad: 0 },
    ],
    items: [
      {
        estrellas: 5,
        titulo: "Mi piel recuperó la firmeza que ninguna crema le dio",
        texto:
          "Tengo 44 años y llevaba meses notando el rostro cansado y con pérdida de tonicidad en los pómulos. A las 3 semanas de tomar las 2 cápsulas diarias la diferencia frente al espejo es impresionante: la piel se ve tensa, hidratada y con una luz que no tenía hace años.",
        fecha: "Hace 3 días",
      },
      {
        estrellas: 5,
        titulo: "Resultados visibles en menos de un mes",
        texto:
          "Llevo 5 semanas usándolo y las líneas de expresión alrededor de los ojos se han suavizado bastante. Lo recomiendo 100%.",
        fecha: "Hace 1 semana",
      },
    ],
  },
  schema: [
    { key: "titulo", label: "Título", tipo: "text" },
    { key: "promedio", label: "Promedio (ej: 4.9)", tipo: "number" },
    { key: "totalResenas", label: "Total de reseñas", tipo: "number" },
    { key: "mostrarBotonResena", label: "Mostrar botón 'Escribir reseña'", tipo: "toggle" },
    { key: "textoBotonResena", label: "Texto del botón", tipo: "text" },
    { key: "colorAcento", label: "🎨 Color de acento (verde oscuro)", tipo: "color" },
    { key: "colorEstrella", label: "🎨 Color de las estrellas", tipo: "color" },
    { key: "colorBarra", label: "🎨 Color de las barras", tipo: "color" },
    { key: "colorBarraFondo", label: "🎨 Color de fondo de las barras", tipo: "color" },
    // 👇 NUEVO: el repeater de distribución
    { key: "distribucion", label: "Distribución de estrellas (5 a 1)", tipo: "repeater" },
    { key: "items", label: "Reseñas individuales", tipo: "repeater" },
  ],
  aplicaEstilos: ["tipografia", "apariencia", "bordes", "relleno", "margen"],
  Render: Resenas,
},
  beneficios_numerados: {
    nombre: "Beneficios numerados",
    icono: "🔢",
    max: 0,
    defaults: {
      badge: "MECANISMO CELULAR",
      titulo: "Cómo rejuvenece tu piel desde la raíz",
      colorAcento: "#7cb342", // 👈 NUEVO
      colorFondoIcono: "#f0f7e8", // 👈 NUEVO
      beneficios: [
        {
          icono: "🛡️",
          titulo: "titulo",
          descripcion: "descripcion",
        },
        {
          icono: "✨",
          titulo: "titulo",
          descripcion: "descripcion",
        },
        {
          icono: "⭐",
          titulo: "titulo",
          descripcion: "descripcion",
        },
        {
          icono: "⚡",
          titulo: "titulo",
          descripcion: "descripcion",
        },
      ],
    },
    schema: [
      { key: "badge", label: "Badge superior (opcional)", tipo: "text" },
      { key: "titulo", label: "Título de la sección", tipo: "text" },
      { key: "colorAcento", label: "🎨 Color de acento", tipo: "color" }, // 👈 NUEVO
      {
        key: "colorFondoIcono",
        label: "🎨 Color de fondo del icono",
        tipo: "color",
      }, // 👈 NUEVO
      { key: "beneficios", label: "Beneficios", tipo: "repeater" },
    ],
    aplicaEstilos: [
      "tipografia",
      "apariencia",
      "bordes",
      "relleno",
      "margen",
      "alineacion",
    ],
    Render: BeneficiosNumerados,
  },
  tabla_comparativa: {
    nombre: "Tabla comparativa",
    icono: "⚖️",
    max: 1,
    defaults: {
      tituloProducto: "", // 👈 vacío = usa producto.nombre automáticamente
      tituloCompetencia: "Titulo",
      colorProducto: "#2d5f1e", // 👈 NUEVO
      colorFondoProducto: "#e8f0e0", // 👈 NUEVO
      colorBordeProducto: "#4a7c2c", // 👈 NUEVO
      colorFondoFilaProducto: "#f7faf4", // 👈 NUEVO
      filas: [
        { texto: "texto" },
        { texto: "texto" },
        { texto: "texto" },
        { texto: "texto" },
      ],
    },
    schema: [
      {
        key: "tituloProducto",
        label: "Título columna producto (vacío = nombre del producto)",
        tipo: "text",
      },
      {
        key: "tituloCompetencia",
        label: "Título columna competencia",
        tipo: "text",
      },
      {
        key: "colorProducto",
        label: "🎨 Color principal (verde)",
        tipo: "color",
      }, // 👈 NUEVO
      {
        key: "colorFondoProducto",
        label: "🎨 Color de fondo del header",
        tipo: "color",
      }, // 👈 NUEVO
      {
        key: "colorBordeProducto",
        label: "🎨 Color del borde superior",
        tipo: "color",
      }, // 👈 NUEVO
      {
        key: "colorFondoFilaProducto",
        label: "🎨 Color de fondo de las filas",
        tipo: "color",
      }, // 👈 NUEVO
      { key: "filas", label: "Filas de comparación", tipo: "repeater" },
    ],
    aplicaEstilos: ["tipografia", "apariencia", "bordes", "relleno", "margen"],
    Render: TablaComparativa,
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
      {
        key: "titulo",
        label: "Título (vacío = nombre del producto)",
        tipo: "text",
      },
      {
        key: "tamanioTitulo",
        label: "Tamaño del título",
        tipo: "select",
        options: ["sm", "md", "lg", "xl"],
      },
      {
        key: "alineacion",
        label: "Alineación",
        tipo: "select",
        options: ["izq", "centro", "der"],
      },
      { key: "mostrarPrecio", label: "Mostrar precio actual", tipo: "toggle" },
      { key: "colorPrecio", label: "Color del precio", tipo: "color" },
      {
        key: "mostrarPrecioAntes",
        label: "Mostrar precio antes",
        tipo: "toggle",
      },
      {
        key: "colorPrecioAntes",
        label: "Color del precio antes",
        tipo: "color",
      },
      {
        key: "mostrarBadge",
        label: "Mostrar badge de descuento",
        tipo: "toggle",
      },
      {
        key: "textoBadge",
        label: 'Texto del badge ("auto" calcula OFF)',
        tipo: "text",
      },
      { key: "colorBadgeTexto", label: "Color texto badge", tipo: "color" },
      { key: "colorBadgeBorde", label: "Color borde badge", tipo: "color" },
      { key: "colorBadgeFondo", label: "Color fondo badge", tipo: "color" },
      { key: "colorTitulo", label: "Color del título", tipo: "color" },
    ],
    Render: CabeceraProducto,
  },
};
// ═══════════════════════════════════════════════════════════════
// SECCIONES — tipos, catálogo, ajustes
// ═══════════════════════════════════════════════════════════════

export type TipoSeccion =
  | "header"
  | "producto"
  | "compra"
  | "testimonios"
  | "faq"
  | "custom";

export type AjustesSeccion = {
  // Tamaño
  ancho: "fill" | "ajustar";
  anchoMax: number;

  // Apariencia
  colorFondo: string | null; // null = hereda del tema

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
  colapsada: boolean; // 👈 NUEVO
  bloques: Bloque[];
  ajustes: AjustesSeccion;
};

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
  bloquesPermitidos: string[]; // vacío = sin restricción
  fija: boolean; // true = no se puede borrar ni mover
  color: string; // color del borde en el sidebar
};

// Catálogo de tipos de sección
export const TIPOS_SECCION: Record<TipoSeccion, SeccionDef> = {
  header: {
    tipo: "header",
    nombre: "Encabezado",
    icono: "🧭",
    bloquesPermitidos: [], // vacío = sin restricción
    fija: true,
    color: "#f59e0b", // ámbar para secciones fijas
  },
  producto: {
    tipo: "producto",
    nombre: "Producto",
    icono: "🎯",
    bloquesPermitidos: [
      "cabecera_producto",
      "hero_imagen",
      "prueba_social",
      "beneficios_numerados",
      "tabla_comparativa", // 👈 AÑADIR
    ],
    fija: false,
    color: "#3b82f6",
  },
  compra: {
    tipo: "compra",
    nombre: "Compra",
    icono: "💰",
    bloquesPermitidos: ["bloque_compra", "boton_comprar", "selector_unidades"],
    fija: false,
    color: "#10b981",
  },
  testimonios: {
    tipo: "testimonios",
    nombre: "Testimonios",
    icono: "⭐",
    bloquesPermitidos: ["prueba_social", "resenas"],
    fija: false,
    color: "#8b5cf6",
  },
  faq: {
    tipo: "faq",
    nombre: "Preguntas",
    icono: "❓",
    bloquesPermitidos: ["faqs"],
    fija: false,
    color: "#ec4899",
  },
  custom: {
    tipo: "custom",
    nombre: "Sección libre",
    icono: "📄",
    bloquesPermitidos: [], // sin restricción
    fija: false,
    color: "#6b7280",
  },
};

// Alias para compatibilidad con código existente
export const SECCIONES = TIPOS_SECCION;

// Orden canónico (para migración desde formato viejo)
export const ORDEN_SECCIONES: TipoSeccion[] = [
  "header",
  "producto",
  "compra",
  "testimonios",
  "faq",
];

// Dónde va cada bloque si se migra desde el formato viejo plano
const BLOQUE_A_SECCION: Record<string, TipoSeccion> = {
  banner_contador: "header",
  barra_estrellas: "header",
  cabecera_producto: "producto",
  hero_imagen: "producto",
  prueba_social: "producto",
  beneficios_numerados: "producto", // 👈 AÑADIR
  tabla_comparativa: "producto",
  bloque_compra: "compra",
  boton_comprar: "compra",
  selector_unidades: "compra",
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
  const diseno =
    producto.disenoLanding === "moderno" ? "disenoModerno" : "disenoClasico";
  const cfg = producto[diseno] || {};
  const orden: string[] = cfg.ordenSecciones?.length
    ? cfg.ordenSecciones
    : ORDEN_DEFAULT;
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
        },
        estilos: {
          colorFondo: cfg.colorBanner || "#E06000",
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
        },
        estilos: {
          colorFondo: "#cb1515", // 👈 color va acá
        },
      });

      if (cfg.mostrarInfoCompra !== false) {
        bloques.push({
          id: newId(),
          tipo: "bloque_compra",
          props: {
            textoDescuento:
              cfg.textoDescuento ||
              "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS",
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
          },
          estilos: {
            colorFondo: "#cb1515",
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

    if (
      key === "resenas" &&
      producto.mostrarResenas !== false &&
      producto.resenas?.length
    ) {
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
    (cfg.mostrarOrdenesHoy ||
      cfg.mostrarOpinionesVerificadas ||
      cfg.caracteristicasDestacadas) &&
    diseno === "disenoModerno"
  ) {
    // Insertar después del primer botón
    const idx = bloques.findIndex((b) => b.tipo === "boton_comprar");
    const prueba: Bloque = {
      id: newId(),
      tipo: "prueba_social",
      props: {
        ordenesHoy:
          cfg.mostrarOrdenesHoy !== false ? Number(cfg.ordenesHoy) || 137 : 0,
        opinionesVerificadas:
          cfg.mostrarOpinionesVerificadas !== false
            ? Number(cfg.opinionesVerificadasCount) || 1247
            : 0,
        caracteristicas: cfg.caracteristicasDestacadas || "",
        beneficios: Array.isArray(cfg.beneficiosChecklist)
          ? cfg.beneficiosChecklist
          : [],
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
      nav: { ...NAV_DEFAULT }, // 👈 NUEVO
    },
  };
}
//selector de unidades
function SelectorUnidades({
  tituloSeccion,
  opciones,
  onSeleccionar,
  seleccionada,
  tema,
  colorAcento: colorAcentoProp,  // 👈 NUEVO
  estilos = {},
}: any) {
  const colorAcento = colorAcentoProp || tema?.colorPrimario || "#16a34a";  // 👈 NUEVO
  const lista = Array.isArray(opciones) ? opciones : [];
  const [tabActiva, setTabActiva] = useState(0);
  const idx = Math.min(tabActiva, Math.max(lista.length - 1, 0)); // ─── Colores auto-calculados ───
  const fondo = estilos.colorFondo || "#ffffff";
  const esClaro = isColorClaro(fondo);
  const colorTexto = esClaro ? "#121212" : "#ffffff";
  const colorTextoSuave = esClaro ? "#6b7280" : "rgba(255,255,255,0.65)";
  const bordeSubtle = esClaro ? "#e5e7eb" : "rgba(255,255,255,0.15)";
  const fondoTabActivo = `${colorAcento}15`; // color acento muy claro

  // ─── Tamaños proporcionales ───
  const fontBase = estilos.tamanoFuente || 14;
  const fontTabTitulo = fontBase * 1.05;
  const fontTabPrecio = fontBase * 0.95;
  const fontTituloOpcion = fontBase * 1.5;
  const fontItems = fontBase * 1.05;
  const fontBeneficio = fontBase * 1.05;
  const fontPrecio = fontBase * 1.6;

  const estilosTipografia: React.CSSProperties = {
    fontStyle: estilos.cursiva ? "italic" : undefined,
    textTransform: estilos.mayusculas ? "uppercase" : undefined,
    lineHeight: estilos.interlineado ?? undefined,
    letterSpacing: estilos.espaciadoLetras
      ? `${estilos.espaciadoLetras}px`
      : undefined,
  };

  const sectionStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: fondo,
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "16px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "16px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "16px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "16px",
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : "12px",
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
  };

  return (
    <section style={sectionStyle}>
      {/* Título opcional */}
      {tituloSeccion && (
        <h3
          style={{
            fontSize: `${fontBase * 0.95}px`,
            fontWeight: 700,
            color: colorTextoSuave,
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "12px",
            ...estilosTipografia,
          }}
        >
          {tituloSeccion}
        </h3>
      )}

      {/* Contenedor principal con borde redondeado */}
      <div
        style={{
          border: `1px solid ${colorAcento}80`,
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* ─── TABS SUPERIORES ─── */}
        <div className="flex" style={{ position: "relative" }}>
          {lista.map((op: any, i: number) => {
            const activa = idx === i;
            return (
              <button
                key={i}
                onClick={() => {
                  setTabActiva(i);
                  onSeleccionar?.(i);
                }}
                className="flex-1 py-4 px-3 relative"
                style={{
                  backgroundColor: activa ? `${colorAcento}22` : "transparent",
                  border: activa
                    ? `2px solid ${colorAcento}`
                    : `1px solid ${bordeSubtle}`,
                  borderBottom: activa
                    ? `5px solid ${colorAcento}`
                    : `1px solid ${bordeSubtle}`,
                  borderRadius: "8px 8px 0 0",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  transform: activa ? "translateY(-2px)" : "none",
                  boxShadow: activa ? `0 4px 12px ${colorAcento}33` : "none",
                  ...estilosTipografia,
                }}
              >
                <div
                  style={{
                    fontSize: `${fontTabTitulo}px`,
                    fontWeight: 800,
                    color: colorTexto,
                    ...estilosTipografia,
                  }}
                >
                  {op.titulo || `Opción ${i + 1}`}
                </div>
                <div
                  style={{
                    fontSize: `${fontTabPrecio}px`,
                    color: colorTextoSuave,
                    marginTop: "4px",
                    fontWeight: 500,
                    ...estilosTipografia,
                  }}
                >
                  ${Number(op.precio || 0).toFixed(2)}
                </div>

                {/* Badge MEJOR OFERTA */}
                {op.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-1px",
                      right: "-1px",
                      backgroundColor: colorAcento,
                      color: "#ffffff",
                      fontSize: `${fontBase * 0.7}px`,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "0 8px 0 8px",
                      letterSpacing: "0.3px",
                      textTransform: "uppercase",
                      ...estilosTipografia,
                    }}
                  >
                    {op.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── CONTENIDO DE LA OPCIÓN ACTIVA ─── */}
        {lista[idx] && (
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px 20px",
            }}
          >
            {(() => {
              const op = lista[idx];
              const precio = Number(op.precio || 0);
              const precioAntes = Number(op.precioAntes || 0);

              return (
                <div style={{ textAlign: "center" }}>
                  {/* Título grande */}
                  <h4
                    style={{
                      fontSize: `${fontTituloOpcion}px`,
                      fontWeight: 900,
                      color: "#121212",
                      margin: 0,
                      marginBottom: "6px",
                      ...estilosTipografia,
                    }}
                  >
                    {op.titulo}
                  </h4>

                  {/* Subtítulo items */}
                  <p
                    style={{
                      fontSize: `${fontItems}px`,
                      color: "#6b7280",
                      margin: 0,
                      marginBottom: "20px",
                      fontWeight: 500,
                      ...estilosTipografia,
                    }}
                  >
                    {op.items || ""}
                    {op.envioGratis !== false && <span> + Free Shipping</span>}
                  </p>

                  {/* Beneficios */}
                  {Array.isArray(op.beneficios) && op.beneficios.length > 0 && (
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: "0 auto 20px auto",
                        maxWidth: "400px",
                        textAlign: "left",
                      }}
                    >
                      {op.beneficios.map((b: any, j: number) => {
                        const texto = typeof b === "string" ? b : b.texto || "";
                        if (!texto.trim()) return null;
                        return (
                          <li
                            key={j}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              marginBottom: "10px",
                              fontSize: `${fontBeneficio}px`,
                              color: "#374151",
                              ...estilosTipografia,
                            }}
                          >
                            <span
                              style={{
                                color: colorAcento,
                                fontSize: `${fontBeneficio * 1.3}px`,
                                lineHeight: 1,
                                flexShrink: 0,
                                fontWeight: 900,
                              }}
                            >
                              ✓
                            </span>
                            <span>{texto}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Precio */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "center",
                      gap: "10px",
                    }}
                  >
                    {precioAntes > precio && (
                      <span
                        style={{
                          fontSize: `${fontItems}px`,
                          color: "#9ca3af",
                          textDecoration: "line-through",
                          ...estilosTipografia,
                        }}
                      >
                        ${precioAntes.toFixed(2)}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: `${fontPrecio}px`,
                        fontWeight: 900,
                        color: "#121212",
                        ...estilosTipografia,
                      }}
                    >
                      ${precio.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ─── FOOTER: garantía + envío ─── */}
        <div
          className="flex justify-between items-center"
          style={{
            padding: "14px 20px",
            borderTop: `1px solid ${bordeSubtle}`,
            fontSize: `${fontBase * 0.95}px`,
            color: "#9ca3af",
            ...estilosTipografia,
          }}
        >
          <span>Garantía de devolución de 30 días</span>
          <span>Envío gratis incluido</span>
        </div>
      </div>
    </section>
  );
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
  const def = TIPOS_SECCION[tipo];
  return {
    id: newId(),
    tipo,
    nombre: def?.nombre ?? "Sección", // 👈 fallback
    visible: true,
    colapsada: false, // 👈 NUEVO
    bloques: [],
    ajustes: { ...AJUSTES_DEFAULT },
  };
}

// Crea las 5 secciones vacías en orden canónico
export function crearSeccionesVacias(): Seccion[] {
  return ORDEN_SECCIONES.map((tipo) => crearSeccion(tipo));
}

// Convierte tipos de sección viejos a los nuevos
function normalizarTipoSeccion(tipoViejo: string): TipoSeccion {
  if (tipoViejo === "hero") return "producto";
  if (tipoViejo === "detalles") return "compra";
  if (
    tipoViejo === "header" ||
    tipoViejo === "producto" ||
    tipoViejo === "compra" ||
    tipoViejo === "testimonios" ||
    tipoViejo === "faq" ||
    tipoViejo === "custom"
  ) {
    return tipoViejo as TipoSeccion;
  }
  return "custom"; // fallback
}

// Toma una plantilla vieja (bloques planos) y devuelve una nueva con secciones
export function migrarASecciones(plantilla: Plantilla): Plantilla {
  // Si ya tiene secciones, normalizarlas
  if (Array.isArray(plantilla.secciones) && plantilla.secciones.length > 0) {
    return {
      ...plantilla,
      tema: {
        ...plantilla.tema,
        nav: { ...NAV_DEFAULT, ...(plantilla.tema?.nav || {}) },
      },
      secciones: plantilla.secciones
        .filter((s: any) => s && s.tipo && TIPOS_SECCION[s.tipo as TipoSeccion])
        .map((s: any) => ({
          ...s,
          colapsada: s.colapsada ?? false,
          ajustes: { ...AJUSTES_DEFAULT, ...(s.ajustes || {}) },
          bloques: (s.bloques || []).map((b: Bloque) =>
            normalizarAlineacion(normalizarColores(b)),
          ),
        })),
    };
  }

  // Crear las 5 secciones vacías
  const mapa: Record<TipoSeccion, Seccion> = {} as any;
  ORDEN_SECCIONES.forEach((tipo) => {
    mapa[tipo] = crearSeccion(tipo);
  });

  for (const bloque of plantilla.bloques || []) {
    const tipoSeccion = BLOQUE_A_SECCION[bloque.tipo];
    const normalizado = normalizarAlineacion(normalizarColores(bloque));
    if (tipoSeccion && mapa[tipoSeccion]) {
      mapa[tipoSeccion].bloques.push(normalizado);
    } else {
      mapa.producto.bloques.push(normalizado);
    }
  }

  return {
    version: 3,
    bloques: [],
    secciones: ORDEN_SECCIONES.map((t) => mapa[t]),

    tema: {
      ...plantilla.tema,
      nav: { ...NAV_DEFAULT, ...(plantilla.tema?.nav || {}) },
    },
  };
}
// ═══════════════════════════════════════════════════════════════
// RENDERER — puro. No dispara tracking, no lee cookies.
// ═══════════════════════════════════════════════════════════════

export function ProductRenderer({
  plantilla,
  producto,
  onComprar,
  onMenuClick, // 👈 NUEVO
  opcionSeleccionada = 0, // 👈 NUEVO
  onOpcionChange, // 👈 NUEVO
  modo = "ver",
  bloqueHover = null,
  seleccionado = null,
}: {
  plantilla: Plantilla;
  producto: any;
  onComprar?: () => void;
  onMenuClick?: () => void; // 👈 NUEVO
  opcionSeleccionada?: number; // 👈 NUEVO
  onOpcionChange?: (i: number) => void; // 👈 NUEVO
  modo?: "ver" | "editor";
  bloqueHover?: string | null;
  seleccionado?: string | null;
}) {
  if (!plantilla) return null;

  // 👇 Normalizar: si tiene secciones las usa, si no migra los bloques planos
  const plantillaNormalizada = migrarASecciones(plantilla);
  const precio = Number(producto?.precio || 0);
  const nav = plantillaNormalizada.tema?.nav ?? NAV_DEFAULT; // 👈 NUEVO
  const tema = plantillaNormalizada.tema; // 👈 AQUÍ, junto a nav

  // Función que renderiza un bloque
  function renderBloque(bOriginal: Bloque) {
    const b = normalizarAlineacion(normalizarColores(bOriginal)); // 👈 NUEVO
    const def = BLOQUES[b.tipo];
    if (!def) return null;

    // 👇 Si está oculto, no renderizar (solo en modo ver)
    if (modo === "ver" && b.estilos?.oculto === true) return null;

    const props = { ...b.props };
    if (b.tipo === "hero_imagen") {
      props.esPrimera = b.id === primerHeroImagenId;
    }
    if (b.tipo === "selector_unidades") {
      props.onSeleccionar = onOpcionChange; // 👈 usar el callback de afuera
      props.seleccionada = opcionSeleccionada;
    }
    if (b.tipo === "boton_comprar") {
      props.onComprar = onComprar;
      // 👇 NUEVO: pasar la opción activa (título + precio + index) al botón
      const seccionPadre = plantillaNormalizada.secciones?.find((s) =>
        s.bloques.some((bl) => bl.id === b.id),
      );
      const selectorEnSeccion = seccionPadre?.bloques.find(
        (bl) => bl.tipo === "selector_unidades",
      );
      if (selectorEnSeccion) {
        const opcion = selectorEnSeccion.props.opciones?.[opcionSeleccionada];
        props.opcionSeleccionada = opcion
          ? { ...opcion, index: opcionSeleccionada } // 👈 añadir index
          : undefined;
      }
    }
    if (b.tipo === "bloque_compra") props.precio = precio;

    const contenido = (
      <def.Render
        {...props}
        estilos={b.estilos || {}}
        producto={producto}
        tema={tema} // 👈 NUEVO
      />
    );

    // 👇 Modo editor: envolver con overlay INTERNO (dentro del iframe)
    if (modo === "editor") {
      const esHover = bloqueHover === b.id;
      const esSeleccionado = seleccionado === b.id;

      return (
        <div
          key={b.id}
          data-bloque-id={b.id}
          style={{ position: "relative" }}
          onMouseEnter={() => {
            window.parent.postMessage(
              { type: "BLOQUE_HOVER", id: b.id },
              window.location.origin,
            );
          }}
          onMouseLeave={() => {
            window.parent.postMessage(
              { type: "BLOQUE_LEAVE", id: b.id },
              window.location.origin,
            );
          }}
          onClick={(e) => {
            e.stopPropagation();
            window.parent.postMessage(
              { type: "BLOQUE_SELECT", id: b.id },
              window.location.origin,
            );
          }}
        >
          {/* Overlay: borde azul cuando hover o seleccionado */}
          {(esHover || esSeleccionado) && (
            <div
              className="absolute inset-0 border-2 border-dashed rounded pointer-events-none z-40"
              style={{
                borderColor: esSeleccionado ? "#3b82f6" : "#60a5fa",
              }}
            />
          )}

          {contenido}
        </div>
      );
    }

    return <div key={b.id}>{contenido}</div>;
  }

  // Iterar secciones
  const secciones = plantillaNormalizada.secciones || [];
  if (secciones.length === 0) return null;

  // 👇 NUEVO: id del primer hero_imagen de toda la plantilla (para priority)
  const primerHeroImagenId = secciones
    .flatMap((s) => s.bloques)
    .find((b) => b.tipo === "hero_imagen")?.id;

  // Detectar si hay algún botón flotante activo
  const hayBotonFlotante = secciones.some((s) =>
    s.bloques.some(
      (b) => b.tipo === "boton_comprar" && b.props.flotante === true,
    ),
  );

  return (
    <div
      style={{
        paddingBottom: hayBotonFlotante ? "96px" : undefined,
        backgroundColor: tema?.colorFondo || undefined,
        minHeight: "100vh",
        maxWidth: tema?.anchoMax ? `${tema.anchoMax}px` : undefined,
        margin: tema?.anchoMax ? "0 auto" : undefined,
        fontFamily: tema?.tipografia || "Inter, system-ui, sans-serif",
      }}
    >
      {/* 👇 NUEVO: NavBar configurable desde el tema */}
      <NavBar nav={nav} onMenuClick={onMenuClick} />

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
