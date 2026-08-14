"use client";
import Image from "next/image";
import { apiPublica } from "@/lib/api";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const FloatingOrderModal = dynamic(
  () => import("@/components/FloatingOrderModal"),
  { ssr: false },
);
const DesktopGenericLanding = dynamic(
  () => import("@/components/DesktopGenericLanding"),
  { ssr: false },
);
// helper para leer cookies del navegador (_fbp y _fbc)
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 90) {
  if (typeof document === "undefined") return;
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000,
  ).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

// 👇 Nuevo: asegura que _fbc exista, incluso si el navegador (in-app) no la creó solo
function asegurarFbc(): string | null {
  const existente = getCookie("_fbc");
  if (existente) return existente;

  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  if (!fbclid) return null;

  const fbcGenerado = `fb.1.${Date.now()}.${fbclid}`;
  setCookie("_fbc", fbcGenerado);
  return fbcGenerado;
}
function asegurarTtclid(): string | null {
  const existente = getCookie("_ttclid");
  if (existente) return existente;
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const ttclid = params.get("ttclid");
  if (!ttclid) return null;
  setCookie("_ttclid", ttclid, 90);
  return ttclid;
}
async function sha256Hex(texto: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(texto.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getOrCreateAnonId(): string {
  const existente = getCookie("_anon_id");
  if (existente) return existente;
  const id = crypto.randomUUID();
  setCookie("_anon_id", id, 90);
  return id;
}

function getTtclid(): string | null {
  return getCookie("_ttclid");
}

export default function ProductoClient({
  producto,
}: {
  producto: any;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [tiempo, setTiempo] = useState({
    horas: 0,
    minutos: 28,
    segundos: 59,
  });

  useEffect(() => {
    import("@/components/FloatingOrderModal");
  }, []);

  useEffect(() => {
    asegurarFbc();

    async function trackViewContent() {
      if (typeof window !== "undefined" && producto) {
        if ((window as any).ttq) {
          const externalIdHash = await sha256Hex(getOrCreateAnonId());
          const ttclid = asegurarTtclid();
          //debug
          //console.log("🔍 TikTok identify:", { external_id: externalIdHash, ttclid })
          (window as any).ttq.identify({
            external_id: externalIdHash,
            ...(ttclid && { ttclid }),
          });
          (window as any).ttq.track("ViewContent", {
            contents: [
              {
                content_id: String(producto.id),
                content_type: "product",
                content_name: producto.nombre,
              },
            ],
            value: Number(producto.precio || 0),
            currency: "USD",
          });
        }

        if ((window as any).fbq) {
          //debug
          //console.log("🔍 Meta ViewContent:", {
          (window as any).fbq("track", "ViewContent", {
            content_ids: [producto.id],
            content_type: "product",
            content_name: producto.nombre,
            value: Number(producto.precio || 0),
            currency: "USD",
          });
        }
      }
    }

    trackViewContent();
  }, [producto]);

  useEffect(() => {
    if (!producto?.mostrarContador) return;
    setTiempo({
      horas: 0,
      minutos: Number(producto.minutosContador || 28),
      segundos: 59,
    });
    const interval = setInterval(() => {
      setTiempo((prev) => {
        let { horas, minutos, segundos } = prev;
        if (segundos > 0) {
          segundos--;
        } else {
          segundos = 59;
          if (minutos > 0) {
            minutos--;
          } else {
            minutos = 59;
            if (horas > 0) {
              horas--;
            } else {
              horas = 0;
              minutos = Number(producto.minutosContador || 28);
              segundos = 59;
            }
          }
        }
        return { horas, minutos, segundos };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [producto]);

  async function irFormulario() {
    if (typeof window !== "undefined" && producto) {
      if ((window as any).ttq) {
        const externalIdHash = await sha256Hex(getOrCreateAnonId());
        const ttclid = asegurarTtclid();
        (window as any).ttq.identify({
          external_id: externalIdHash,
          ...(ttclid && { ttclid }),
        });
        (window as any).ttq.track("InitiateCheckout", {
          contents: [
            {
              content_id: String(producto.id),
              content_type: "product",
              content_name: producto.nombre,
            },
          ],
          value: Number(producto.precio || 0),
          currency: "USD",
        });
      }

      if ((window as any).fbq) {
        (window as any).fbq("track", "InitiateCheckout", {
          content_ids: [producto.id],
          content_type: "product",
          content_name: producto.nombre,
          value: Number(producto.precio || 0),
          currency: "USD",
        });
      }
    }
    setModalOpen(true);
  }

  async function enviarPedido(
  e: React.FormEvent<HTMLFormElement>,
  datosEnvio?: any,
) {
  e.preventDefault();
  setEnviando(true);
  setErrorBackend(null);
  
  const form = new FormData(e.currentTarget);
  const precioTotal = datosEnvio?.precio || producto.precio;
  const envioPrioritario = datosEnvio?.envioPrioritario || false;
  const costoEnvio = datosEnvio?.costoEnvio || 0;
  const precioBase = datosEnvio?.precioBase || producto.precio;

  const data = {
    nombre: String(form.get("nombre") || ""),
    telefono: String(form.get("telefono") || ""),
    departamento: String(form.get("departamento") || ""),
    ciudad: String(form.get("ciudad") || ""),
    direccion: String(form.get("direccion") || ""),
    referencia: String(form.get("referencia") || ""),
    productoId: producto.id,
    productoNombre: producto.nombre,
    precio: precioTotal,
    precioBase: precioBase,
    costoEnvio: costoEnvio,
    envioPrioritario: envioPrioritario,
    imagen: producto.imagen,
    fbp: getCookie("_fbp"),
    fbc: asegurarFbc(),
    ttclid: asegurarTtclid(),
    anonId: getOrCreateAnonId(),
    url: typeof window !== "undefined" ? window.location.href : "",
  };

  try {
    const eventId = crypto.randomUUID();

    // 👇 1. Se crea el pedido primero. El backend decide si el número está en blacklist.
    const res = await apiPublica.post("/pedidos", { ...data, event_id: eventId });
    const bloqueado = res?.data?.bloqueado === true;

    // 👇 2. Solo si NO está bloqueado se dispara Purchase/CompletePayment.
    //    Este bloque es exactamente el mismo tracking que ya tenías, solo movido de lugar.
    if (!bloqueado && typeof window !== "undefined") {
      const telefonoLimpio = String(data.telefono || "").replace(/\D/g, "");
      const telefonoFinal = telefonoLimpio.startsWith("593")
        ? telefonoLimpio
        : `593${telefonoLimpio}`;

      if ((window as any).ttq) {
        const externalIdHash = await sha256Hex(getOrCreateAnonId());
        const ttclid = asegurarTtclid();
        (window as any).ttq.identify({
          phone_number: telefonoFinal,
          external_id: externalIdHash,
          ...(ttclid && { ttclid }),
        });
        (window as any).ttq.track(
          "CompletePayment",
          {
            contents: [
              {
                content_id: String(producto.id),
                content_type: "product",
                content_name: producto.nombre,
              },
            ],
            value: Number(precioTotal || 0),
            currency: "USD",
          },
          { event_id: eventId },
        );
      }

      if ((window as any).fbq) {
        (window as any).fbq(
          "track",
          "Purchase",
          {
            content_ids: [producto.id],
            content_type: "product",
            content_name: producto.nombre,
            value: Number(precioTotal || 0),
            currency: "USD",
          },
          { eventID: eventId },
        );
      }
    }

    window.location.replace(`/gracias?producto=${producto.id}`);
} catch (error: any) {
  console.error(error);
  const detail = error?.response?.data?.detail;
  const mensaje = Array.isArray(detail)
    ? detail[0]?.msg?.replace("Value error, ", "")
    : detail;
  setErrorBackend(mensaje || "No pudimos procesar tu pedido. Intenta de nuevo.");
}finally {
    setEnviando(false);
  }
}

  const precio = Number(producto.precio || 0);

  const svgCarrito = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-6 h-6 fill-white shrink-0"
    >
      <path d="M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.37-.66-.11-1.48-.87-1.48H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45zM6.16 6h12.15l-2.76 5H8.53L6.16 6zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );

  return (
  <>
    <div className="hidden md:block">
      <DesktopGenericLanding />
    </div>

    <div className="block md:hidden">
      <main className="bg-[#121212] min-h-screen">
      {producto.mostrarContador && (
        <section className="bg-red-800 text-white py-3">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center font-black italic leading-tight text-sm md:text-xl">
              <p>DESCUENTO POR</p>
              <p>TIEMPO LIMITADO</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white text-black rounded-xl px-4 py-3 text-xl font-black">
                {String(tiempo.horas).padStart(2, "0")}
              </div>
              <span className="text-white font-black text-xl">:</span>
              <div className="bg-white text-black rounded-xl px-4 py-3 text-xl font-black">
                {String(tiempo.minutos).padStart(2, "0")}
              </div>
              <span className="text-white font-black text-xl">:</span>
              <div className="bg-white text-black rounded-xl px-4 py-3 text-xl font-black">
                {String(tiempo.segundos).padStart(2, "0")}
              </div>
            </div>
          </div>
        </section>
      )}

      {producto.mostrarEstrellas && (
        <div className="bg-white text-black text-center text-sm md:text-base font-bold py-1">
          ⭐⭐⭐⭐⭐{" "}
          {producto.textoEstrellas || "+100.000 clientes satisfechos"}
        </div>
      )}

      {producto.imagenesLanding?.imagen1 && (
        <Image
          src={producto.imagenesLanding.imagen1}
          alt={producto.nombre}
          width={1200}
          height={1600}
          sizes="100vw"
          className="w-full h-auto"
          priority
          fetchPriority="high"
        />
      )}

      <button
        onClick={irFormulario}
        className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden btn-shake hover:scale-[1.01] transition"
      >
        {svgCarrito}
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">
            PEDIR AHORA Y PAGAR AL RECIBIR
          </span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">
            2.044 Vendidas - 14 Unidades disponibles
          </span>
        </div>
      </button>

      {producto.mostrarInfoCompra && (
        <section className="bg-[#121212] text-white p-6 text-center">
          <h2 className="text-2xl md:text-4xl font-black leading-tight">
            {producto.textoDescuento ||
              "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS"}
          </h2>
          <h3 className="text-2xl md:text-4xl font-black mt-3">
            PRECIO FINAL{" "}
            <span className="text-red-600">${precio.toFixed(2)}</span>
          </h3>
          <div className="mt-8 text-left max-w-3xl mx-auto divide-y divide-[#2a2a2a] bg-inherit">
            <details className="p-5">
              <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
                <span>📦 ¿Qué incluye?</span>
                <span>▼</span>
              </summary>
              <p className="mt-4 text-gray-200">
                {producto.queIncluye || "Incluye el producto seleccionado."}
              </p>
            </details>
            <details className="p-5">
              <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
                <span>🚚 Información de envío</span>
                <span>▼</span>
              </summary>
              <p className="mt-4 text-gray-200">
                {producto.informacionEnvio ||
                  "Enviamos a tu ciudad y pagas al recibir."}
              </p>
            </details>
            <details className="p-5">
              <summary className="cursor-pointer font-bold text-xl flex justify-between items-center">
                <span>↩️ Devoluciones y reembolsos</span>
                <span>▼</span>
              </summary>
              <p className="mt-4 text-gray-200">
                {producto.devolucionesReembolsos ||
                  "Nuestro equipo te ayudará si tienes inconvenientes."}
              </p>
            </details>
          </div>
        </section>
      )}

      <button
        onClick={irFormulario}
        className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden btn-shake hover:scale-[1.01] transition"
      >
        {svgCarrito}
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">
            PEDIR AHORA Y PAGAR AL RECIBIR
          </span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">
            2.044 Vendidas - 14 Unidades disponibles
          </span>
        </div>
      </button>

      {producto.imagenesLanding?.imagen2 && (
        <Image
          src={producto.imagenesLanding.imagen2}
          alt={producto.nombre}
          width={1200}
          height={1600}
          sizes="100vw"
          className="w-full h-auto"
        />
      )}

      <button
        onClick={irFormulario}
        className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden btn-shake hover:scale-[1.01] transition"
      >
        {svgCarrito}
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">
            PEDIR AHORA Y PAGAR AL RECIBIR
          </span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">
            2.044 Vendidas - 14 Unidades disponibles
          </span>
        </div>
      </button>

      {producto.imagenesLanding?.imagen3 && (
        <Image
          src={producto.imagenesLanding.imagen3}
          alt={producto.nombre}
          width={1200}
          height={1600}
          sizes="100vw"
          className="w-full h-auto"
        />
      )}

      <button
        onClick={irFormulario}
        className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden btn-shake hover:scale-[1.01] transition"
      >
        {svgCarrito}
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">
            PEDIR AHORA Y PAGAR AL RECIBIR
          </span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">
            2.044 Vendidas - 14 Unidades disponibles
          </span>
        </div>
      </button>

      {producto.imagenesLanding?.imagen4 && (
        <Image
          src={producto.imagenesLanding.imagen4}
          alt={producto.nombre}
          width={1200}
          height={1600}
          sizes="100vw"
          className="w-full h-auto"
        />
      )}
      <button
        onClick={irFormulario}
        className="w-[90%] mx-auto my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden btn-shake hover:scale-[1.01] transition"
      >
        {svgCarrito}
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] md:text-[18px]">
            PEDIR AHORA Y PAGAR AL RECIBIR
          </span>
          <span className="text-[11px] md:text-[12px] font-medium opacity-90 normal-case">
            2.044 Vendidas - 14 Unidades disponibles
          </span>
        </div>
      </button>
      {producto.imagenesLanding?.imagen5 && (
        <Image
          src={producto.imagenesLanding.imagen5}
          alt={producto.nombre}
          width={1200}
          height={1600}
          sizes="100vw"
          className="w-full h-auto"
        />
      )}

      {producto.preguntasFrecuentes?.length > 0 && (
        <section className="bg-[#121212] p-6">
          <h2 className="text-white text-3xl font-bold text-center mb-6">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {producto.preguntasFrecuentes.map((faq: any, index: number) => (
              <div key={index} className="bg-white rounded-xl p-4">
                <h3 className="text-[#121212] font-bold">{faq.pregunta}</h3>
                <p className="text-[#121212]">{faq.respuesta}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {producto.mostrarResenas && producto.resenas?.length > 0 && (
        <section className="bg-white text-black p-6">
          <h2 className="text-3xl font-black text-center mb-6">
            Opiniones de clientes
          </h2>
          <div className="space-y-4">
            {producto.resenas.map((resena: any, index: number) => (
              <div key={index} className="border rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-bold">{resena.nombre}</h3>
                    <p className="text-sm text-gray-500">
                      {resena.ciudad} · {resena.fecha}
                    </p>
                  </div>
                  {resena.verificado && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                      Verificado
                    </span>
                  )}
                </div>
                <div className="text-yellow-500 mb-2">
                  {"⭐".repeat(Number(resena.puntuacion || 5))}
                </div>
                <p className="text-gray-700">{resena.resena}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <FloatingOrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        producto={producto}
        onSubmit={(e: any, datos: any) => enviarPedido(e, datos)}
        enviando={enviando}
        errorBackend={errorBackend}
      />
    </main>
    </div>
  </>
  );
}
