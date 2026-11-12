"use client";

import { useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";

import Link from "next/link";

import AdminGuard from "@/components/AdminGuard";

import { signOut, onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";

import { useRouter } from "next/navigation";

import { generarMensajeGuia } from "@/lib/mensaje-guia";

const PAGE_SIZE = 10;

function solicitarEnvioGuia(ticket: string): Promise<{
  ok: boolean;

  estado?: string;

  error?: string;
}> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();

    const limpiar = () => {
      window.clearTimeout(timeout);

      window.removeEventListener("message", recibir);
    };

    const recibir = (evento: MessageEvent) => {
      if (
        evento.source !== window ||
        evento.origin !== window.location.origin
      ) {
        return;
      }

      const datos = evento.data;

      if (
        datos?.origen !== "lunio-extension" ||
        datos?.tipo !== "RESULTADO_ENVIO_GUIA" ||
        datos?.id !== id
      ) {
        return;
      }

      limpiar();

      resolve({
        ok: datos.ok === true,

        estado: datos.estado,

        error: datos.error,
      });
    };

    const timeout = window.setTimeout(() => {
      limpiar();

      reject(
        new Error(
          "La extensión no respondió. " +
            "Revisa WhatsApp y Firestore antes de repetir.",
        ),
      );
    }, 60000);

    window.addEventListener("message", recibir);

    window.postMessage(
      {
        origen: "lunio-admin",

        tipo: "SOLICITAR_ENVIO_GUIA",

        id,

        ticket,
      },

      window.location.origin,
    );
  });
}

