"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AdminGuard from "@/components/AdminGuard";

type Branding = { 
  nombre_tienda: string; 
  logo_url?: string | null; 
  correos_notificacion?: string[];
};

export default function AdminConfigPage() {
  const [nombre, setNombre] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 👇 Estado de correos inicializado con 3 vacíos
  const [correos, setCorreos] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    api
      .get<Branding>("/config")
      .then((res) => {
        setNombre(res.data.nombre_tienda);
        setLogoUrl(res.data.logo_url ?? null);
        
        // Aseguramos que siempre haya 3 campos
        const correosCargados = res.data.correos_notificacion || [];
        const relleno = [...correosCargados];
        while (relleno.length < 3) relleno.push("");
        setCorreos(relleno.slice(0, 3)); // Máximo 3
      })
      .catch(() => setError("No se pudo cargar la configuración"))
      .finally(() => setLoading(false));
  }, []);

  async function subirLogo(file: File) {
    setSubiendo(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post("/upload/imagen", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.url;
      if (!url) throw new Error("Respuesta sin URL");
      setLogoUrl(url);
    } catch {
      setError("No se pudo subir el logo");
    } finally {
      setSubiendo(false);
    }
  }

  async function guardar() {
    setGuardando(true);
    setMsg(null);
    setError(null);
    try {
      const res = await api.put<Branding>("/config", {
        nombre_tienda: nombre.trim(),
        logo_url: logoUrl,
        // Enviamos el array de 3, el backend se encarga de limpiar los vacíos
        correos_notificacion: correos, 
      });
      
      setNombre(res.data.nombre_tienda);
      setLogoUrl(res.data.logo_url ?? null);
      
      // Al guardar, volvemos a asegurar los 3 campos
      const correosGuardados = res.data.correos_notificacion || [];
      const relleno = [...correosGuardados];
      while (relleno.length < 3) relleno.push("");
      setCorreos(relleno.slice(0, 3));

      setMsg("Guardado ✅");
    } catch {
      setError("No se pudo guardar. ¿Sesión admin activa?");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) {
    return (
      <AdminGuard>
        <main className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
          <p>Cargando…</p>
        </main>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">⚙️ Configuración de la tienda</h1>
            <Link
              href="/admin/pedidos"
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
            >
              ← Volver
            </Link>
          </div>

          <div className="space-y-6 rounded-xl bg-gray-800 p-6">
            {/* Preview */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-400">
                Vista previa del catálogo
              </p>
              <div className="flex items-center gap-3 rounded-lg bg-gray-900 p-4">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="logo"
                    className="h-12 w-12 rounded-full bg-white object-contain"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl">
                    🌙
                  </span>
                )}
                <span className="text-2xl font-extrabold">
                  {nombre || "Lunio Store"}
                </span>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Nombre de la tienda
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={80}
                className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Logo */}
            <div>
              <label className="mb-1 block text-sm font-medium">Logo</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={subiendo}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-600 disabled:opacity-50"
                >
                  {subiendo ? "Subiendo…" : "Cambiar logo"}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="text-sm text-red-400 underline"
                  >
                    Quitar logo
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void subirLogo(f);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Correos de notificación */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Correos para notificaciones de pedidos (máx. 3)
              </label>
              <p className="mb-3 text-xs text-gray-500">
                Estos correos recibirán un aviso cada vez que entre un nuevo pedido.
              </p>
              
              <div className="space-y-2">
                {correos.map((correo, index) => (
                  <div key={index}>
                    <input
                      type="email"
                      value={correo}
                      onChange={(e) => {
                        const nuevos = [...correos];
                        nuevos[index] = e.target.value;
                        setCorreos(nuevos);
                      }}
                      placeholder={`Correo ${index + 1} (ejemplo@correo.com)`}
                      className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {msg && <p className="text-sm text-green-400">{msg}</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={guardar}
              disabled={guardando || !nombre.trim()}
              className="w-full rounded-lg bg-blue-600 py-3 font-bold hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </main>
    </AdminGuard>
  );
}