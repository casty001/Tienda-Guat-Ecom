"use client";
import Image from "next/image";
import { apiPublica } from "@/lib/api";
import { useEffect, useState } from "react";
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

// ═══════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════
export default function ProductoClient({
  producto,
  previewMode = false,
  editorMode = false,
}: {
  producto: any;
  previewMode?: boolean;
  editorMode?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorBackend, setErrorBackend] = useState<string | null>(null);

  const plantilla =
  producto.plantilla?.bloques?.length > 0
    ? producto.plantilla
    : construirPlantilla(producto);

    useEffect(() => {
    import("@/components/FloatingOrderModal");
  }, []);

  useEffect(() => {
    if (previewMode) return; 
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
  }, [producto, previewMode]);

  // ─── Ir al formulario (InitiateCheckout) ───
  async function irFormulario() {
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

  // ─── Enviar pedido (Purchase / CompletePayment) ───
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

  // ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="hidden md:block">
        <DesktopGenericLanding />
      </div>

      <div className="block md:hidden">
        <main className="bg-[#121212] min-h-screen">
          <ProductRenderer
  plantilla={plantilla}
  producto={producto}
  onComprar={irFormulario}
  modo={editorMode ? "editor" : "ver"}
/>

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