type OpcionesWhatsApp = {
  extensionActiva: boolean;

  notificarAceptado: boolean;

  notificarGuia: boolean;
};

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);

  const [authReady, setAuthReady] = useState(false);

  const [loading, setLoading] = useState(true);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [pedidoDespacho, setPedidoDespacho] = useState<any | null>(null);

  const [mensajeAceptacion, setMensajeAceptacion] = useState<string | null>(
    null,
  );

  const [transportadora, setTransportadora] = useState("SERVIENTREGA");

  const [transportadoraOtra, setTransportadoraOtra] = useState("");

  const [numeroGuia, setNumeroGuia] = useState("");

  const [guardandoDespacho, setGuardandoDespacho] = useState(false);

  const [estadoWhatsApp, setEstadoWhatsApp] = useState<
    | "sin_comprobar"
    | "comprobando"
    | "sin_extension"
    | "sin_pestana"
    | "pestana_abierta"
    | "sesion_activa"
    | "error"
  >("sin_comprobar");

  const [enviandoAceptadoId, setEnviandoAceptadoId] = useState<string | null>(
    null,
  );

  // Una sola automatización de WhatsApp a la vez.

  // Evita que dos pedidos naveguen simultáneamente

  // por la misma pestaña de WhatsApp Web.

  const envioWhatsAppEnCursoRef = useRef(false);

  const comprobacionActivaRef = useRef(false);

  const [pagina, setPagina] = useState(0);

  const [hasMore, setHasMore] = useState(false);

  const [total, setTotal] = useState<number | null>(null);

  const [paginasConocidas, setPaginasConocidas] = useState(1);

  // ── Búsqueda ──────────────────────────────────────────────

  const [busqueda, setBusqueda] = useState("");

  const [buscando, setBuscando] = useState(false);

  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[] | null>(
    null,
  );

  const [tipoBusqueda, setTipoBusqueda] = useState<
    "nombre" | "telefono" | "id"
  >("nombre");
  // ── Copiar datos del pedido ──────────────────────────────
  const [avisoCopiado, setAvisoCopiado] = useState<string | null>(null);

  const temporizadorCopiado = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const copiarDato = async (valor: string, etiqueta: string) => {
    try {
      await navigator.clipboard.writeText(valor);

      setAvisoCopiado(`${etiqueta} copiado`);

      if (temporizadorCopiado.current) {
        clearTimeout(temporizadorCopiado.current);
      }

      temporizadorCopiado.current = setTimeout(() => {
        setAvisoCopiado(null);
      }, 2000);
    } catch (error) {
      console.error("Error al copiar:", error);
      setAvisoCopiado("No se pudo copiar");
    }
  };

  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [tipoAplicado, setTipoAplicado] = useState<
    "nombre" | "telefono" | "id"
  >("nombre");

  const busquedaIdRef = useRef(0); // para descartar respuestas viejas

  const [hasMoreBusqueda, setHasMoreBusqueda] = useState(false);

  const [paginaBusqueda, setPaginaBusqueda] = useState(0);

  // cursoresBusqueda.current[i] = id del último pedido de la página i-1

  const cursoresBusqueda = useRef<(string | null)[]>([null]);

  const [opcionesWhatsApp, setOpcionesWhatsApp] = useState<OpcionesWhatsApp>({
    extensionActiva: false,

    notificarAceptado: false,

    notificarGuia: false,
  });

  const [cargandoOpcionesWhatsApp, setCargandoOpcionesWhatsApp] =
    useState(true);

  const [guardandoOpcionesWhatsApp, setGuardandoOpcionesWhatsApp] =
    useState(false);

  const [errorOpcionesWhatsApp, setErrorOpcionesWhatsApp] = useState(false);

  const router = useRouter();

  const cursors = useRef<(string | null)[]>([null]);

  // 1) Verifica sesión

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");

        return;
      }

      setAuthReady(true);
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!authReady) return;

    let activo = true;

    api

      .get("/pedidos/configuracion/notificaciones")

      .then((respuesta) => {
        if (!activo) return;

        const datos = respuesta.data;

        setOpcionesWhatsApp({
          extensionActiva: datos.extensionActiva === true,

          notificarAceptado: datos.notificarAceptado === true,

          notificarGuia: datos.notificarGuia === true,
        });

        setErrorOpcionesWhatsApp(false);

        if (!datos.extensionActiva || !datos.notificarAceptado) {
          setMensajeAceptacion(null);
        }
      })

      .catch((error) => {
        console.error("Error cargando configuración WhatsApp:", error);

        if (activo) {
          setErrorOpcionesWhatsApp(true);
        }
      })

      .finally(() => {
        if (activo) setCargandoOpcionesWhatsApp(false);
      });

    return () => {
      activo = false;
    };
  }, [authReady]);

  // 2) Carga la primera página cuando hay sesión

  useEffect(() => {
    if (authReady) recargar();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  // Solo se consulta al pulsar Buscar/Enter; nunca por cada tecla.
  function aplicarFiltros() {
    const q = busqueda.trim();
    if (q && tipoBusqueda === "nombre" && q.length < 3) {
      alert("Introduce al menos 3 caracteres del nombre.");
      return;
    }
    if (q && tipoBusqueda === "telefono" && q.replace(/\D/g, "").length < 4) {
      alert("Introduce al menos 4 dígitos del teléfono.");
      return;
    }
    busquedaIdRef.current++;
    cursoresBusqueda.current = [null];
    cursors.current = [null];
    setPaginaBusqueda(0);
    setHasMoreBusqueda(false);
    setResultadosBusqueda(null);
    setBuscando(false);
    setBusquedaAplicada(q);
    setTipoAplicado(tipoBusqueda);
    if (q) void buscarPagina(q, 0, tipoBusqueda);
    else void cargarPagina(0);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setTipoBusqueda("nombre");
    busquedaIdRef.current++;
    cursoresBusqueda.current = [null];
    cursors.current = [null];
    setResultadosBusqueda(null);
    setBusquedaAplicada("");
    setTipoAplicado("nombre");
    setPaginaBusqueda(0);
    setHasMoreBusqueda(false);
    setBuscando(false);
    void cargarPagina(0);
  }

  async function cambiarOpcionWhatsApp(campo: keyof OpcionesWhatsApp) {
    if (cargandoOpcionesWhatsApp || guardandoOpcionesWhatsApp) {
      return;
    }

    const nuevasOpciones = {
      ...opcionesWhatsApp,

      [campo]: !opcionesWhatsApp[campo],
    };

    setGuardandoOpcionesWhatsApp(true);

    try {
      const respuesta = await api.put(
        "/pedidos/configuracion/notificaciones",

        nuevasOpciones,
      );

      const guardadas = respuesta.data.configuracion;

      setOpcionesWhatsApp(guardadas);

      setErrorOpcionesWhatsApp(false);

      if (!guardadas.extensionActiva || !guardadas.notificarAceptado) {
        setMensajeAceptacion(null);
      }

      if (!guardadas.extensionActiva) {
        setEstadoWhatsApp("sin_comprobar");
      }
    } catch (error) {
      console.error("Error guardando configuración:", error);

      alert("No se pudo guardar la configuración de WhatsApp.");
    } finally {
      setGuardandoOpcionesWhatsApp(false);
    }
  }

  function comprobarWhatsApp() {
    if (!authReady || comprobacionActivaRef.current) return;

    comprobacionActivaRef.current = true;

    setEstadoWhatsApp("comprobando");

    const id = crypto.randomUUID();

    let finalizado = false;

    function finalizar(
      estado:
        | "sin_extension"
        | "sin_pestana"
        | "pestana_abierta"
        | "sesion_activa"
        | "error",
    ) {
      if (finalizado) return;

      finalizado = true;

      window.clearTimeout(timeout);

      window.removeEventListener("message", recibirEstado);

      comprobacionActivaRef.current = false;

      setEstadoWhatsApp(estado);
    }

    function recibirEstado(evento: MessageEvent) {
      if (
        evento.source !== window ||
        evento.origin !== window.location.origin
      ) {
        return;
      }

      const datos = evento.data;

      if (
        datos?.origen !== "lunio-extension" ||
        datos?.tipo !== "ESTADO_WHATSAPP" ||
        datos?.id !== id
      ) {
        return;
      }

      if (!datos.ok) {
        finalizar("error");
      } else if (datos.pestanaAbierta && datos.chatsVisibles) {
        finalizar("sesion_activa");
      } else if (datos.pestanaAbierta) {
        finalizar("pestana_abierta");
      } else {
        finalizar("sin_pestana");
      }
    }

    // Escuchar únicamente durante esta comprobación.

    window.addEventListener("message", recibirEstado);

    // Tiempo máximo de espera, no es un sondeo.

    const timeout = window.setTimeout(() => {
      finalizar("sin_extension");
    }, 4000);

    try {
      // Una única consulta local por clic.

      window.postMessage(
        {
          origen: "lunio-admin",

          tipo: "COMPROBAR_WHATSAPP",

          id,
        },

        window.location.origin,
      );
    } catch (error) {
      console.error("[LUNIO] Error comprobando WhatsApp:", error);

      finalizar("error");
    }
  }

  async function logout() {
    await signOut(auth);

    router.push("/login");
  }

  function recargar() {
    cursors.current = [null];
    cursoresBusqueda.current = [null];
    setPaginasConocidas(1);

    if (busquedaAplicada) {
      void buscarPagina(busquedaAplicada, 0, tipoAplicado);
    } else {
      void cargarPagina(0);
    }
  }

  async function cargarPagina(p: number) {
    if (p < 0 || (p > 0 && !cursors.current[p])) return;
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
      };
      const cur = cursors.current[p];
      if (cur) params.cursor = cur;
      const res = await api.get("/pedidos/", { params });
      const { items, next_cursor, has_more } = res.data;
      cursors.current[p + 1] = has_more ? next_cursor : null;
      setPaginasConocidas(p + (has_more ? 2 : 1));
      setTotal(null); // Sin conteo adicional a Firestore
      setPedidos(items ?? []);
      setHasMore(Boolean(has_more));
      setPagina(p);
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 401) {
        router.replace("/login");
        return;
      }
      alert(error.response?.data?.detail || "Error cargando pedidos");
    } finally {
      setLoading(false);
    }
  }

  async function buscarPagina(
    q: string,
    p: number,
    tipo: "nombre" | "telefono" | "id" = tipoAplicado,
  ) {
    if (p < 0 || (p > 0 && !cursoresBusqueda.current[p])) return;
    const id = ++busquedaIdRef.current;
    setBuscando(true);
    try {
      const params: Record<string, string> = { q, tipo };
      const cur = cursoresBusqueda.current[p];
      if (cur) params.cursor = cur;
      const res = await api.get("/pedidos/buscar", { params });
      if (id !== busquedaIdRef.current) return;
      const { items, next_cursor, has_more } = res.data;
      cursoresBusqueda.current[p + 1] = has_more ? next_cursor : null;
      setResultadosBusqueda(items ?? []);
      setHasMoreBusqueda(Boolean(has_more));
      setPaginaBusqueda(p);
    } catch (error: any) {
      if (id !== busquedaIdRef.current) return;
      console.error(error);
      if (error.response?.status === 401) {
        router.replace("/login");
        return;
      }
      alert(error.response?.data?.detail || "Error buscando pedidos");
    } finally {
      if (id === busquedaIdRef.current) setBuscando(false);
    }
  }

  async function prepararMensajeAceptacion(pedido: any) {
    const respuesta = await api.get("/pedidos/configuracion/mensajes");

    const plantilla = respuesta.data?.plantillas?.aceptado;

    if (typeof plantilla !== "string" || !plantilla.trim()) {
      throw new Error("No existe una plantilla de aceptación configurada.");
    }

    const variables: Record<string, string> = {
      nombre: String(pedido.nombre || "cliente").trim(),

      producto: String(pedido.productoNombre || "producto").trim(),

      transportadora: String(pedido.transportadora || ""),

      guia: String(pedido.numeroGuia || ""),
    };

    return plantilla.replace(
      /\{(nombre|producto|transportadora|guia)\}/g,

      (_coincidencia: string, variable: string) => variables[variable] ?? "",
    );
  }

  function actualizarWhatsAppAceptadoLocal(id: string, estado: string) {
    const actualizar = (items: any[]) =>
      items.map((p) =>
        p.id === id
          ? {
              ...p,

              whatsappAceptado: {
                ...(p.whatsappAceptado || {}),

                estado,
              },
            }
          : p,
      );

    setPedidos((prev) => actualizar(prev));

    setResultadosBusqueda((prev) => (prev ? actualizar(prev) : null));
  }

  async function enviarMensajeAceptado(id: string) {
    if (
      !opcionesWhatsApp.extensionActiva ||
      !opcionesWhatsApp.notificarAceptado
    ) {
      return;
    }

    // Respetar la comprobación manual.

    if (estadoWhatsApp !== "sesion_activa") {
      alert("Primero pulsa Comprobar y conecta WhatsApp.");

      return;
    }

    // WhatsApp Web utiliza una sola pestaña.

    // Nunca iniciar dos envíos simultáneamente.

    if (envioWhatsAppEnCursoRef.current) return;

    envioWhatsAppEnCursoRef.current = true;

    setEnviandoAceptadoId(id);

    let autorizado = false;

    try {
      const autorizacion = await api.post(
        `/pedidos/${id}/whatsapp/autorizar?tipo=aceptado`,
      );

      autorizado = true;

      actualizarWhatsAppAceptadoLocal(id, "reservado");

      // Reutilizamos el puente existente de la extensión.

      // El backend identifica el tipo mediante el ticket.

      const resultado = await solicitarEnvioGuia(autorizacion.data.ticket);

      const estado =
        resultado.ok && resultado.estado === "clic_ejecutado"
          ? "clic_ejecutado"
          : "requiere_revision";

      actualizarWhatsAppAceptadoLocal(id, estado);

      if (estado === "clic_ejecutado") {
        alert(
          "✅ La extensión pulsó Enviar en WhatsApp.\n\n" +
            "Comprueba que el mensaje aparezca enviado.\n" +
            "Esto todavía no confirma la entrega.",
        );
      } else {
        alert(
          "⚠️ No se confirmó el envío de aceptación.\n\n" +
            (resultado.error || "Revisa WhatsApp y Firestore.") +
            "\n\nNo repitas el intento sin verificarlo.",
        );
      }
    } catch (error: any) {
      console.error("[LUNIO] Notificación de aceptación:", error);

      const detalle =
        error?.response?.data?.detail ||
        error?.message ||
        "No se pudo procesar la notificación.";

      alert(
        (autorizado
          ? "⚠️ Resultado incierto.\n" +
            "Revisa WhatsApp y Firestore antes de reintentar.\n\n"
          : "⚠️ No se autorizó el envío.\n\n") + detalle,
      );
    } finally {
      envioWhatsAppEnCursoRef.current = false;

      setEnviandoAceptadoId(null);
    }
  }

  async function cambiarEstado(id: string, estado: string) {
    if (updatingId) return;

    const pedido = listaActual.find((p) => p.id === id);

    if (!pedido) return;

    if (
      estado === "guia_enviada" &&
      opcionesWhatsApp.extensionActiva &&
      opcionesWhatsApp.notificarGuia
    ) {
      setPedidoDespacho(pedido);

      setTransportadora("SERVIENTREGA");

      setTransportadoraOtra("");

      setNumeroGuia("");

      return;
    }

    const esNuevaAceptacion =
      estado === "aceptado" && pedido.estado === "pendiente";

    setUpdatingId(id);

    try {
      const respuesta = await api.patch(
        `/pedidos/${id}/estado?estado=${estado}`,
      );

      const actualizar = (items: any[]) =>
        items.map((p) => {
          if (p.id !== id) return p;

          return {
            ...p,

            estado,

            ...(estado === "aceptado"
              ? {
                  whatsappAceptado: respuesta.data.whatsappAceptado,
                }
              : {}),
          };
        });

      setPedidos((prev) => actualizar(prev));

      setResultadosBusqueda((prev) => (prev ? actualizar(prev) : null));

      if (
        opcionesWhatsApp.extensionActiva &&
        opcionesWhatsApp.notificarAceptado &&
        esNuevaAceptacion &&
        respuesta.data.yaAceptado === false
      ) {
        // Mostrar la plantilla personalizada del cliente.

        try {
          const mensaje = await prepararMensajeAceptacion(pedido);

          setMensajeAceptacion(mensaje);
        } catch (error) {
          console.error("[LUNIO] Error cargando vista previa:", error);

          alert(
            "Pedido aceptado, pero no fue posible " +
              "mostrar la vista previa del mensaje.",
          );
        }

        // El envío es automático SOLO si antes

        // se comprobó manualmente WhatsApp.

        if (
          estadoWhatsApp === "sesion_activa" &&
          respuesta.data.whatsappAceptado?.estado === "pendiente"
        ) {
          void enviarMensajeAceptado(id);
        }
      }
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.detail ||
          "Error cambiando el estado del pedido.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function guardarDespacho() {
    if (!pedidoDespacho || guardandoDespacho) return;

    console.log("🚀 [LUNIO] Iniciando despacho:", {
      estadoWhatsApp,

      pedidoId: pedidoDespacho.id,
    });

    const nombreTransportadora =
      transportadora === "OTRA" ? transportadoraOtra.trim() : transportadora;

    const guia = numeroGuia.trim();

    if (!nombreTransportadora || guia.length < 4) {
      alert("Completa correctamente la transportadora y el número de guía.");

      return;
    }

    setGuardandoDespacho(true);

    try {
      const res = await api.patch(`/pedidos/${pedidoDespacho.id}/despacho`, {
        transportadora: nombreTransportadora,

        numeroGuia: guia,
      });

      const datosActualizados = {
        estado: res.data.estado,

        transportadora: res.data.transportadora,

        numeroGuia: res.data.numeroGuia,

        whatsappGuia: res.data.whatsappGuia,
      };

      const mensajeWhatsApp = generarMensajeGuia(
        res.data.transportadora,

        res.data.numeroGuia,
      );
      console.log("Guía preparada para notificación:", {
        pedidoId: pedidoDespacho.id,

        mensajePreparado: Boolean(mensajeWhatsApp),

        estado: res.data.whatsappGuia?.estado,
      });
      const actualizar = (items: any[]) =>
        items.map((p) =>
          p.id === pedidoDespacho.id ? { ...p, ...datosActualizados } : p,
        );

      setPedidos((prev) => actualizar(prev));

      setResultadosBusqueda((prev) =>
        prev === null ? null : actualizar(prev),
      );

      // Los resultados anteriores ya no contienen el estado actualizado.

      setPedidoDespacho(null);

      console.log("🚚 [LUNIO] Despacho guardado:", {
        pedidoId: pedidoDespacho.id,

        estadoWhatsApp,

        estadoPedido: res.data.estado,

        whatsappGuia: res.data.whatsappGuia,
      });

      console.log(
        "📲 [LUNIO] ¿Puede iniciar notificación?",

        estadoWhatsApp === "sesion_activa",
      );

      // La guía ya está guardada en Firestore.

      // Si WhatsApp falla, NO repetimos el PATCH del despacho.

      console.log("🔍 [LUNIO] Diagnóstico de despacho:", {
        estadoWhatsApp,

        pedidoId: pedidoDespacho.id,

        transportadora: res.data.transportadora,

        numeroGuia: res.data.numeroGuia,

        whatsappGuia: res.data.whatsappGuia,
      });

      console.log("📲 [LUNIO] Antes de enviar WhatsApp:", {
        estadoWhatsApp,

        pedidoId: pedidoDespacho.id,

        estadoGuia: res.data.whatsappGuia?.estado,
      });

      console.log("📲 [LUNIO] Estado al guardar despacho:", {
        estadoWhatsApp,

        pedidoId: pedidoDespacho.id,

        estadoGuia: res.data.whatsappGuia?.estado,
      });

      // La guía ya fue registrada en Firestore.

      // Si la notificación está desactivada, terminamos aquí.

      if (
        !opcionesWhatsApp.extensionActiva ||
        !opcionesWhatsApp.notificarGuia
      ) {
        return;
      }

      if (estadoWhatsApp !== "sesion_activa") {
        alert(
          "Guía registrada correctamente.\n\n" +
            "WhatsApp no está disponible. " +
            "No se intentó enviar el mensaje.",
        );

        return;
      }

      // Evitar que una guía interrumpa un envío de aceptación.

      if (envioWhatsAppEnCursoRef.current) {
        alert(
          "✅ Guía registrada correctamente.\n\n" +
            "Otra notificación de WhatsApp está en proceso.\n" +
            "El mensaje de guía quedó pendiente.",
        );

        return;
      }

      // Reservar el uso de la extensión.

      envioWhatsAppEnCursoRef.current = true;

      try {
        console.log("📡 [LUNIO] Solicitando autorización de WhatsApp");

        const autorizacion = await api.post(
          `/pedidos/${pedidoDespacho.id}/whatsapp/autorizar`,
        );

        console.log("✅ [LUNIO] Autorización recibida:", {
          autorizada: Boolean(autorizacion.data.ticket),
        });

        const resultado = await solicitarEnvioGuia(autorizacion.data.ticket);

        if (resultado.ok && resultado.estado === "clic_ejecutado") {
          alert(
            "✅ Guía registrada.\n\n" +
              "La extensión ejecutó Enviar en WhatsApp.\n" +
              "Verifica la recepción del mensaje.",
          );
        } else {
          alert(
            "✅ Guía registrada.\n\n" +
              "⚠️ No se confirmó el envío por WhatsApp.\n" +
              (resultado.error || "Revisa el estado del intento.") +
              "\n\nNo intentes reenviar sin comprobarlo.",
          );
        }
      } catch (error: any) {
        const detalle =
          error?.response?.data?.detail ||
          error?.message ||
          "Error de notificación.";

        alert(
          "✅ La guía quedó registrada en Firebase.\n\n" +
            "⚠️ WhatsApp no se pudo procesar:\n" +
            detalle +
            "\n\nRevisa el estado antes de volver a intentar.",
        );
      } finally {
        envioWhatsAppEnCursoRef.current = false;
      }

      recargar();
    } catch (error: any) {
      console.error(error);

      const detalle = error?.response?.data?.detail;

      alert(
        typeof detalle === "string" ? detalle : "No se pudo registrar la guía.",
      );
    } finally {
      setGuardandoDespacho(false);
    }
  }

  const ESTADOS: Record<string, { label: string; style: string }> = {
    pendiente: { label: "⏳ Pendiente", style: "bg-yellow-600" },

    aceptado: { label: "✓ Aceptado", style: "bg-green-600" },

    guia_enviada: { label: "🚚 Guía enviada", style: "bg-blue-600" },

    entregado: { label: "📦 Entregado", style: "bg-emerald-700" },

    cancelado: { label: "✗ Cancelado", style: "bg-red-600" },
  };

  const getEstado = (estado: string) => ESTADOS[estado] ?? ESTADOS.pendiente;

  const inicio = pagina * PAGE_SIZE + 1;

  const fin = pagina * PAGE_SIZE + pedidos.length;

  // Modo búsqueda activo cuando hay 2+ caracteres

  const modoBusqueda = busquedaAplicada.length > 0;

  const listaActual = modoBusqueda ? (resultadosBusqueda ?? []) : pedidos;

  const mostrandoLoading = modoBusqueda ? buscando : loading;

  if (!authReady) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-block w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
          <p>Cargando...</p>
        </div>
      </main>
    );
  }
  {
    /* Notificación flotante de copiado */
  }
  return (
    <AdminGuard>
      {mensajeAceptacion !== null &&
        opcionesWhatsApp.extensionActiva &&
        opcionesWhatsApp.notificarAceptado && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-mensaje-aceptacion"
              className="w-full max-w-lg rounded-2xl bg-gray-800 p-5 text-white shadow-2xl"
            >
              <h2
                id="titulo-mensaje-aceptacion"
                className="mb-2 text-xl font-bold"
              >
                ✅ Pedido aceptado
              </h2>

              <p className="mb-4 text-sm text-gray-400">
                Mensaje configurado para este cliente.
              </p>

              <div className="rounded-xl bg-[#0b141a] p-4">
                <div className="ml-auto rounded-xl bg-[#005c4b] p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {mensajeAceptacion}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs text-amber-300">
                Vista previa del mensaje configurado. Verifica el estado real
                del envío en WhatsApp y Firestore.{" "}
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMensajeAceptacion(null)}
                  className="flex-1 rounded-lg bg-gray-600 px-4 py-3"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(mensajeAceptacion);
                  }}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium"
                >
                  📋 Copiar mensaje
                </button>
              </div>
            </div>
          </div>
        )}

      {pedidoDespacho && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-despacho"
            className="w-full max-w-md rounded-2xl bg-gray-800 p-4 text-white shadow-2xl"
          >
            <h2 id="titulo-despacho" className="mb-2 text-xl font-bold">
              🚚 Registrar guía de envío
            </h2>

            <p className="mb-5 text-sm text-gray-400">
              {pedidoDespacho.nombre}

              <span className="block">{pedidoDespacho.telefono}</span>
            </p>

            <label className="mb-2 block text-sm">Transportadora</label>

            <select
              value={transportadora}
              onChange={(e) => setTransportadora(e.target.value)}
              disabled={guardandoDespacho}
              className="mb-4 w-full rounded-lg border border-gray-600 bg-gray-700 p-3"
            >
              <option value="SERVIENTREGA">Servientrega</option>

              <option value="GINTRACOM">Gintracom</option>

              <option value="VELOCES">Veloces</option>

              <option value="LAARCOURIER">LaarCourier</option>
            </select>

            {transportadora === "OTRA" && (
              <input
                type="text"
                value={transportadoraOtra}
                onChange={(e) => setTransportadoraOtra(e.target.value)}
                placeholder="Nombre de la transportadora"
                maxLength={60}
                disabled={guardandoDespacho}
                className="mb-4 w-full rounded-lg border border-gray-600 bg-gray-700 p-3"
              />
            )}

            <label className="mb-2 block text-sm">Número de guía</label>

            <input
              type="text"
              value={numeroGuia}
              onChange={(e) => setNumeroGuia(e.target.value)}
              placeholder="Ej. 1800026423"
              maxLength={80}
              disabled={guardandoDespacho}
              className="mb-4 w-full rounded-lg border border-gray-600 bg-gray-700 p-3"
            />

            {opcionesWhatsApp.extensionActiva &&
              opcionesWhatsApp.notificarGuia && (
                <p className="mb-5 text-xs text-gray-400">
                  La guía se asociará al teléfono del cliente y se enviará por
                  WhatsApp si está conectado.
                </p>
              )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPedidoDespacho(null)}
                disabled={guardandoDespacho}
                className="flex-1 rounded-lg bg-gray-600 px-4 py-3 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarDespacho}
                disabled={
                  guardandoDespacho ||
                  numeroGuia.trim().length < 4 ||
                  (transportadora === "OTRA" && !transportadoraOtra.trim())
                }
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium disabled:opacity-50"
              >
                {guardandoDespacho ? "Guardando..." : "Confirmar despacho"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-gray-900">
        <div className="w-full max-w-none mx-auto px-4 xl:px-6 2xl:px-8 py-4">
          {/* Header */}

          <div className="bg-gray-800 rounded-xl p-3 mb-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">📦 Pedidos</h1>

                <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full border border-blue-500/30">
                  🇬🇹Guatemala
                </span>
              </div>

              <div className="grid grid-cols-2 md:flex gap-2">
                <button
                  onClick={recargar}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Cargando...
                    </>
                  ) : (
                    <>🔄 Actualizar</>
                  )}
                </button>

                <Link
                  href="/admin/blacklist"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors text-center"
                >
                  🚫 Blacklist
                </Link>

                <Link
                  href="/admin/mensajes"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors text-center"
                >
                  💬 Mensajes
                </Link>

                <Link
                  href="/admin/config"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors text-center"
                >
                  ⚙️ Config
                </Link>

                <Link
                  href="/admin/productos"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors text-center"
                >
                  📋 Productos
                </Link>

                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  🚪 Salir
                </button>
              </div>
            </div>

            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-white">
                  💬 WhatsApp Business
                </p>

                <p className="text-xs text-gray-400">
                  {estadoWhatsApp === "comprobando" &&
                    "Comprobando extensión..."}

                  {estadoWhatsApp === "sin_extension" &&
                    "⚠️ La extensión no respondió · Revisa Navegador"}

                  {estadoWhatsApp === "sin_pestana" &&
                    "Extensión detectada · Abre WhatsApp Web"}

                  {estadoWhatsApp === "pestana_abierta" &&
                    "WhatsApp Web abierto · Sesión aún no verificada"}

                  {estadoWhatsApp === "sesion_activa" &&
                    "🟢 WhatsApp Business conectado · Conversaciones disponibles"}

                  {estadoWhatsApp === "error" &&
                    "No fue posible comprobar WhatsApp"}

                  {estadoWhatsApp === "sin_comprobar" &&
                    "⚪ WhatsApp sin comprobar · Pulsa Comprobar"}
                </p>
              </div>

              <button
                type="button"
                onClick={comprobarWhatsApp}
                disabled={
                  !authReady ||
                  !opcionesWhatsApp.extensionActiva ||
                  cargandoOpcionesWhatsApp ||
                  estadoWhatsApp === "comprobando"
                }
                className="rounded-lg bg-gray-700 px-3 py-2 text-xs font-medium text-white hover:bg-gray-600 disabled:opacity-50"
              >
                {estadoWhatsApp === "comprobando"
                  ? "⏳ Comprobando..."
                  : "🔄 Comprobar"}
              </button>
            </div>

            <div className="mb-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white">
              <h2 className="mb-1 text-sm font-semibold">
                ⚙️ Configuración de notificaciones
              </h2>

              {errorOpcionesWhatsApp && (
                <p className="mb-3 text-xs text-amber-300">
                  No se pudo cargar la configuración. Los envíos permanecen
                  desactivados en esta página.
                </p>
              )}

              {(
                [
                  ["extensionActiva", "Extensión de WhatsApp"],

                  ["notificarAceptado", "Notificar pedidos aceptados"],

                  ["notificarGuia", "Notificar guías de envío"],
                ] as [keyof OpcionesWhatsApp, string][]
              ).map(([campo, etiqueta]) => (
                <div
                  key={campo}
                  className="flex items-center justify-between gap-3 border-b border-gray-700 py-3 last:border-0"
                >
                  <span className="text-sm">{etiqueta}</span>

                  <button
                    type="button"
                    aria-pressed={opcionesWhatsApp[campo]}
                    disabled={
                      cargandoOpcionesWhatsApp || guardandoOpcionesWhatsApp
                    }
                    onClick={() => void cambiarOpcionWhatsApp(campo)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold disabled:opacity-50 ${
                      opcionesWhatsApp[campo]
                        ? "bg-green-700 text-white"
                        : "bg-gray-600 text-gray-200"
                    }`}
                  >
                    {opcionesWhatsApp[campo] ? "Activado" : "Desactivado"}
                  </button>
                </div>
              ))}
            </div>

            {/* Buscador sin caché y sin consultas al escribir */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                aplicarFiltros();
              }}
              className="bg-gray-800 rounded-xl p-4 mb-6 flex flex-wrap items-end gap-3"
            >
              <label className="text-sm text-gray-200 flex flex-col gap-1">
                Buscar por
                <select
                  value={tipoBusqueda}
                  onChange={(e) =>
                    setTipoBusqueda(
                      e.target.value as "nombre" | "telefono" | "id",
                    )
                  }
                  className="bg-gray-700 rounded-lg px-3 py-2 border border-gray-600"
                >
                  <option value="nombre">Nombre</option>
                  <option value="telefono">Teléfono</option>
                  <option value="id">ID</option>
                </select>
              </label>
              <label className="text-sm text-gray-200 flex-1 min-w-[200px] flex flex-col gap-1">
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder={
                    tipoBusqueda === "nombre"
                      ? "Nombre Cliente"
                      : tipoBusqueda === "telefono"
                        ? "Telefono"
                        : "ID"
                  }
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                />
              </label>
              <button
                type="submit"
                disabled={buscando || loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white"
              >
                Limpiar
              </button>
            </form>
          </div>
          {/* Tabla */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1250px] table-auto text-[13px]">
                <thead>
                  <tr className="bg-gray-700 border-b border-gray-600">
                    {[
                      "🆔 ID",
                      "🛍️ Producto",
                      "📅 Fecha",
                      "👤 Cliente",
                      "🏠 Dirección",
                      "📍 Departamento",
                      "🏙️ Ciudad",
                      "💰 Precio",
                      "📊 Estado",
                      "⚡ Acciones",
                    ].map((h) => (
                      <th
                        key={h}
                        className="p-3 text-left text-gray-200 font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {mostrandoLoading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center py-12 text-gray-400"
                      >
                        <div className="inline-block w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>

                        <p>
                          {modoBusqueda ? "Buscando..." : "Cargando pedidos..."}
                        </p>
                      </td>
                    </tr>
                  ) : listaActual.length > 0 ? (
                    listaActual.map((pedido) => (
                      <tr
                        key={pedido.id}
                        className="border-b border-gray-700 hover:bg-gray-700/50"
                      >
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() =>
                              void copiarDato(String(pedido.id), "ID")
                            }
                            title={`Copiar ID: ${pedido.id}`}
                            className="group flex items-center gap-2 text-left text-xs text-purple-300 hover:text-purple-200 transition-colors"
                          >
                            <span className="max-w-[115px] truncate font-mono">
                              {pedido.id}
                            </span>

                            <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                              📋
                            </span>
                          </button>
                        </td>
                        <td className="p-3 text-gray-300 max-w-[180px] truncate">
                          {pedido.productoNombre}
                        </td>

                        <td className="p-3 text-gray-300 whitespace-nowrap text-xs">
                          {pedido.creadoEn
                            ? new Date(pedido.creadoEn).toLocaleString(
                                "es-CO",

                                {
                                  timeZone: "America/Bogota",

                                  day: "2-digit",

                                  month: "2-digit",

                                  year: "numeric",

                                  hour: "2-digit",

                                  minute: "2-digit",
                                },
                              )
                            : "-"}
                        </td>

                        <td className="p-3">
                          <div className="flex flex-col items-start gap-1.5">
                            {/* Nombre: clic para copiar */}
                            <button
                              type="button"
                              onClick={() =>
                                void copiarDato(
                                  String(pedido.nombre || ""),
                                  "Nombre",
                                )
                              }
                              title="Copiar nombre"
                              className="group flex items-center gap-2 text-left text-white hover:text-purple-300 transition-colors"
                            >
                              <span className="block min-w-[170px] max-w-[230px] whitespace-normal break-words font-medium leading-relaxed">
                                {pedido.nombre || "Sin nombre"}
                              </span>

                              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                📋
                              </span>
                            </button>

                            {/* Teléfono: clic para copiar */}
                            <button
                              type="button"
                              onClick={() =>
                                void copiarDato(
                                  String(pedido.telefono || ""),
                                  "Teléfono",
                                )
                              }
                              title="Copiar teléfono"
                              className="group flex items-center gap-2 text-left text-xs text-gray-400 hover:text-green-400 transition-colors"
                            >
                              <span>{pedido.telefono || "Sin teléfono"}</span>

                              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                📋
                              </span>
                            </button>
                          </div>
                        </td>

                        <td className="w-[280px] min-w-[280px] max-w-[280px] px-3 py-3 align-middle text-gray-300">
                          <div className="flex flex-col gap-2">
                            {/* DIRECCIÓN: clic para copiar */}
                            <button
                              type="button"
                              onClick={() =>
                                void copiarDato(
                                  String(pedido.direccion || ""),
                                  "Dirección",
                                )
                              }
                              title={`Copiar dirección: ${pedido.direccion || ""}`}
                              className="group flex w-full items-start gap-2 text-left hover:text-purple-300 transition-colors"
                            >
                              <span className="min-w-0 flex-1 line-clamp-2 break-words leading-relaxed">
                                {pedido.direccion || "Sin dirección"}
                              </span>

                              <span className="shrink-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                📋
                              </span>
                            </button>

                            {/* REFERENCIA: clic para copiar */}
                            {pedido.referencia && (
                              <button
                                type="button"
                                onClick={() =>
                                  void copiarDato(
                                    String(pedido.referencia),
                                    "Referencia",
                                  )
                                }
                                title={`Copiar referencia: ${pedido.referencia}`}
                                className="group flex w-full items-start gap-2 text-left text-xs text-gray-400 hover:text-green-300 transition-colors"
                              >
                                <span className="min-w-0 flex-1 line-clamp-3 break-words leading-relaxed">
                                  {pedido.referencia}
                                </span>

                                <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  📋
                                </span>
                              </button>
                            )}
                          </div>
                        </td>

                        
<td className="w-[135px] min-w-[135px] px-2 py-3 text-gray-300">
  <button
    type="button"
    onClick={() =>
      void copiarDato(
        String(pedido.departamento || ""),
        "Provincia"
      )
    }
    title={`Copiar provincia: ${pedido.departamento || ""}`}
    className="group flex w-full items-center gap-1.5 text-left transition-colors hover:text-purple-300"
  >
    <span className="min-w-0 flex-1 break-words">
      {pedido.departamento || "Sin provincia"}
    </span>

    <span className="shrink-0 text-xs opacity-0 transition-opacity group-hover:opacity-100">
      📋
    </span>
  </button>
</td>


                       
<td className="w-[120px] min-w-[120px] px-2 py-3 text-gray-300">
  <button
    type="button"
    onClick={() =>
      void copiarDato(
        String(pedido.ciudad || ""),
        "Ciudad"
      )
    }
    title={`Copiar ciudad: ${pedido.ciudad || ""}`}
    className="group flex w-full items-center gap-1.5 text-left transition-colors hover:text-purple-300"
  >
    <span className="min-w-0 flex-1 break-words">
      {pedido.ciudad || "Sin ciudad"}
    </span>

    <span className="shrink-0 text-xs opacity-0 transition-opacity group-hover:opacity-100">
      📋
    </span>
  </button>
</td>


                        <td className="w-[100px] min-w-[100px] whitespace-nowrap px-3 py-4 font-semibold text-white">
                          ${Number(pedido.precio || 0).toLocaleString("es-CO")}
                        </td>

                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs text-white whitespace-nowrap ${getEstado(pedido.estado).style}`}
                          >
                            {getEstado(pedido.estado).label}
                          </span>
                        </td>

                        <td className="p-3">
                          <select
                            value={pedido.estado || "pendiente"}
                            onChange={(e) =>
                              cambiarEstado(pedido.id, e.target.value)
                            }
                            disabled={updatingId === pedido.id}
                            className="bg-gray-700 text-white text-xs rounded px-2 py-1.5 border border-gray-600 disabled:opacity-50 cursor-pointer"
                          >
                            {Object.entries(ESTADOS).map(
                              ([valor, { label }]) => (
                                <option key={valor} value={valor}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>

                          {opcionesWhatsApp.extensionActiva &&
                            opcionesWhatsApp.notificarAceptado &&
                            pedido.estado === "aceptado" &&
                            pedido.whatsappAceptado?.estado === "pendiente" && (
                              <button
                                type="button"
                                onClick={() => {
                                  void enviarMensajeAceptado(pedido.id);
                                }}
                                disabled={
                                  estadoWhatsApp !== "sesion_activa" ||
                                  enviandoAceptadoId !== null
                                }
                                title="Enviar notificación de aceptación pendiente"
                                className="mt-2 block rounded bg-blue-600 px-2 py-1.5 text-xs text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {enviandoAceptadoId === pedido.id
                                  ? "⏳ Procesando..."
                                  : "📲 Enviar aceptación"}
                              </button>
                            )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="text-center py-12 text-gray-400"
                      >
                        <div className="text-4xl mb-2">
                          {modoBusqueda ? "🔍" : "📭"}
                        </div>

                        <p>
                          {modoBusqueda
                            ? `Sin resultados para "${busquedaAplicada}"`
                            : "No hay pedidos aún"}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINACIÓN DE BÚSQUEDA */}

          {modoBusqueda &&
            resultadosBusqueda &&
            resultadosBusqueda.length > 0 && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-400 text-sm">
                <div>
                  Resultados de la búsqueda · página {paginaBusqueda + 1}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                    onClick={() =>
                      buscarPagina(busquedaAplicada, paginaBusqueda - 1)
                    }
                    disabled={paginaBusqueda === 0 || buscando}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ◀
                  </button>

                  <span className="px-3 py-1 rounded bg-purple-600 text-white">
                    {paginaBusqueda + 1}
                  </span>

                  <button
                    onClick={() =>
                      buscarPagina(busquedaAplicada, paginaBusqueda + 1)
                    }
                    disabled={!hasMoreBusqueda || buscando}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}

          {!modoBusqueda && pedidos.length > 0 && (
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-400 text-sm">
              <div>
                Mostrando {inicio} - {fin}
                {total !== null ? ` de ${total}` : ""} pedidos
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => cargarPagina(pagina - 1)}
                  disabled={pagina === 0 || loading}
                  className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ◀
                </button>

                {Array.from({ length: paginasConocidas }, (_, i) => {
                  const esActiva = i === pagina;

                  const alcanzable = cursors.current[i] !== undefined;

                  return (
                    <button
                      key={i}
                      onClick={() => cargarPagina(i)}
                      disabled={loading || !alcanzable}
                      className={`px-3 py-1 rounded transition ${
                        esActiva
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      } disabled:opacity-40`}
                    >
                      {i + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => cargarPagina(pagina + 1)}
                  disabled={!hasMore || loading}
                  className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  ▶
                </button>
              </div>
            </div>
          )}

          {!modoBusqueda && (
            <div className="mt-4 text-center text-xs text-gray-500">
              Mostrando {pedidos.length} registros
            </div>
          )}
        </div>
      </main>

      {avisoCopiado && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-2xl"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            ✓
          </span>

          <span>{avisoCopiado}</span>
        </div>
      )}
    </AdminGuard>
  );
}
