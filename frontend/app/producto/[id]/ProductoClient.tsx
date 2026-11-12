"use client";
import { apiPublica } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { ProductRenderer, construirPlantilla } from "@/lib/bloques";

const FloatingOrderModal = dynamic(
  () => import("@/components/FloatingOrderModal"),
  { ssr: false },
);
const DesktopGenericLanding = dynamic(
  () => import("@/components/DesktopGenericLanding"),
  { ssr: false },
);

// ═══════════════════════════════════════════════════════════════
// HELPERS DE COOKIES Y TRACKING (intactos, no tocar)
// ═══════════════════════════════════════════════════════════════
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
const PIXEL_A = "1499341829042883";
const PIXEL_B = "0";

function getPixelActual() {
  if (typeof window === "undefined") return PIXEL_A;
  const params = new URLSearchParams(window.location.search);
  const px = params.get("px");
  return px === PIXEL_B ? PIXEL_B : PIXEL_A;
}
// ═══════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════
export default function ProductoClient({
  producto,
  previewMode = false,
  editorMode = false,
  bloqueHover = null,
  seleccionado = null,
}: {
  producto: any;
  previewMode?: boolean;
  editorMode?: boolean;
  bloqueHover?: string | null;
  seleccionado?: string | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [opcionSeleccionadaObj, setOpcionSeleccionadaObj] = useState<any>(null);
  const [indiceOpcion, setIndiceOpcion] = useState(0);
  // Detectar pantalla de escritorio
  const [esDesktop, setEsDesktop] = useState(false);
  const eventoDisparado = useRef(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");

    const actualizar = () => setEsDesktop(media.matches);

    actualizar();

    media.addEventListener("change", actualizar);

    return () => {
      media.removeEventListener("change", actualizar);
    };
  }, []);
  const plantilla = (() => {
    const p = producto.plantilla;
    const tieneSecciones = (p?.secciones?.length ?? 0) > 0;
    const tieneBloques = (p?.bloques?.length ?? 0) > 0;
    return tieneSecciones || tieneBloques ? p : construirPlantilla(producto);
  })();

  useEffect(() => {
    import("@/components/FloatingOrderModal");
  }, []);

  useEffect(() => {
    if (previewMode) return;
    asegurarFbc();
    if (eventoDisparado.current) return;

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
          const pixel = getPixelActual();
          // Inicializamos el píxel correcto y disparamos el PageView (solo una vez por visita)
          if (!(window as any)._pixelInicializado) {
            (window as any).fbq("init", pixel);
            (window as any).fbq("trackSingle", pixel, "PageView");
            (window as any)._pixelInicializado = true;
          }

          (window as any).fbq("trackSingle", pixel, "ViewContent", {
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
  }, [producto, previewMode]);

  // ─── Ir al formulario (InitiateCheckout) ───
  async function irFormulario(opcion?: any) {
    // 👇 guarda solo si es una opción real, no un evento
    if (opcion && typeof opcion === "object" && "precio" in opcion) {
      setOpcionSeleccionadaObj(opcion); // 👈 usar el nuevo nombre
    }
    if (previewMode) return;
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
        const pixel = getPixelActual();
        (window as any).fbq("trackSingle", pixel, "InitiateCheckout", {
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

  // ─── Enviar pedido (Purchase / CompletePayment) ───
  async function enviarPedido(
    e: React.FormEvent<HTMLFormElement>,
    datosEnvio?: any,
  ) {
    e.preventDefault();
    setEnviando(true);
    setErrorBackend(null);

    const form = new FormData(e.currentTarget);
    const precioTotal =
      datosEnvio?.precio ?? opcionSeleccionadaObj?.precio ?? producto.precio;

    const precioBase =
      datosEnvio?.precioBase ??
      opcionSeleccionadaObj?.precio ??
      producto.precio;
    const envioPrioritario = datosEnvio?.envioPrioritario || false;
    const costoEnvio = datosEnvio?.costoEnvio || 0;

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
      metaPixelId: getPixelActual(), // 👈 NUEVA LÍNEA
    };

    try {
      const eventId = crypto.randomUUID();

      const res = await apiPublica.post("/pedidos", {
        ...data,
        event_id: eventId,
      });
      const bloqueado = res?.data?.bloqueado === true;

      if (!bloqueado && typeof window !== "undefined") {
        // Normalizar teléfono a E.164 → "+593991234567"
        let tel = String(data.telefono || "")
          .replace(/\D/g, "")
          .replace(/^0+/, "");
        const telefonoE164 = tel.startsWith("593") ? `+${tel}` : `+593${tel}`;

        if ((window as any).ttq) {
          const externalIdHash = await sha256Hex(getOrCreateAnonId());
          const telefonoHash = await sha256Hex(telefonoE164); // 👈 HASH del E.164
          const ttclid = asegurarTtclid();
          (window as any).ttq.identify({
            phone_number: telefonoHash, // ✅ hash SHA-256 de "+593991234567"
            external_id: externalIdHash,
            ...(ttclid && { ttclid }),
          });
          (window as any).ttq.track(
            "Purchase",
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
          const pixel = getPixelActual();
          (window as any).fbq(
            "trackSingle",
            pixel,
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

  // ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="hidden md:block">
        {esDesktop && <DesktopGenericLanding />}
      </div>

      <div className="block md:hidden">
        {/* ─── DRAWER DEL MENÚ ─── */}
        {menuAbierto && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setMenuAbierto(false)}
            />
            <aside className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold">Menú</span>
                <button
                  onClick={() => setMenuAbierto(false)}
                  className="text-gray-500 text-2xl leading-none"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>
              <nav className="space-y-4">
                <a href="/" className="block text-gray-800">
                  Inicio
                </a>
              </nav>
            </aside>
          </>
        )}

        {/* ─── MAIN ─── */}
        <main className="bg-[#121212]">
          <ProductRenderer
            plantilla={plantilla}
            producto={producto}
            onComprar={irFormulario}
            onMenuClick={() => setMenuAbierto(true)}
            opcionSeleccionada={indiceOpcion}
            onOpcionChange={setIndiceOpcion}
            modo={editorMode ? "editor" : "ver"}
            bloqueHover={bloqueHover}
            seleccionado={seleccionado}
          />

          <FloatingOrderModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            producto={producto}
            opcionSeleccionada={opcionSeleccionadaObj}
            onSubmit={(e: any, datos: any) => enviarPedido(e, datos)}
            enviando={enviando}
            errorBackend={errorBackend}
          />
        </main>
      </div>
    </>
  );
}
