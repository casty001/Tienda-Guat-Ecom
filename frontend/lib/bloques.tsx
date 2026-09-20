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
  aplicaEstilos?: EstiloGrupo[];   // 👈 NUEVO
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
      ? c.split("").map((x) => x + x).join("")
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
  };
  return (
    <div
      className="text-black text-center text-sm md:text-base font-bold"
      style={style}
    >
      ⭐⭐⭐⭐⭐ {texto || "+100.000 clientes satisfechos"}
    </div>
  );
}

function HeroImagen({ url, alt, estilos = {} }: any) {
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
  tema,   // 👈 NUEVO
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
    backgroundColor:
      estilos.colorFondo || tema?.colorPrimario || "#cb1515",
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
    {subtitulo}{etiquetaPrecio}
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
        lineHeight: aplicarTipografia(estilos).lineHeight,   // 👈 hereda el lineHeight
      }}
    >
      {svgCarrito}
      <div className="flex flex-col leading-tight">
        <span style={aplicarTipografia(estilos)}>    {/* 👈 aplica los estilos al span */}
          {texto || "PEDIR AHORA Y PAGAR AL RECIBIR"}
        </span>
        {subtitulo && (
          <span
            className="font-medium opacity-90 normal-case"
            style={{
              fontSize: estilos.tamanoFuente
                ? `${Math.max(10, estilos.tamanoFuente * 0.7)}px`  // 👈 proporcional
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
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : undefined,
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
  const fontTitulo = fontBase * 1.6;   // título principal
  const fontSubtitulo = fontBase * 1.6; // precio final
  const fontAcordeon = fontBase * 1.15; // summary del acordeón
  const fontContenido = fontBase;       // texto dentro del acordeón

  const pesoFuente = estilos.pesoFuente === "normal"
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
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : undefined,
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

  const textAlign =
    estilos.alineacion === "izq" ? "left"
    : estilos.alineacion === "der" ? "right"
    : "center";

  const fontBase = estilos.tamanoFuente || 14;
  const pesoBase = estilos.pesoFuente === "bold" ? 700
    : estilos.pesoFuente === "black" ? 900 : 700;

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
            justifyContent: "center",
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
            alignItems: textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start",
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
            ({Number(opinionesVerificadas).toLocaleString("es-CO")} Opiniones verificadas)
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
            marginLeft: textAlign === "center" ? "auto" : 0,
            marginRight: textAlign === "center" ? "auto" : 0,
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

function Faqs({ titulo, items, estilos = {} }: any) {
  if (!Array.isArray(items) || !items.length) return null;
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
  };
  return (
    <section style={sectionStyle}>
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

function Resenas({ titulo, items, estilos = {} }: any) {
  if (!Array.isArray(items) || !items.length) return null;

  const sectionStyle: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || "#ffffff",
    color: estilos.colorFondo
      ? isColorClaro(estilos.colorFondo)
        ? "#121212"
        : "#ffffff"
      : "#121212",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "24px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "24px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
  };

  const fondo = estilos.colorFondo || "#ffffff";
  const esClaro = isColorClaro(fondo);
  const colorTexto = esClaro ? "#121212" : "#ffffff";
  const colorTextoSuave = esClaro ? "#6b7280" : "rgba(255,255,255,0.65)";
  const colorBorde = esClaro ? "#e5e7eb" : "rgba(255,255,255,0.15)";

  const textAlign =
    estilos.alineacion === "izq" ? "left"
    : estilos.alineacion === "der" ? "right"
    : "center";

  const fontBase = estilos.tamanoFuente || 14;
  const pesoBase = estilos.pesoFuente === "bold" ? 700
    : estilos.pesoFuente === "black" ? 900 : 700;

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
      <h2
        style={{
          fontSize: `${fontBase * 1.6}px`,
          fontWeight: 900,
          textAlign,
          marginBottom: "24px",
          margin: 0,
          paddingBottom: "24px",
          ...estilosTipografia,
        }}
      >
        {titulo || "Opiniones de clientes"}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {items.map((r: any, i: number) => {
          const puntuacion = Math.min(5, Math.max(1, Number(r.puntuacion || 5)));
          return (
            <div
              key={i}
              style={{
                border: `1px solid ${colorBorde}`,
                borderRadius: "12px",
                padding: "16px",
                backgroundColor: esClaro ? "#f9fafb" : "rgba(255,255,255,0.03)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: `${fontBase * 1.05}px`,
                      fontWeight: 700,
                      margin: 0,
                      color: colorTexto,
                      ...estilosTipografia,
                    }}
                  >
                    {r.nombre}
                  </h3>
                  <p
                    style={{
                      fontSize: `${fontBase * 0.85}px`,
                      color: colorTextoSuave,
                      margin: 0,
                      ...estilosTipografia,
                    }}
                  >
                    {r.ciudad} · {r.fecha}
                  </p>
                </div>
                {r.verificado && (
                  <span
                    style={{
                      fontSize: `${fontBase * 0.75}px`,
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      fontWeight: 700,
                    }}
                  >
                    Verificado
                  </span>
                )}
              </div>
              <div style={{ color: "#f59e0b", marginBottom: "8px" }}>
                {"⭐".repeat(puntuacion)}
              </div>
              <p
                style={{
                  fontSize: `${fontBase}px`,
                  color: colorTexto,
                  margin: 0,
                  ...estilosTipografia,
                }}
              >
                {r.resena}
              </p>
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

  // 👇 Si el usuario define `tamanoFuente`, se usa. Si no, fallback al select
  const tamanios: Record<string, number> = {
    sm: 18,
    md: 24,
    lg: 30,
    xl: 36,
  };
  const fontSizeTitulo = estilos.tamanoFuente || tamanios[tamanioTitulo || "lg"] || 30;

  // 👇 Alineación con clases y también inline (por si acaso)
  const alineaciones: Record<string, string> = {
    izq: "items-start text-left",
    centro: "items-center text-center",
    der: "items-end text-right",
  };
  const claseAlineacion = alineaciones[alineacion || estilos.alineacion || "izq"] || alineaciones.izq;

  const sectionStyle: React.CSSProperties = {
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "20px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "20px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : "24px",
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    backgroundColor: estilos.colorFondo || undefined,
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : undefined,
    opacity:
      estilos.opacidad !== undefined && estilos.opacidad < 100
        ? estilos.opacidad / 100
        : undefined,
    // 👇 TIPOGRAFÍA GLOBAL del bloque (heredada por los hijos)
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
    letterSpacing: estilos.espaciadoLetras ? `${estilos.espaciadoLetras}px` : undefined,
  };

  return (
    <section
      className={`flex flex-col gap-3 ${claseAlineacion}`}
      style={sectionStyle}
    >
      {/* 👇 h1 SIN clases Tailwind de tipografía — todo inline */}
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
                  : 900, // fallback: el título suele ser black por defecto
          fontStyle: estilos.cursiva ? "italic" : undefined,
          textTransform: estilos.mayusculas ? "uppercase" : undefined,
          lineHeight: estilos.interlineado ?? 1.2,
          letterSpacing: estilos.espaciadoLetras
            ? `${estilos.espaciadoLetras}px`
            : undefined,
          color: colorTitulo || "#121212",
        }}
      >
        {textoFinal}
      </h1>

      <div className="flex items-center gap-3 flex-wrap">
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

        {mostrarPrecioAntes !== false && precioAntes > 0 && (
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
opciones: [
  {
    titulo: "1 Unidad + Kit",
    items: "1 item",
    precio: 29.9,
    precioAntes: 0,
    badge: "",
    envioGratis: true,
    beneficios: [
      { texto: "E-Book: Biohacking Anti-Edad" },
      { texto: "Calendario de Renovación Celular" },
      { texto: "Protocolo Dérmico AM/PM" },
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
      { texto: "Mascarilla Adulto" },
      { texto: "Mascarilla Niño" },
      { texto: "Boquilla Inhaladora" },
      { texto: "Cable de carga" },
    ],
  },
],
},
    schema: [
  { key: "tituloSeccion", label: "Título de la sección", tipo: "text" },
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
    bloquesPermitidos: ["banner_contador", "barra_estrellas"],
    fija: true,
    color: "#f59e0b", // ámbar para secciones fijas
  },
  producto: {
    tipo: "producto",
    nombre: "Producto",
    icono: "🎯",
    bloquesPermitidos: ["cabecera_producto", "hero_imagen", "prueba_social"],
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
  estilos = {},
}: any) {
  const colorAcento = tema?.colorPrimario || "#16a34a";
const lista = Array.isArray(opciones) ? opciones : [];
const [tabActiva, setTabActiva] = useState(0);
const idx = Math.min(tabActiva, Math.max(lista.length - 1, 0));  // ─── Colores auto-calculados ───
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
  onClick={() => { setTabActiva(i); onSeleccionar?.(i); }}
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
                    {op.envioGratis !== false && (
                      <span> + Free Shipping</span>
                    )}
                  </p>

                  {/* Beneficios */}
                  {Array.isArray(op.beneficios) &&
                    op.beneficios.length > 0 && (
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
                          const texto =
                            typeof b === "string" ? b : b.texto || "";
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
  );}
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
          bloques: (s.bloques || []).map((b: Bloque) => normalizarColores(b)),
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
    const normalizado = normalizarColores(bloque);
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
opcionSeleccionada = 0,        // 👈 NUEVO
  onOpcionChange,                 // 👈 NUEVO
  modo = "ver",
  bloqueHover = null,
  seleccionado = null,
}: {
  plantilla: Plantilla;
  producto: any;
  onComprar?: () => void;
  onMenuClick?: () => void; // 👈 NUEVO
opcionSeleccionada?: number;    // 👈 NUEVO
  onOpcionChange?: (i: number) => void;   // 👈 NUEVO
  modo?: "ver" | "editor";
  bloqueHover?: string | null;
  seleccionado?: string | null;
}) {

  if (!plantilla) return null;

  // 👇 Normalizar: si tiene secciones las usa, si no migra los bloques planos
  const plantillaNormalizada = migrarASecciones(plantilla);
  const precio = Number(producto?.precio || 0);
  const nav = plantillaNormalizada.tema?.nav ?? NAV_DEFAULT; // 👈 NUEVO
  const tema = plantillaNormalizada.tema;   // 👈 AQUÍ, junto a nav

  // Función que renderiza un bloque
  function renderBloque(bOriginal: Bloque) {
    const b = normalizarColores(bOriginal); // 👈 NUEVO
    const def = BLOQUES[b.tipo];
    if (!def) return null;

    // 👇 Si está oculto, no renderizar (solo en modo ver)
    if (modo === "ver" && b.estilos?.oculto === true) return null;

    const props = { ...b.props };
    if (b.tipo === "selector_unidades") {
  props.onSeleccionar = onOpcionChange;    // 👈 usar el callback de afuera
      props.seleccionada = opcionSeleccionada;
    }
    if (b.tipo === "boton_comprar") {
      props.onComprar = onComprar;
      // 👇 NUEVO: pasar la opción activa (título + precio + index) al botón
      const seccionPadre = plantillaNormalizada.secciones?.find((s) =>
        s.bloques.some((bl) => bl.id === b.id)
      );
      const selectorEnSeccion = seccionPadre?.bloques.find(
        (bl) => bl.tipo === "selector_unidades"
      );
      if (selectorEnSeccion) {
        const opcion = selectorEnSeccion.props.opciones?.[opcionSeleccionada];
        props.opcionSeleccionada = opcion
          ? { ...opcion, index: opcionSeleccionada }   // 👈 añadir index
          : undefined;
      }
    }    if (b.tipo === "bloque_compra") props.precio = precio;

    const contenido = (
      <def.Render
        {...props}
        estilos={b.estilos || {}}
        producto={producto}
        tema={tema}   // 👈 NUEVO
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
