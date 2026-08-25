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

export default function ProductoClient2({ producto }: { producto: any }) {
  const cfg = producto.disenoModerno || {};

  const [modalOpen, setModalOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [tiempo, setTiempo] = useState({ horas: 0, minutos: 28, segundos: 59 });
  const [mostrarFlotante, setMostrarFlotante] = useState(false);

  useEffect(() => {
    import("@/components/FloatingOrderModal");
  }, []);

  // Botón flotante: aparece después de que el usuario pasa el hero (scroll > 420px)
  useEffect(() => {
    function onScroll() {
      setMostrarFlotante(window.scrollY > 420);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    asegurarFbc();

    async function trackViewContent() {
      if (typeof window !== "undefined" && producto) {
        if ((window as any).ttq) {
          const externalIdHash = await sha256Hex(getOrCreateAnonId());
          const ttclid = asegurarTtclid();
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
    if (!cfg.mostrarContador) return;
    setTiempo({
      horas: 0,
      minutos: Number(cfg.minutosContador || 28),
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
              minutos = Number(cfg.minutosContador || 28);
              segundos = 59;
            }
          }
        }
        return { horas, minutos, segundos };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [producto, cfg.mostrarContador, cfg.minutosContador]);

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

      const res = await apiPublica.post("/pedidos", {
        ...data,
        event_id: eventId,
      });
      const bloqueado = res?.data?.bloqueado === true;

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
      setErrorBackend(
        mensaje || "No pudimos procesar tu pedido. Intenta de nuevo.",
      );
    } finally {
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
        <main
          className={`bg-white min-h-screen ${mostrarFlotante ? "pb-20" : ""}`}
        >
          {cfg.mostrarContador && (
            <section
              className="text-white py-2 px-4 flex items-center justify-between text-xs md:text-sm font-extrabold uppercase"
              style={{ backgroundColor: cfg.colorBanner || "#E06000" }}
            >
              <div className="leading-tight text-center italic font-black">
                DESCUENTO POR
                <br />
                TIEMPO LIMITADO
              </div>
              <div className="flex items-center gap-1">
                <div className="bg-white text-black font-black rounded px-2 py-1 text-base">
                  {String(tiempo.horas).padStart(2, "0")}
                </div>
                <span className="font-bold text-white">:</span>
                <div className="bg-white text-black font-black rounded px-2 py-1 text-base">
                  {String(tiempo.minutos).padStart(2, "0")}
                </div>
                <span className="font-bold text-white">:</span>
                <div className="bg-white text-black font-black rounded px-2 py-1 text-base">
                  {String(tiempo.segundos).padStart(2, "0")}
                </div>
              </div>
            </section>
          )}

          {/* ✅ FIX #5: ahora lee de cfg, no de producto.mostrarEstrellas
              (ese campo ya no existe en la raíz del producto) */}
          {cfg.mostrarEstrellas && (
            <div className="bg-white text-[#2B2B2B] text-center text-xs font-extrabold py-1.5 flex items-center justify-center gap-1 border-b border-gray-100">
              <span className="text-yellow-500 text-sm">⭐⭐⭐⭐⭐</span>
              <span>
                {cfg.textoEstrellas || "+100.000 clientes satisfechos"}
              </span>
            </div>
          )}

          {/* Imagen principal: ahora fuera del contenedor con padding,
              full-bleed (ocupa todo el ancho, borde a borde). */}
          {producto.imagenesLanding?.imagen1 && (
            <Image
              src={producto.imagenesLanding.imagen1}
              alt={producto.nombre}
              width={600}
              height={600}
              sizes="100vw"
              className="w-full h-auto block"
              priority
              fetchPriority="high"
            />
          )}

          <section className="px-6 pt-3 pb-8 text-center">
            <div>
              {/* ✅ FIX #4: ahora respeta el check mostrarOrdenesHoy del admin */}
              {cfg.mostrarOrdenesHoy && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <Image
                      width={123}
                      height={44}
                      src="/imagen-resenas.png"
                      alt="User"
                      className="h-6 w-auto object-contain"
                    />
                  </div>
                  <span className="text-xs font-black text-black tracking-tight uppercase">
                    +{cfg.ordenesHoy || 137} ÓRDENES HOY
                  </span>
                </div>
              )}

              {cfg.mostrarOpinionesVerificadas && (
                <div className="flex flex-col items-start gap-1 mb-3">
                  <span className="text-gray-500 text-xs">
                    (
                    {Number(
                      cfg.opinionesVerificadasCount ?? 1247,
                    ).toLocaleString("es-CO")}{" "}
                    Opiniones verificadas)
                  </span>
                </div>
              )}

              {/* ✅ FIX #7: quité el padding propio de este bloque (ya está
                  dentro del <section> de arriba que tiene su px-6 py-8;
                  tenerlo 2 veces apretaba el contenido en mobile) */}
              <div className="text-start">
                <h1 className="text-2xl md:text-3xl font-black text-[#121212]">
                  {producto.nombre}
                </h1>

                {cfg.caracteristicasDestacadas && (
                  <p className="text-[#D66700] font-bold text-sm md:text-base mt-2 whitespace-pre-line text-left">
                    {cfg.caracteristicasDestacadas}
                  </p>
                )}

                {/* ✅ FIX #6: este es el ÚNICO render del checklist ahora.
                    Antes se repetía otra vez después del botón. */}
                {cfg.beneficiosChecklist?.length > 0 && (
                  <div className="mt-6 space-y-3 text-left max-w-md mx-auto">
                    {cfg.beneficiosChecklist.map(
                      (b: { titulo: string; descripcion: string }, i: number) =>
                        (b.titulo || b.descripcion) && (
                          <div key={i} className="flex items-start gap-3">
                            <span className="text-[#D66700] text-lg flex-shrink-0">
                              ✓
                            </span>
                            <p className="text-[#181818] text-sm md:text-base">
                              <strong>{b.titulo}</strong>
                              {b.descripcion && <>: {b.descripcion}</>}
                            </p>
                          </div>
                        ),
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <span className="text-2xl md:text-4xl font-black text-[#242424]">
                    AHORA{" "}
                    <span className="text-[#D66700]">${precio.toFixed(2)}</span>
                    {producto.precioAntes > 0 && (
                      <span className="text-[#A09898] line-through text-lg md:text-2xl ml-2">
                        ${Number(producto.precioAntes).toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={irFormulario}
              className="w-full my-6 flex items-center justify-center gap-3 bg-[#cb1515] text-white py-4 px-6 rounded-md shadow-lg font-extrabold uppercase relative overflow-hidden btn-shake hover:scale-[1.01] transition"
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
          </section>

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
          {/* Sección FAQ - Réplica exact en alto y ancho */}
          {producto.preguntasFrecuentes?.length > 0 && (
            <section className="bg-black py-10 px-4 text-white">
              {/* Título */}
              <h2 className="text-white text-xl md:text-2xl font-black text-center mb-6 tracking-wide uppercase leading-tight">
                USTEDES PREGUNTAN, ¡NOSOTROS RESPONDEMOS!
              </h2>

              {/* Contenedor sin límite de ancho tan estrecho (w-full max-w-xl o max-w-2xl) */}
              <div className="space-y-3 w-full max-w-2xl mx-auto">
                {producto.preguntasFrecuentes.map((faq: any, index: number) => {
                  if (!faq.pregunta) return null;
                  return (
                    <details
                      key={index}
                      className="group bg-white rounded-lg px-5 py-5 md:py-6 text-left shadow-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-center justify-between font-normal text-[#242424] text-sm md:text-base select-none pr-1">
                        <span>{faq.pregunta}</span>
                        {/* Icono SVG idéntico al original */}
                        <span className="shrink-0 ml-3 text-[#242424] transition-transform duration-200 group-open:rotate-45">
                          <svg
                            height="20"
                            width="20"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 256 256"
                            fill="currentColor"
                          >
                            <path d="M228,128a12,12,0,0,1-12,12H140v76a12,12,0,0,1-24,0V140H40a12,12,0,0,1,0-24h76V40a12,12,0,0,1,24,0v76h76A12,12,0,0,1,228,128Z" />
                          </svg>
                        </span>
                      </summary>
                      {faq.respuesta && (
                        <p className="text-gray-600 mt-4 text-xs md:text-sm leading-relaxed border-t border-gray-100 pt-3">
                          {faq.respuesta}
                        </p>
                      )}
                    </details>
                  );
                })}
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

          {mostrarFlotante && (
            <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
              <button
                onClick={irFormulario}
                className="w-full flex items-center justify-center gap-3 bg-[#cb1515] text-white py-3.5 rounded-xl font-extrabold uppercase shadow-lg shadow-red-200 hover:scale-[1.01] transition"
              >
                {svgCarrito}
                <span className="text-sm">
                  {cfg.textoBoton || "Comprar ahora"}
                </span>
                <span className="text-sm">${precio.toFixed(2)}</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
