
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminGuard from "@/components/AdminGuard";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { api } from "@/lib/api";

type TipoMensaje = "aceptado" | "guia_enviada";

type Plantillas = Record<TipoMensaje, string>;

const VARIABLES = [
  "{nombre}",
  "{producto}",
  "{transportadora}",
  "{guia}"
];

const EJEMPLO: Record<string, string> = {
  nombre: "Gilda",
  producto: "PeterThomas",
  transportadora: "SERVIENTREGA",
  guia: "1800026423"
};

function generarVistaPrevia(texto: string) {
  return texto.replace(
    /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g,
    (original, variable: string) =>
      EJEMPLO[variable] ?? original
  );
}

export default function AdminMensajesPage() {
  const [tipo, setTipo] =
    useState<TipoMensaje>("aceptado");

  const [plantillas, setPlantillas] =
    useState<Plantillas | null>(null);

  const [predeterminadas, setPredeterminadas] =
    useState<Plantillas | null>(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    let activo = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (usuario) => {
        if (!usuario) return;

        try {
          const respuesta = await api.get(
            "/pedidos/configuracion/mensajes"
          );

          if (!activo) return;

          setPlantillas(respuesta.data.plantillas);
          setPredeterminadas(
            respuesta.data.predeterminadas
          );
        } catch (err) {
          console.error(err);

          if (activo) {
            setError(
              "No fue posible cargar las plantillas."
            );
          }
        } finally {
          if (activo) setCargando(false);
        }
      }
    );

    return () => {
      activo = false;
      unsubscribe();
    };
  }, []);

  function modificarTexto(texto: string) {
    if (!plantillas) return;

    setPlantillas({
      ...plantillas,
      [tipo]: texto
    });

    setExito("");
  }

  async function guardar() {
    if (!plantillas || guardando) return;

    setGuardando(true);
    setError("");
    setExito("");

    try {
      await api.put(
        "/pedidos/configuracion/mensajes",
        plantillas
      );

      setExito("Mensajes guardados correctamente.");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        "No fue posible guardar los mensajes."
      );
    } finally {
      setGuardando(false);
    }
  }

  function restaurarPlantilla() {
    if (!plantillas || !predeterminadas) return;

    setPlantillas({
      ...plantillas,
      [tipo]: predeterminadas[tipo]
    });

    setExito("");
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-gray-900 px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl space-y-6">

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">
                💬 Mensajes de WhatsApp
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Personaliza las notificaciones de Lunio Store.
              </p>
            </div>

            <Link
              href="/admin/pedidos"
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm"
            >
              ← Volver a pedidos
            </Link>
          </div>

          {cargando ? (
            <p className="text-gray-400">
              Cargando configuración...
            </p>
          ) : plantillas ? (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setTipo("aceptado")}
                  className={`rounded-lg px-4 py-3 text-sm ${
                    tipo === "aceptado"
                      ? "bg-blue-600"
                      : "bg-gray-700"
                  }`}
                >
                  ✅ Pedido aceptado
                </button>

                <button
                  onClick={() => setTipo("guia_enviada")}
                  className={`rounded-lg px-4 py-3 text-sm ${
                    tipo === "guia_enviada"
                      ? "bg-blue-600"
                      : "bg-gray-700"
                  }`}
                >
                  🚚 Guía enviada
                </button>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-xl bg-gray-800 p-5">
                  <h2 className="mb-3 font-semibold">
                    Editar mensaje
                  </h2>

                  <p className="mb-3 text-xs text-gray-400">
                    Variables disponibles:
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {VARIABLES.map((variable) => (
                      <code
                        key={variable}
                        className="rounded bg-gray-700 px-2 py-1 text-xs text-blue-300"
                      >
                        {variable}
                      </code>
                    ))}
                  </div>

                  <textarea
                    value={plantillas[tipo]}
                    onChange={(e) =>
                      modificarTexto(e.target.value)
                    }
                    rows={15}
                    maxLength={2500}
                    className="w-full resize-y rounded-lg border border-gray-600 bg-gray-900 p-4 text-sm leading-relaxed outline-none focus:border-blue-500"
                  />

                  <p className="mt-2 text-right text-xs text-gray-400">
                    {plantillas[tipo].length}/2500
                  </p>

                  <button
                    onClick={restaurarPlantilla}
                    className="mt-3 text-sm text-gray-300 underline"
                  >
                    Restaurar texto predeterminado
                  </button>
                </section>

                <section className="rounded-xl bg-gray-800 p-5">
                  <h2 className="mb-3 font-semibold">
                    Vista previa
                  </h2>

                  <div className="rounded-xl bg-[#0b141a] p-4">
                    <div className="mb-4 text-sm text-gray-300">
                      💬 Cliente de ejemplo
                    </div>

                    <div className="ml-auto max-w-sm rounded-xl bg-[#005c4b] p-4 text-sm leading-relaxed shadow">
                      <p className="whitespace-pre-wrap break-words">
                        {generarVistaPrevia(plantillas[tipo])}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-gray-400">
                    Los valores de la vista previa son ficticios.
                    En el envío se utilizarán los datos del
                    pedido correspondiente.
                  </p>
                </section>
              </div>

              {error && (
                <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              {exito && (
                <p className="rounded-lg bg-green-900/30 p-3 text-sm text-green-300">
                  {exito}
                </p>
              )}

              <button
                onClick={guardar}
                disabled={guardando}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {guardando
                  ? "Guardando..."
                  : "💾 Guardar mensajes"}
              </button>
            </>
          ) : (
            <p className="text-red-300">
              No se pudo cargar la configuración.
            </p>
          )}
        </div>
      </main>
    </AdminGuard>
  );
}
