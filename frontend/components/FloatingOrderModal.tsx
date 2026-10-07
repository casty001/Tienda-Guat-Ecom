"use client";

import { useState } from "react";
import Image from "next/image";

const datosPais = {
  nombre: "Ecuador",
  moneda: "USD",
  simbolo: "$",
  regiones: [
    "Azuay",
    "Bolívar",
    "Cañar",
    "Carchi",
    "Chimborazo",
    "Cotopaxi",
    "El Oro",
    "Esmeraldas",
    "Galápagos",
    "Guayas",
    "Imbabura",
    "Loja",
    "Los Ríos",
    "Manabí",
    "Morona Santiago",
    "Napo",
    "Orellana",
    "Pastaza",
    "Pichincha",
    "Santa Elena",
    "Santo Domingo de los Tsáchilas",
    "Sucumbíos",
    "Tungurahua",
    "Zamora Chinchipe",
  ],
  costoEnvioPrioritario: 1.9,
  envioGratisTexto: "Gratis",
};

export default function FloatingOrderModal({
  open,
  onClose,
  producto,
  onSubmit,
  enviando,
  errorBackend,
}: any) {
  const [envioPrioritario, setEnvioPrioritario] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<"1" | "2">("1");
  const [errores, setErrores] = useState<Record<string, string>>({});

  if (!open) return null;
  const colorModal = producto.plantilla?.tema?.colorModal || "#9333ea";
  const colorBoton = producto.plantilla?.tema?.colorPrimario || "#cb1515";

  // 👇 1. EXTRAER CONFIGURACIÓN Y TEXTOS DINÁMICOS DEL ADMIN
  const config =
    producto.disenoLanding === "moderno"
      ? producto.disenoModerno
      : producto.disenoClasico;

  const mostrarSubtituloModal = config?.mostrarSubtituloModal ?? true;
  const subtituloModal =
    config?.subtituloModal ??
    "Por alta demanda, este pedido se reserva por pocos minutos. Finaliza tu compra antes de que se agote.";

  const mostrarTextoImportanteModal =
    config?.mostrarTextoImportanteModal ?? true;
  const textoImportanteModal =
    config?.textoImportanteModal ??
    "⚡IMPORTANTE⚡\n📲Confirmar tu pedido por WPP para poder enviarle\n📍Si prefieres retirar en Servientrega, solicita por WPP";

  const oferta1Precio = Number(producto.precio || 0);
  const oferta1PrecioAntes = Number(producto.precioAntes || 0);
  const oferta2Activa = producto.precio2?.activo === true;
  const oferta2Precio = Number(producto.precio2?.precio || 0);
  const oferta2PrecioAntes = Number(producto.precio2?.precioAntes || 0);

  const precioBase = ofertaSeleccionada === "1" ? oferta1Precio : oferta2Precio;
  const costoEnvioExtra = envioPrioritario
    ? datosPais.costoEnvioPrioritario
    : 0;
  const precioTotal = precioBase + costoEnvioExtra;

  const formatearPrecio = (precio: number) => `$${precio.toFixed(2)}`;

  const limpiarError = (campo: string) => {
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const copia = { ...prev };
      delete copia[campo];
      return copia;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const nombre = String(formData.get("nombre") || "").trim();
    const telefono = String(formData.get("telefono") || "").trim();
    const direccion = String(formData.get("direccion") || "").trim();
    const referencia = String(formData.get("referencia") || "").trim();
    const departamento = String(formData.get("departamento") || "").trim();
    const ciudad = String(formData.get("ciudad") || "").trim();

    const nuevosErrores: Record<string, string> = {};

    if (!nombre || nombre.length < 3 || /\d/.test(nombre)) {
      nuevosErrores.nombre = "Escribe tu nombre completo";
    }

    if (!/^\d+$/.test(telefono)) {
      nuevosErrores.telefono = "Escribe solo números en tu teléfono";
    } else if (telefono.replace(/\D/g, "").length < 9) {
      nuevosErrores.telefono = "Revisa tu número de celular";
    }

    if (!direccion || direccion.length < 5) {
      nuevosErrores.direccion = "Agrega la dirección completa";
    }

    if (!referencia || referencia.length < 3) {
      nuevosErrores.referencia = "Cuéntanos una referencia para ubicarte";
    }

    if (!departamento) {
      nuevosErrores.departamento = "Selecciona tu provincia";
    }

    if (!ciudad || ciudad.length < 3 || /\d/.test(ciudad)) {
      nuevosErrores.ciudad = "Escribe el nombre de tu ciudad";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setErrores({});

    const datosExtras = {
      pais: "EC",
      ofertaSeleccionada: ofertaSeleccionada,
      ofertaTitulo:
        ofertaSeleccionada === "1"
          ? "1 Unidad + Regalo"
          : "2 Unidades + Regalo",
      cantidad: ofertaSeleccionada === "1" ? 1 : 2,
      precio: precioTotal,
      precioBase: precioBase,
      envioPrioritario: envioPrioritario,
      costoEnvio: costoEnvioExtra,
      moneda: "USD",
    };

    onSubmit(e, datosExtras);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-3">
      <div className="bg-white w-full max-w-md max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-gray-900">
              🇪🇨 OFERTA DE TIEMPO LIMITADO 🔥
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-600 hover:text-gray-900"
            type="button"
          >
            ×
          </button>
        </div>

        {/* 👇 2. ALERTA SUPERIOR CONDICIONAL */}
        {mostrarSubtituloModal && subtituloModal && (
          <div className="bg-red-50 p-3 text-center border-b border-red-100">
            <p className="text-red-600 font-bold text-xs md:text-sm leading-tight whitespace-pre-line">
              {subtituloModal}
            </p>
          </div>
        )}

        <div className="p-4">
          <div
            onClick={() => setOfertaSeleccionada("1")}
            className="border-2 rounded-xl p-3 flex gap-3 items-center mb-3 cursor-pointer transition-all"
            style={{
              borderColor:
                ofertaSeleccionada === "1" ? colorModal : "#e5e7eb",
              backgroundColor:
                ofertaSeleccionada === "1" ? `${colorModal}15` : "#ffffff",
            }}
            onMouseEnter={(e) => {
              if (ofertaSeleccionada !== "1") {
                (e.currentTarget as HTMLElement).style.borderColor = colorModal;
              }
            }}
            onMouseLeave={(e) => {
              if (ofertaSeleccionada !== "1") {
                (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
              }
            }}
          >
            {producto.imagen && (
              <Image
                src={producto.imagen}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-lg"
                alt="1 Unidad"
              />
            )}
            <div className="flex-1">
              <p className="font-bold text-gray-900">
                {producto.textoOferta1 || "1 Unidad + Regalo"}
              </p>
              <span
                className="text-white text-xs px-2 py-1 rounded"
                style={{ backgroundColor: colorModal }}
              >
                Precio Especial 🔥
              </span>
            </div>
            <div className="text-right">
              {oferta1PrecioAntes > 0 && (
                <div className="text-gray-400 line-through text-sm">
                  {formatearPrecio(oferta1PrecioAntes)}
                </div>
              )}
              <p className="font-bold text-gray-900">
                {formatearPrecio(oferta1Precio)}
              </p>
            </div>
          </div>

          {oferta2Activa && oferta2Precio > 0 && (
            <div
              onClick={() => setOfertaSeleccionada("2")}
              className="border-2 rounded-xl p-3 flex gap-3 items-center mb-4 cursor-pointer transition-all"
              style={{
                borderColor:
                  ofertaSeleccionada === "2" ? colorModal : "#e5e7eb",
                backgroundColor:
                  ofertaSeleccionada === "2" ? `${colorModal}15` : "#ffffff",
              }}
              onMouseEnter={(e) => {
                if (ofertaSeleccionada !== "2") {
                  (e.currentTarget as HTMLElement).style.borderColor = colorModal;
                }
              }}
              onMouseLeave={(e) => {
                if (ofertaSeleccionada !== "2") {
                  (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
                }
              }}
            >
              {(producto.precio2?.imagen || producto.imagen) && (
                <Image
                  src={producto.precio2?.imagen || producto.imagen}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg"
                  alt="2 Unidades"
                />
              )}
              <div className="flex-1">
                <p className="font-bold text-gray-900">
                  {producto.textoOferta2 || "2 Unidades + Regalo"}
                </p>
                <span
                  className="text-white text-xs px-2 py-1 rounded"
                  style={{ backgroundColor: colorModal }}
                >
                  🔥 Más Vendido
                </span>
              </div>
              <div className="text-right">
                {oferta2PrecioAntes > 0 && (
                  <div className="text-gray-400 line-through text-sm">
                    {formatearPrecio(oferta2PrecioAntes)}
                  </div>
                )}
                <p className="font-bold text-gray-900">
                  {formatearPrecio(oferta2Precio)}
                </p>
              </div>
            </div>
          )}

          <div className="border rounded-xl p-4 mb-4 bg-gray-50">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>{formatearPrecio(precioBase)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Envío</span>
              {envioPrioritario ? (
                <span
                  className="font-semibold"
                  style={{ color: colorModal }}
                >
                  + {formatearPrecio(datosPais.costoEnvioPrioritario)}{" "}
                  (Prioritario)
                </span>
              ) : (
                <span className="text-green-600">
                  {datosPais.envioGratisTexto}
                </span>
              )}
            </div>
            <div className="flex justify-between font-bold text-xl mt-2 pt-2 border-t">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">
                {formatearPrecio(precioTotal)}
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3"
            noValidate
          >
            <div>
              <label className="font-bold text-black mb-1 block">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                name="nombre"
                placeholder="Ej: Mateo Rodriguez Castaño"
                onChange={() => limpiarError("nombre")}
                className={`w-full p-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 ${
                  errores.nombre
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errores.nombre && (
                <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>
              )}
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                name="telefono"
                placeholder="0991234567"
                onChange={() => limpiarError("telefono")}
                className={`w-full p-3 border rounded-lg text-gray-900 ${
                  errores.telefono ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errores.telefono && (
                <p className="text-red-500 text-sm mt-1">{errores.telefono}</p>
              )}
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Dirección <span className="text-red-500">*</span>
              </label>
              <input
                name="direccion"
                placeholder="Calle principal con intersección y # de casa"
                onChange={() => limpiarError("direccion")}
                className={`w-full p-3 border rounded-lg text-gray-900 ${
                  errores.direccion ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errores.direccion && (
                <p className="text-red-500 text-sm mt-1">{errores.direccion}</p>
              )}
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Referencia <span className="text-red-500">*</span>
              </label>
              <input
                name="referencia"
                placeholder="Ej: Torre B, Apto 201"
                onChange={() => limpiarError("referencia")}
                className={`w-full p-3 border rounded-lg text-gray-900 ${
                  errores.referencia ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errores.referencia && (
                <p className="text-red-500 text-sm mt-1">
                  {errores.referencia}
                </p>
              )}
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Provincia <span className="text-red-500">*</span>
              </label>
              <select
                name="departamento"
                onChange={() => limpiarError("departamento")}
                className={`w-full p-3 border rounded-lg text-gray-900 ${
                  errores.departamento ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Selecciona una provincia</option>
                {datosPais.regiones.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              {errores.departamento && (
                <p className="text-red-500 text-sm mt-1">
                  {errores.departamento}
                </p>
              )}
            </div>

            <div>
              <label className="font-bold text-black mb-1 block">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <input
                name="ciudad"
                placeholder="Ej: Quito"
                onChange={() => limpiarError("ciudad")}
                className={`w-full p-3 border rounded-lg text-gray-900 ${
                  errores.ciudad ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errores.ciudad && (
                <p className="text-red-500 text-sm mt-1">{errores.ciudad}</p>
              )}
            </div>

            {/* 👇 3. BLOQUE NOTA IMPORTANTE CONDICIONAL */}
            {mostrarTextoImportanteModal && textoImportanteModal && (
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-center my-1">
                <p className="text-sky-900 font-bold text-xs md:text-sm whitespace-pre-line leading-relaxed">
                  {textoImportanteModal}
                </p>
              </div>
            )}

            <div
              className="rounded-lg p-3 mb-4"
              style={{
                border: `1px solid ${colorModal}`,
                backgroundColor: `${colorModal}15`,
                backgroundImage: `linear-gradient(90deg, ${colorModal} 50%, transparent 50%), linear-gradient(90deg, ${colorModal} 50%, transparent 50%), linear-gradient(0deg, ${colorModal} 50%, transparent 50%), linear-gradient(0deg, ${colorModal} 50%, transparent 50%)`,
                backgroundRepeat: "repeat-x, repeat-x, repeat-y, repeat-y",
                backgroundSize: "13px 2px, 13px 2px, 2px 13px, 2px 13px",
                backgroundPosition:
                  "left top, right bottom, left bottom, right top",
                animation: "rsiTickUpsBorder 0.3s linear infinite",
              }}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="prioritario"
                  checked={envioPrioritario}
                  onChange={(e) => setEnvioPrioritario(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex flex-col">
                  <span className="text-black">
                    Agrega <b>ENVÍO PRIORITARIO + GARANTÍA EXTENDIDA</b> por
                    solo{" "}
                    <b>{formatearPrecio(datosPais.costoEnvioPrioritario)}</b>
                  </span>
                  <span className="text-gray-600 text-sm">
                    Si activas envío prioritario tu orden estará en primera fila
                  </span>
                </div>
              </label>
            </div>
            {errorBackend && (
              <p className="text-red-600 text-sm font-semibold text-center -mt-1">
                {errorBackend}
              </p>
            )}
<button
  type="submit"
  disabled={enviando}
  data-fbq-ignore="true"
  className="text-white p-4 rounded-lg font-bold disabled:opacity-50 transition-colors"
  style={{ backgroundColor: colorBoton }}
>
  {enviando
    ? "Enviando pedido..."
    : `COMPLETA TU COMPRA - ${formatearPrecio(precioTotal)}`}
</button>
          </form>
        </div>
      </div>
    </div>
  );
}