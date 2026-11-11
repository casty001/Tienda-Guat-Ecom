"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";

const PROMESAS = ["Envío a todo Guatemala", "Pagas al recibir"];

const POR_PAGINA = 10;
const CACHE_MS = 2 * 60 * 1000; // 2 min (solo la primera página sin búsqueda)
const DEBOUNCE_MS = 400;

type Producto = {
  id: number | string;
  nombre: string;
  imagen: string;
  precio: number | string;
  precioAntes?: number | string;
};

let cache: { t: number; items: Producto[]; next: string | null } | null = null;

const usd = (valor: number | string) => {
  const n = Number(valor);
  return n.toLocaleString("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

function Luna({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function Esqueleto() {
  return (
    <div className="motion-safe:animate-pulse">
      <div className="aspect-[4/5] rounded-lg bg-neutral-200" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-4/5 rounded bg-neutral-200" />
        <div className="h-5 w-1/3 rounded bg-neutral-200" />
        <div className="h-10 rounded-lg bg-neutral-200" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const reqId = useRef(0);

  const [branding, setBranding] = useState<{
    nombre_tienda: string;
    logo_url: string | null;
  }>({
    nombre_tienda: "Lunio Store",
    logo_url: null,
  });

  // Branding (nombre y logo de la tienda)
  useEffect(() => {
    let cancel = false;
    api
      .get("/config")
      .then((res) => {
        if (!cancel && res?.data) setBranding(res.data);
      })
      .catch(() => {
        /* Si falla, se queda el default */
      });
    return () => {
      cancel = true;
    };
  }, []);

  // Carga de productos de 10 en 10 (reset = primera página, si no = "Ver más")
  async function cargar(reset: boolean, cursor: string | null = null) {
    const q = busqueda.trim();
    const mine = ++reqId.current;

    if (reset) {
      setLoading(true);
      setError(false);
    } else {
      setCargandoMas(true);
    }

    try {
      const res = await api.get("/productos", {
        params: {
          limit: POR_PAGINA,
          search: q || undefined,
          start_after: cursor || undefined,
        },
      });
      if (mine !== reqId.current) return; // llegó una respuesta más nueva

      const items: Producto[] = res.data?.items ?? [];
      const next: string | null = res.data?.next_cursor ?? null;

      setProductos((prev) => {
        if (reset) return items;
        const ya = new Set(prev.map((p) => p.id));
        return [...prev, ...items.filter((p) => !ya.has(p.id))];
      });
      setNextCursor(next);

      if (reset && !q) cache = { t: Date.now(), items, next };
    } catch (err: any) {
      if (mine !== reqId.current) return;
      console.error(err);
      if (reset) setError(true);
      else alert("No pudimos cargar más productos. Intenta de nuevo.");
    } finally {
      if (mine === reqId.current) {
        setLoading(false);
        setCargandoMas(false);
      }
    }
  }

  // Primera página: al entrar, al buscar (con debounce) y al reintentar
  useEffect(() => {
    const q = busqueda.trim();

    if (!q && cache && Date.now() - cache.t < CACHE_MS) {
      reqId.current++; // descarta cualquier respuesta en camino
      setProductos(cache.items);
      setNextCursor(cache.next);
      setLoading(false);
      setError(false);
      return;
    }

    const t = setTimeout(() => cargar(true, null), q ? DEBOUNCE_MS : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, intento]);

  const hayBusqueda = busqueda.trim().length > 0;

  return (
    <main
      className="min-h-screen bg-white text-neutral-900"
      style={{ fontFamily: "var(--font-lunio), system-ui, sans-serif" }}
    >
      {/* Barra de anuncios */}
      <div className="bg-neutral-900 text-white">
        <ul className="mx-auto flex max-w-6xl items-center justify-center gap-6 overflow-x-auto px-4 py-2 text-xs sm:text-sm">
          {PROMESAS.map((t) => (
            <li key={t} className="flex shrink-0 items-center gap-1.5">
              <Luna className="h-3 w-3 text-[#ffd84d]" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Header dinámico */}
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-center gap-3 px-4 sm:h-24 sm:px-6">
          {branding.logo_url ? (
            <Image
              src={branding.logo_url}
              alt={branding.nombre_tienda}
              width={48}
              height={48}
              className="h-11 w-11 rounded-full object-contain sm:h-12 sm:w-12"
              priority
            />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 sm:h-12 sm:w-12">
              <Luna className="h-7 w-7 text-[#ffd84d] sm:h-8 sm:w-8" />
            </span>
          )}
          <h1 className="text-3xl font-extrabold leading-none tracking-tight sm:text-4xl">
            {branding.nombre_tienda}
          </h1>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Buscador (consulta al servidor con debounce) */}
          <div className="relative w-full sm:max-w-xs">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setBusqueda("");
              }}
              placeholder="Buscar producto"
              aria-label="Buscar producto"
              className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder-neutral-500 focus:border-neutral-900 focus:outline-none"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-neutral-100 p-8 text-center">
            <p className="mb-4 text-lg font-semibold">
              No pudimos cargar los productos
            </p>
            <button
              onClick={() => setIntento((n) => n + 1)}
              className="rounded-lg bg-[#ffd84d] px-6 py-3 font-bold text-black"
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => <Esqueleto key={i} />)}

              {!loading &&
                productos.map((producto, index) => {
                  const antes = Number(producto.precioAntes);
                  const ahora = Number(producto.precio);

                  return (
                    <Link
                      key={producto.id}
                      href={`/producto/${producto.id}`}
                      className="group flex flex-col focus:outline-none"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-neutral-100 group-focus-visible:ring-2 group-focus-visible:ring-neutral-900">
                        {producto.imagen ? (
                          <Image
                            src={producto.imagen}
                            alt={producto.nombre || "Producto"}
                            width={400}
                            height={500}
                            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
                            priority={index < 2}
                            className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-neutral-200" />
                        )}
                      </div>

                      <div className="flex flex-1 flex-col pt-3">
                        <h2 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug sm:text-base">
                          {producto.nombre}
                        </h2>

                        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                          {antes > 0 && (
                            <span className="text-sm text-neutral-500 line-through">
                              {usd(antes)}
                            </span>
                          )}
                          <span className="text-base font-bold sm:text-lg">
                            {usd(ahora)}
                          </span>
                        </div>

                        <span className="mt-3 block rounded-lg bg-[#ffd84d] py-2.5 text-center text-sm font-bold text-black group-hover:brightness-95">
                          Pedir ahora
                        </span>
                      </div>
                    </Link>
                  );
                })}
            </div>

            {/* Sin resultados */}
            {!loading && productos.length === 0 && (
              <div className="py-16 text-center text-neutral-500">
                <p className="mb-4">
                  {hayBusqueda
                    ? `No encontramos “${busqueda.trim()}”.`
                    : "Aún no hay productos publicados."}
                </p>
                {hayBusqueda && (
                  <button
                    onClick={() => setBusqueda("")}
                    className="rounded-lg border border-neutral-900 px-6 py-2.5 font-semibold text-neutral-900 hover:bg-neutral-900 hover:text-white"
                  >
                    Ver todo el catálogo
                  </button>
                )}
              </div>
            )}

            {/* Ver más (pide la siguiente página al servidor) */}
            {!loading && productos.length > 0 && (
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-sm text-neutral-600" aria-live="polite">
                  Viste {productos.length} productos
                </p>

                {nextCursor && (
                  <button
                    onClick={() => cargar(false, nextCursor)}
                    disabled={cargandoMas}
                    className="mt-2 rounded-lg border border-neutral-900 px-8 py-3 font-semibold text-neutral-900 hover:bg-neutral-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    {cargandoMas ? "Cargando..." : "Ver más productos"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}