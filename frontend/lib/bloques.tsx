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
  tamanoFuente?: number;             // px
  pesoFuente?: "normal" | "bold" | "black";
  cursiva?: boolean;
  mayusculas?: boolean;
  interlineado?: number;             // 1.0 - 2.5
  espaciadoLetras?: number;          // px

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
  nav: Nav;               // 👈 NUEVO
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

export type BloqueDef = {
  nombre: string;
  icono: string;
  max: number; // instancias máximas (0 = sin límite)
  defaults: Record<string, any>; // props por defecto
  schema: PropSchema[]; // para generar el panel de edición
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
function NavBar({
  nav,
  onMenuClick,
}: {
  nav: Nav;
  onMenuClick?: () => void;
}) {
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
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : undefined,
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : undefined,
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : undefined,
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
    <section
      className="text-white py-3"
      style={sectionStyle}
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

function BarraEstrellas({ texto, estilos = {} }: any) {
  const style: React.CSSProperties = {
    ...aplicarTipografia(estilos),
    backgroundColor: estilos.colorFondo || "#ffffff",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : "4px",
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : "4px",
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : undefined,
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
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : undefined,
    paddingBottom: estilos.paddingAbajo ? `${estilos.paddingAbajo}px` : undefined,
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    marginTop: estilos.marginArriba ? `${estilos.marginArriba}px` : undefined,
    marginBottom: estilos.marginAbajo ? `${estilos.marginAbajo}px` : undefined,
    backgroundColor: estilos.colorFondo || undefined,
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : undefined,
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
    backgroundColor: estilos.colorFondo || "#cb1515",
    paddingTop: estilos.paddingArriba ? `${estilos.paddingArriba}px` : undefined,
    paddingBottom: estilos.paddingAbajo
      ? `${estilos.paddingAbajo}px`
      : undefined,
    paddingLeft: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
    paddingRight: estilos.paddingLados ? `${estilos.paddingLados}px` : undefined,
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

  // 👇 Si es flotante → botón fijo abajo
  if (flotante) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <button
          onClick={onComprar}
          className="w-full flex items-center justify-center gap-3 text-white py-3.5 rounded-xl font-extrabold uppercase btn-shake hover:scale-[1.01] transition"
          style={{ ...buttonStyle, width: "100%" }}
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

  // 👇 Si NO es flotante → botón inline
  return (
    <button
      onClick={onComprar}
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
      }}
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
  return (
    <section className="text-white text-center" style={sectionStyle}>
      {textoDescuento && (
        <h2 className="text-2xl md:text-4xl font-black leading-tight">
          {textoDescuento}
        </h2>
      )}
      {typeof precio === "number" && (
        <h3 className="text-2xl md:text-4xl font-black mt-3">
          PRECIO FINAL{" "}
          <span className="text-red-600">${precio.toFixed(2)}</span>
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
  };
  return (
    <section className="text-center" style={sectionStyle}>
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
            ({Number(opinionesVerificadas).toLocaleString("es-CO")} Opiniones
            verificadas)
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
    borderRadius: estilos.radioEsquinas ? `${estilos.radioEsquinas}px` : undefined,
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
    color: "#000000",
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
  return (
    <section style={sectionStyle}>
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
  };

  return (
    <section
      className={`flex flex-col gap-3 ${claseAlineacion}`}
      style={sectionStyle}
    >
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
  colapsada: boolean;         // 👈 NUEVO
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
  bloquesPermitidos: string[];  // vacío = sin restricción
  fija: boolean;                // true = no se puede borrar ni mover
  color: string;                // color del borde en el sidebar
};

// Catálogo de tipos de sección
export const TIPOS_SECCION: Record<TipoSeccion, SeccionDef> = {
  header: {
    tipo: "header",
    nombre: "Encabezado",
    icono: "🧭",
    bloquesPermitidos: ["banner_contador", "barra_estrellas"],
    fija: true,
    color: "#f59e0b",    // ámbar para secciones fijas
  },
  producto: {
    tipo: "producto",
    nombre: "Producto",
    icono: "🎯",
    bloquesPermitidos: [
      "cabecera_producto",
      "hero_imagen",
      "prueba_social",
    ],
    fija: false,
    color: "#3b82f6",
  },
  compra: {
    tipo: "compra",
    nombre: "Compra",
    icono: "💰",
    bloquesPermitidos: ["bloque_compra", "boton_comprar"],
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
    bloquesPermitidos: [],   // sin restricción
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
          colorFondo: "#cb1515",   // 👈 color va acá
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
      nav: { ...NAV_DEFAULT },   // 👈 NUEVO
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
  const def = TIPOS_SECCION[tipo];
  return {
    id: newId(),
    tipo,
    nombre: def.nombre,
    visible: true,
    colapsada: false,           // 👈 NUEVO
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
  return "custom";   // fallback
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
      secciones: plantilla.secciones.map((s: any) => ({
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

  // Meter cada bloque en su sección correspondiente
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
    bloques: plantilla.bloques || [],
    secciones: ORDEN_SECCIONES.map((t) => mapa[t]),
    tema: {
      ...plantilla.tema,
      nav: { ...NAV_DEFAULT, ...(plantilla.tema?.nav || {}) },
    },
  };
} // 👈 cierre de migrarASecciones que faltaba
// ═══════════════════════════════════════════════════════════════
// RENDERER — puro. No dispara tracking, no lee cookies.
// ═══════════════════════════════════════════════════════════════

export function ProductRenderer({
  plantilla,
  producto,
  onComprar,
    onMenuClick,   // 👈 NUEVO

  modo = "ver",
  bloqueHover = null,
  seleccionado = null,
}: {
  plantilla: Plantilla;
  producto: any;
  onComprar?: () => void;
    onMenuClick?: () => void;   // 👈 NUEVO

  modo?: "ver" | "editor";
  bloqueHover?: string | null;
  seleccionado?: string | null;
}) {
  if (!plantilla) return null;

  // 👇 Normalizar: si tiene secciones las usa, si no migra los bloques planos
  const plantillaNormalizada = migrarASecciones(plantilla);
  const precio = Number(producto?.precio || 0);
  const nav = plantillaNormalizada.tema?.nav ?? NAV_DEFAULT;  // 👈 NUEVO


  // Función que renderiza un bloque
  function renderBloque(bOriginal: Bloque) {
    const b = normalizarColores(bOriginal);   // 👈 NUEVO
    const def = BLOQUES[b.tipo];
    if (!def) return null;

    // 👇 Si está oculto, no renderizar (solo en modo ver)
    if (modo === "ver" && b.estilos?.oculto === true) return null;

    const props = { ...b.props };
    if (b.tipo === "boton_comprar") props.onComprar = onComprar;
    if (b.tipo === "bloque_compra") props.precio = precio;

    const contenido = (
      <def.Render {...props} estilos={b.estilos || {}} producto={producto} />
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
    <div style={{ paddingBottom: hayBotonFlotante ? "96px" : undefined }}>
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
