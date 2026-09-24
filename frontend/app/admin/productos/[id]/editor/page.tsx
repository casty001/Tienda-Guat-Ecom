"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { revalidarProducto } from "@/lib/actions"; // 👈 nuevo import
import AdminGuard from "@/components/AdminGuard";
import {
  BLOQUES,
  SECCIONES,
  NAV_DEFAULT, // 👈 AÑADIR
  construirPlantilla,
  type BloqueDef,
  type Seccion,
  type TipoSeccion,
} from "@/lib/bloques";
import { useEditor } from "@/lib/editor-store";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDndContext, // 👈 NUEVO
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ═══════════════════════════════════════════════════════════════
// INPUT IMAGEN
// ═══════════════════════════════════════════════════════════════
function InputImagen({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function subirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/upload/imagen", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(res.data.url);
    } catch (err) {
      console.error(err);
      alert("❌ Error subiendo imagen");
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <span className="text-gray-400 text-xs block font-medium">{label}</span>
      )}
      {value ? (
        <div className="rounded-lg overflow-hidden border border-gray-600 bg-gray-900">
          <img
            src={value}
            alt="preview"
            className="w-full h-40 object-contain"
          />
        </div>
      ) : (
        <div className="w-full h-40 rounded-lg border border-dashed border-gray-600 bg-gray-900 flex items-center justify-center">
          <span className="text-gray-500 text-xs">Sin imagen</span>
        </div>
      )}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={subirArchivo}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-medium"
        >
          {subiendo ? "⏳ Subiendo..." : "📤 Subir archivo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded text-xs"
          >
            🗑️
          </button>
        )}
      </div>
      <details>
        <summary className="cursor-pointer text-[10px] text-gray-500 hover:text-gray-400">
          o pega una URL
        </summary>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://res.cloudinary.com/..."
          className="mt-1 w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
        />
      </details>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EDITOR DE REPEATER
// ═══════════════════════════════════════════════════════════════
const REPEATER_CAMPOS: Record<
  string,
  {
    key: string;
    label: string;
    tipo: "text" | "textarea" | "number" | "toggle" | "subrepeater";
    subKey?: string;
    labelItem?: string;
  }[]
> = {
  prueba_social: [
    { key: "titulo", label: "Título", tipo: "text" },
    { key: "descripcion", label: "Descripción", tipo: "text" },
  ],
  faqs: [
    { key: "pregunta", label: "Pregunta", tipo: "text" },
    { key: "respuesta", label: "Respuesta", tipo: "textarea" },
  ],
resenas: [
  { key: "estrellas", label: "Estrellas (1-5)", tipo: "number" },
  { key: "titulo", label: "Título de la reseña", tipo: "text" },
  { key: "texto", label: "Texto de la reseña", tipo: "textarea" },
  { key: "fecha", label: "Fecha (ej: Hace 3 días)", tipo: "text" },
],
  // 👇 NUEVO: campos para el repeater de distribución
resenas_distribucion: [
  { key: "estrellas", label: "Estrellas (5, 4, 3, 2, 1)", tipo: "number" },
  { key: "cantidad", label: "Cantidad de reseñas", tipo: "number" },
],

// 👇 NUEVO: campos para el repeater de reseñas individuales
resenas_items: [
  { key: "estrellas", label: "Estrellas (1-5)", tipo: "number" },
  { key: "titulo", label: "Título de la reseña", tipo: "text" },
  { key: "texto", label: "Texto de la reseña", tipo: "textarea" },
  { key: "fecha", label: "Fecha (ej: Hace 3 días)", tipo: "text" },
],
  selector_unidades: [
  { key: "titulo", label: "Título", tipo: "text" },
  { key: "items", label: "Items (1 item / 2 items)", tipo: "text" },
  { key: "precio", label: "Precio", tipo: "number" },
  { key: "precioAntes", label: "Precio antes (tachado)", tipo: "number" },
  { key: "badge", label: "Badge (MEJOR OFERTA)", tipo: "text" },
  { key: "envioGratis", label: "Envío gratis", tipo: "toggle" },
  {
    key: "beneficios",
    label: "Beneficios",
    tipo: "subrepeater",
    subKey: "texto",
    labelItem: "Beneficio",
  },
],
// 👇 NUEVO
  beneficios_numerados: [
    { key: "icono", label: "Emoji/Icono", tipo: "text" },
    { key: "titulo", label: "Título", tipo: "text" },
    { key: "descripcion", label: "Descripción", tipo: "textarea" },
  ],
 // 👇 NUEVO
  tabla_comparativa: [
    { key: "texto", label: "Texto de la fila", tipo: "text" },
  ],
};


const REPEATER_PROP_KEY: Record<string, string> = {
  prueba_social: "beneficios",
  faqs: "items",
  resenas: "items",
  selector_unidades: "opciones",
    beneficios_numerados: "beneficios",   // 👈 AÑADIR
      tabla_comparativa: "filas",   // 👈 AÑADIR


};
// ═══════════════════════════════════════════════════════════════
// SUB-REPEATER — lista de strings dentro de un repeater
// ═══════════════════════════════════════════════════════════════
function EditorSubRepeater({
  items,
  campoKey,
  labelItem,
  onChange,
}: {
  items: any[];
  campoKey: string;
  labelItem: string;
  onChange: (nuevos: any[]) => void;
}) {
  const lista = Array.isArray(items) ? items : [];

  function actualizar(index: number, valor: string) {
    const copia = [...lista];
    copia[index] = { ...copia[index], [campoKey]: valor };
    onChange(copia);
  }
  function eliminar(index: number) {
    onChange(lista.filter((_, i) => i !== index));
  }
  function agregar() {
    onChange([...lista, { [campoKey]: "" }]);
  }
  function mover(index: number, dir: -1 | 1) {
    const nuevo = index + dir;
    if (nuevo < 0 || nuevo >= lista.length) return;
    const copia = [...lista];
    [copia[index], copia[nuevo]] = [copia[nuevo], copia[index]];
    onChange(copia);
  }

  return (
    <div className="space-y-1.5 bg-gray-950/50 rounded p-2 border border-gray-700">
      {lista.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <input
            type="text"
            value={item[campoKey] || ""}
            onChange={(e) => actualizar(i, e.target.value)}
            placeholder={labelItem}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
          />
          <button
            type="button"
            onClick={() => mover(i, -1)}
            disabled={i === 0}
            className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded text-xs"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => mover(i, 1)}
            disabled={i === lista.length - 1}
            className="px-1.5 py-0.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded text-xs"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => eliminar(i)}
            className="px-1.5 py-0.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded text-xs"
          >
            🗑
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={agregar}
        className="w-full py-1 border border-dashed border-gray-600 hover:border-blue-500 rounded text-[10px] text-gray-400 hover:text-white"
      >
        ➕ Añadir {labelItem.toLowerCase()}
      </button>
    </div>
  );
}
function EditorRepeater({
  items,
  campos,
  onChange,
}: {
  items: any[];
  campos: {
    key: string;
    label: string;
    tipo: "text" | "textarea" | "number" | "toggle" | "subrepeater";
    subKey?: string;
    labelItem?: string;
  }[];
  onChange: (nuevos: any[]) => void;
}) {
  const lista = Array.isArray(items) ? items : [];

  function actualizarItem(index: number, campo: string, valor: any) {
    const copia = [...lista];
    copia[index] = { ...copia[index], [campo]: valor };
    onChange(copia);
  }
  function eliminarItem(index: number) {
    if (!confirm("¿Eliminar este elemento?")) return;
    onChange(lista.filter((_, i) => i !== index));
  }
  function agregarItem() {
    const vacio: any = {};
    campos.forEach((c) => {
      vacio[c.key] = c.tipo === "number" ? 5 : "";
    });
    onChange([...lista, vacio]);
  }
  function mover(index: number, dir: -1 | 1) {
    const nuevo = index + dir;
    if (nuevo < 0 || nuevo >= lista.length) return;
    const copia = [...lista];
    [copia[index], copia[nuevo]] = [copia[nuevo], copia[index]];
    onChange(copia);
  }

  return (
    <div className="space-y-3">
      {lista.map((item, i) => (
        <div
          key={i}
          className="border border-gray-700 rounded-lg p-3 space-y-2 bg-gray-900/50"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-semibold">
              #{i + 1}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => mover(i, -1)}
                disabled={i === 0}
                className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded text-xs"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => mover(i, 1)}
                disabled={i === lista.length - 1}
                className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded text-xs"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => eliminarItem(i)}
                className="px-2 py-0.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded text-xs"
              >
                🗑
              </button>
            </div>
          </div>
          {campos.map((c) => (
            <label key={c.key} className="block">
              <span className="text-gray-500 text-[10px] block mb-0.5">
                {c.label}
              </span>
              {c.tipo === "textarea" ? (
                <textarea
                  value={item[c.key] || ""}
                  onChange={(e) => actualizarItem(i, c.key, e.target.value)}
                  rows={2}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                />
              ) : c.tipo === "toggle" ? (
                <input
                  type="checkbox"
                  checked={!!item[c.key]}
                  onChange={(e) => actualizarItem(i, c.key, e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
              ) : c.tipo === "subrepeater" ? (
                <EditorSubRepeater
                  items={item[c.key]}
                  campoKey={c.subKey || "texto"}
                  labelItem={c.labelItem || "Elemento"}
                  onChange={(nuevos) => actualizarItem(i, c.key, nuevos)}
                />
              ) : (
                <input
                  type={c.tipo === "number" ? "number" : "text"}
                  value={item[c.key] ?? ""}
                  onChange={(e) =>
                    actualizarItem(
                      i,
                      c.key,
                      c.tipo === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                />
              )}
            </label>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={agregarItem}
        className="w-full py-2 border border-dashed border-gray-600 hover:border-blue-500 rounded text-xs text-gray-400 hover:text-white"
      >
        ➕ Añadir elemento
      </button>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
// SLIDER
// ═══════════════════════════════════════════════════════════════
function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "px",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-blue-500"
      />
      <div className="flex items-center gap-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 min-w-[64px]">
        <input
          type="number"
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-10 bg-transparent text-white text-xs focus:outline-none"
        />
        <span className="text-gray-400 text-[10px]">{unit}</span>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
// INPUT PROP
// ═══════════════════════════════════════════════════════════════
function InputProp({ prop, value, onChange, onSnapshot }: any) {
  const base =
    "w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500";
  const cp = { onFocus: onSnapshot };

  if (prop.tipo === "imagen") {
    return (
      <InputImagen
        value={value || ""}
        onChange={(v) => {
          onSnapshot?.();
          onChange(v);
        }}
      />
    );
  }
  if (prop.tipo === "toggle") {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => {
          onSnapshot?.();
          onChange(e.target.checked);
        }}
        className="w-5 h-5 accent-blue-500"
      />
    );
  }
if (prop.tipo === "color") {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#000000"}
        onFocus={onSnapshot}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-14 rounded border border-gray-600 bg-gray-700 cursor-pointer"
      />
      <span className="text-gray-400 text-xs">{value || "#000000"}</span>
    </div>
  );
}
  if (prop.tipo === "number") {
    return (
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className={base}
        {...cp}
      />
    );
  }
  if (prop.tipo === "textarea") {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={base}
        {...cp}
      />
    );
  }
  if (prop.tipo === "select" && prop.options) {
    return (
      <select
        value={value || prop.options[0]}
        onChange={(e) => {
          onSnapshot?.();
          onChange(e.target.value);
        }}
        className={base}
      >
        {prop.options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={base}
      {...cp}
    />
  );
}
// ═══════════════════════════════════════════════════════════════
// GRUPO DE AJUSTES
// ═══════════════════════════════════════════════════════════════
function Grupo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 pt-3 border-t border-gray-700 first:border-t-0 first:pt-0">
      <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
        {titulo}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BOTÓN DUAL
// ═══════════════════════════════════════════════════════════════
function BotonDual({
  value,
  onChange,
  opciones,
}: {
  value: string;
  onChange: (v: string) => void;
  opciones: { valor: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
      {opciones.map((op) => (
        <button
          key={op.valor}
          type="button"
          onClick={() => onChange(op.valor)}
          className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            value === op.valor
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
// ITEM BLOQUE (arrastrable dentro de sección)
// ═══════════════════════════════════════════════════════════════
function ItemBloque({
  bloque,
  def,
  seleccionado,
  onSelect,
}: {
  bloque: any;
  def: BloqueDef;
  seleccionado: boolean;
  onSelect: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bloque.id });
  const eliminar = useEditor((s) => s.eliminarBloque);
  const duplicar = useEditor((s) => s.duplicarBloque);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer text-xs transition-colors ${
        seleccionado
          ? "border-blue-500 bg-blue-950"
          : "border-gray-700 bg-gray-800 hover:border-gray-500"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab text-gray-500 hover:text-white select-none text-xs"
      >
        ⠿
      </button>
      <span className="flex-1 text-white truncate">
        {def.icono} {def.nombre}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          duplicar(bloque.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
        title="Duplicar"
      >
        ⧉
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("¿Eliminar este bloque?")) eliminar(bloque.id);
        }}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
        title="Eliminar"
      >
        🗑
      </button>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
// BOTÓN + AGREGAR SECCIÓN
// ═══════════════════════════════════════════════════════════════
function AgregarSeccionDropdown() {
  const [abierto, setAbierto] = useState(false);
  const agregarSeccion = useEditor((s) => s.agregarSeccion);

  const tiposDisponibles = [
    { tipo: "producto", label: "Producto", icono: "🎯" },
    { tipo: "compra", label: "Compra", icono: "💰" },
    { tipo: "testimonios", label: "Testimonios", icono: "⭐" },
    { tipo: "faq", label: "Preguntas", icono: "❓" },
    { tipo: "custom", label: "Sección libre", icono: "📄" },
  ] as const;

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        ＋ Agregar sección
      </button>

      {abierto && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
            {tiposDisponibles.map((t) => (
              <button
                key={t.tipo}
                onClick={() => {
                  agregarSeccion(t.tipo);
                  setAbierto(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-white hover:bg-gray-700 flex items-center gap-2"
              >
                <span className="text-base">{t.icono}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════
// SECCIÓN COLAPSABLE EN SIDEBAR
// ═══════════════════════════════════════════════════════════════
function SeccionSidebar({
  seccion,
  seleccionado,
  onSelectBloque,
  onSelectSeccion,
  seccionSeleccionada,
}: {
  seccion: Seccion;
  seleccionado: string | null;
  onSelectBloque: (id: string) => void;
  onSelectSeccion: () => void;
  seccionSeleccionada: string | null;
}) {
  const [abierta, setAbierta] = useState(true);
  const [agregando, setAgregando] = useState(false);
  const [renombrando, setRenombrando] = useState(false);
  const [nombreTemp, setNombreTemp] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cancelarRenameRef = useRef(false); // 👈 NUEVO

  const agregarBloque = useEditor((s) => s.agregarBloque);
  const renombrarSeccion = useEditor((s) => s.renombrarSeccion);
  const toggleVisible = useEditor((s) => s.toggleVisibleSeccion);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `seccion-${seccion.id}` });
  const { over } = useDndContext();
  const isOver = over?.id === `seccion-${seccion.id}` && !isDragging;

  // 👇 GUARD: si el tipo de sección no existe en TIPOS_SECCION, no renderizar
  const def = SECCIONES[seccion.tipo];
  if (!def) return null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isOver ? undefined : "#1a1d22",
      }}
      className={`rounded-lg border transition-colors ${
        isOver
          ? "border-blue-500 bg-blue-950/30"
          : "border-gray-700 bg-gray-850"
      } ${!seccion.visible ? "opacity-50" : ""} ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        {/* Handle de drag */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab text-gray-500 hover:text-white select-none text-xs"
          title="Arrastrar para reordenar"
        >
          ⠿
        </button>
        <button
          onClick={() => setAbierta((v) => !v)}
          className="text-gray-400 hover:text-white text-xs w-4"
        >
          {abierta ? "▼" : "▶"}
        </button>

        {renombrando ? (
          <input
            autoFocus
            value={nombreTemp}
            onChange={(e) => setNombreTemp(e.target.value)}
            onBlur={() => {
              // Si el usuario presionó Escape, no guardar
              if (cancelarRenameRef.current) {
                cancelarRenameRef.current = false;
                setRenombrando(false);
                return;
              }
              if (nombreTemp.trim())
                renombrarSeccion(seccion.id, nombreTemp.trim());
              setRenombrando(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (nombreTemp.trim())
                  renombrarSeccion(seccion.id, nombreTemp.trim());
                setRenombrando(false);
              }
              if (e.key === "Escape") {
                cancelarRenameRef.current = true; // 👈 flag
                setRenombrando(false);
              }
            }}
            className="flex-1 text-xs bg-gray-700 border border-blue-500 rounded px-1.5 py-0.5 text-white focus:outline-none"
          />
        ) : (
          <button
            onClick={onSelectSeccion}
            onDoubleClick={() => {
              setNombreTemp(seccion.nombre);
              setRenombrando(true);
            }}
            className={`text-xs font-semibold flex-1 truncate text-left ${
              seccionSeleccionada === seccion.id
                ? "text-blue-400"
                : "text-white hover:text-blue-300"
            }`}
            title="Doble click para renombrar"
          >
            {def.icono} {seccion.nombre}
          </button>
        )}

        {/* Menú ⋯ */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuAbierto((v) => !v);
            }}
            className="text-gray-400 hover:text-white text-xs px-1"
            title="Opciones"
          >
            ⋯
          </button>

          {menuAbierto && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuAbierto(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 w-40">
                <button
                  onClick={() => {
                    setNombreTemp(seccion.nombre);
                    setRenombrando(true);
                    setMenuAbierto(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-gray-700"
                >
                  ✏️ Renombrar
                </button>
                <button
                  onClick={() => {
                    useEditor.getState().duplicarSeccion(seccion.id);
                    setMenuAbierto(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-gray-700"
                >
                  ⧉ Duplicar
                </button>
                <button
                  onClick={() => {
                    const secciones =
                      useEditor.getState().plantilla.secciones || [];
                    const idx = secciones.findIndex((s) => s.id === seccion.id);
                    if (idx > 0)
                      useEditor.getState().moverSeccion(idx, idx - 1);
                    setMenuAbierto(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-gray-700"
                >
                  ↑ Mover arriba
                </button>
                <button
                  onClick={() => {
                    const secciones =
                      useEditor.getState().plantilla.secciones || [];
                    const idx = secciones.findIndex((s) => s.id === seccion.id);
                    if (idx >= 0 && idx < secciones.length - 1)
                      useEditor.getState().moverSeccion(idx, idx + 1);
                    setMenuAbierto(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-white hover:bg-gray-700"
                >
                  ↓ Mover abajo
                </button>
                {!def.fija && (
                  <>
                    <div className="border-t border-gray-700 my-1" />
                    <button
                      onClick={() => {
                        useEditor.getState().eliminarSeccion(seccion.id);
                        setMenuAbierto(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-gray-700"
                    >
                      🗑 Eliminar
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => toggleVisible(seccion.id)}
          className={`text-xs ${
            seccion.visible
              ? "text-gray-400 hover:text-white"
              : "text-yellow-500"
          }`}
          title={seccion.visible ? "Ocultar sección" : "Mostrar sección"}
        >
          {seccion.visible ? "👁" : "🚫"}
        </button>
      </div>

      {abierta && (
        <div className="px-2 pb-2 space-y-1.5">
          <SortableContext
            items={seccion.bloques.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {seccion.bloques.map((b) => {
              const bdef = BLOQUES[b.tipo];
              if (!bdef) return null;
              return (
                <ItemBloque
                  key={b.id}
                  bloque={b}
                  def={bdef}
                  seleccionado={seleccionado === b.id}
                  onSelect={() => onSelectBloque(b.id)}
                />
              );
            })}
          </SortableContext>

          {seccion.bloques.length === 0 && (
            <p className="text-gray-600 text-[10px] italic px-2 py-1">
              Sin bloques
            </p>
          )}

          {!agregando ? (
            <button
              onClick={() => setAgregando(true)}
              className="w-full text-left px-2 py-1 text-[10px] text-blue-400 hover:text-blue-300"
            >
              ＋ Añadir bloque
            </button>
          ) : (
            <div className="border border-gray-700 rounded p-2 space-y-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-[10px]">
                  Añadir a {def.nombre}
                </span>
                <button
                  onClick={() => setAgregando(false)}
                  className="text-gray-500 hover:text-white text-[10px]"
                >
                  ✕
                </button>
              </div>
<div className="grid grid-cols-1 gap-1">
  {(() => {
    // Si bloquesPermitidos está vacío → mostrar TODOS los bloques
    const tiposDisponibles =
      def.bloquesPermitidos && def.bloquesPermitidos.length > 0
        ? def.bloquesPermitidos
        : Object.keys(BLOQUES);

    // Filtrar los que ya alcanzaron su máximo en esta sección
    const tiposFiltrados = tiposDisponibles.filter((tipo) => {
      const bdef = BLOQUES[tipo];
      if (!bdef) return false;
      if (bdef.max > 0) {
        const cuenta = seccion.bloques.filter(
          (b) => b.tipo === tipo,
        ).length;
        if (cuenta >= bdef.max) return false;
      }
      return true;
    });

    if (tiposFiltrados.length === 0) {
      return (
        <p className="text-[10px] text-gray-500 italic px-2 py-1">
          No hay más bloques disponibles
        </p>
      );
    }

    return tiposFiltrados.map((tipo) => {
      const bdef = BLOQUES[tipo];
      return (
        <button
          key={tipo}
          onClick={() => {
            agregarBloque(tipo, seccion.id);
            setAgregando(false);
          }}
          className="text-left px-2 py-1 text-[10px] text-white bg-gray-800 hover:bg-gray-700 rounded border border-gray-700"
        >
          {bdef.icono} {bdef.nombre}
        </button>
      );
    });
  })()}
</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PÁGINA
// ═══════════════════════════════════════════════════════════════
export default function EditorPage() {
  const { id } = useParams<{ id: string }>();

  const {
    plantilla,
    seleccionado,
    seleccionar,
    cargar,
    actualizarProps,
    actualizarEstilosBloque, // 👈 NUEVO
    actualizarTema,
    actualizarAjustesSeccion,
    moverBloqueDentroSeccion,
    moverBloqueEntreSecciones,
    moverSeccion, // 👈 NUEVO

    undo,
    redo,
    hayCambios,
    puedeUndo,
    puedeRedo,
    marcarGuardado,
  } = useEditor();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [producto, setProducto] = useState<any>(null);
  const [previewListo, setPreviewListo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [verComoCliente, setVerComoCliente] = useState(false);
  const [tab, setTab] = useState<"producto" | "landing">("landing");
  const [tabInterna, setTabInterna] = useState<"contenido" | "estilo">(
    "contenido",
  );
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<string | null>(
    null,
  );

  const [bloqueHoverId, setBloqueHoverId] = useState<string | null>(null);

  // Panel Producto (mismo de antes)
  const [pNombre, setPNombre] = useState("");
  const [pPrecio, setPPrecio] = useState<number>(0);
  const [pPrecioAntes, setPPrecioAntes] = useState<number>(0);
  const [pImagen, setPImagen] = useState("");
  const [pPrecio2Activo, setPPrecio2Activo] = useState(false);
  const [pPrecio2, setPPrecio2] = useState<number>(0);
  const [pPrecio2Antes, setPPrecio2Antes] = useState<number>(0);
  const [pTextoOferta1, setPTextoOferta1] = useState("1 Unidad + Regalo");
  const [pTextoOferta2, setPTextoOferta2] = useState("2 Unidades + Regalo");
  const [pModalMostrarSub, setPModalMostrarSub] = useState(true);
  const [pModalSub, setPModalSub] = useState("");
  const [pModalMostrarImp, setPModalMostrarImp] = useState(true);
  const [pModalImp, setPModalImp] = useState("");
  const [pMostrarResenas, setPMostrarResenas] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Cargar producto
  useEffect(() => {
    if (!id) return;
    api
      .get(`/productos/${id}`)
      .then((res) => {
        const p = res.data;
        setProducto(p);
        cargar(p.plantilla || construirPlantilla(p));
        marcarGuardado();
        setDirty(false);

        setPNombre(p.nombre || "");
        setPPrecio(p.precio || 0);
        setPPrecioAntes(p.precioAntes || 0);
        setPImagen(p.imagen || "");
        setPPrecio2Activo(p.precio2?.activo || false);
        setPPrecio2(p.precio2?.precio || 0);
        setPPrecio2Antes(p.precio2?.precioAntes || 0);
        setPTextoOferta1(p.textoOferta1 || "1 Unidad + Regalo");
        setPTextoOferta2(p.textoOferta2 || "2 Unidades + Regalo");
        setPModalMostrarSub(p.modal?.mostrarSubtitulo ?? true);
        setPModalSub(p.modal?.subtitulo || "");
        setPModalMostrarImp(p.modal?.mostrarTextoImportante ?? true);
        setPModalImp(p.modal?.textoImportante || "");
        setPMostrarResenas(p.mostrarResenas ?? true);
      })
      .catch((err) => {
        console.error(err);
        alert("Error cargando producto");
      });
  }, [id, cargar, marcarGuardado]);

  // Listener iframe
  // Listener iframe
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;

      if (e.data?.type === "PREVIEW_READY") {
        setPreviewListo(true);
      }

      if (e.data?.type === "BLOQUE_HOVER") {
        setBloqueHoverId(e.data.id);
      }

      if (e.data?.type === "BLOQUE_LEAVE") {
        setBloqueHoverId(null);
      }

      if (e.data?.type === "BLOQUE_SELECT") {
        seleccionar(e.data.id);
        setSeccionSeleccionada(null);
      }

      if (e.data?.type === "BLOQUE_DUPLICAR") {
        useEditor.getState().duplicarBloque(e.data.id);
      }

      if (e.data?.type === "BLOQUE_OCULTAR") {
        if (confirm("¿Ocultar este bloque?")) {
          useEditor.getState().actualizarProps(e.data.id, { _oculto: true });
        }
      }

      if (e.data?.type === "BLOQUE_ELIMINAR") {
        if (confirm("¿Eliminar este bloque?")) {
          useEditor.getState().eliminarBloque(e.data.id);
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [seleccionar]);

  // Push al iframe
  useEffect(() => {
    if (!previewListo || !iframeRef.current?.contentWindow || !producto) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "PREVIEW_UPDATE",
        producto: {
          ...producto,
          nombre: pNombre,
          precio: pPrecio,
          precioAntes: pPrecioAntes,
          imagen: pImagen,
          precio2: {
            activo: pPrecio2Activo,
            precio: pPrecio2,
            precioAntes: pPrecio2Antes,
          },
          textoOferta1: pTextoOferta1,
          textoOferta2: pTextoOferta2,
          mostrarResenas: pMostrarResenas,
          plantilla,
        },
        bloqueHover: bloqueHoverId, // 👈 NUEVO
        seleccionado: seleccionado, // 👈 NUEVO
      },
      window.location.origin,
    );
  }, [
    plantilla,
    producto,
    previewListo,
    pNombre,
    pPrecio,
    pPrecioAntes,
    pImagen,
    pPrecio2Activo,
    pPrecio2,
    pPrecio2Antes,
    pTextoOferta1,
    pTextoOferta2,
    pMostrarResenas,
    bloqueHoverId, // 👈 NUEVO
    seleccionado, // 👈 NUEVO
  ]);

  // Dirty
  useEffect(() => {
    if (!producto) return;
    const cambiosProducto =
      pNombre !== (producto.nombre || "") ||
      pPrecio !== (producto.precio || 0) ||
      pPrecioAntes !== (producto.precioAntes || 0) ||
      pImagen !== (producto.imagen || "") ||
      pPrecio2Activo !== (producto.precio2?.activo || false) ||
      pPrecio2 !== (producto.precio2?.precio || 0) ||
      pPrecio2Antes !== (producto.precio2?.precioAntes || 0) ||
      pTextoOferta1 !== (producto.textoOferta1 || "1 Unidad + Regalo") ||
      pTextoOferta2 !== (producto.textoOferta2 || "2 Unidades + Regalo") ||
      pModalMostrarSub !== (producto.modal?.mostrarSubtitulo ?? true) ||
      pModalSub !== (producto.modal?.subtitulo || "") ||
      pModalMostrarImp !== (producto.modal?.mostrarTextoImportante ?? true) ||
      pModalImp !== (producto.modal?.textoImportante || "") ||
      pMostrarResenas !== (producto.mostrarResenas ?? true);

    setDirty(hayCambios() || cambiosProducto);
  }, [
    plantilla,
    hayCambios,
    producto,
    pNombre,
    pPrecio,
    pPrecioAntes,
    pImagen,
    pPrecio2Activo,
    pPrecio2,
    pPrecio2Antes,
    pTextoOferta1,
    pTextoOferta2,
    pModalMostrarSub,
    pModalSub,
    pModalMostrarImp,
    pModalImp,
    pMostrarResenas,
  ]);

  // Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Guardar
  async function guardar() {
    if (!producto) return;
    setGuardando(true);
    try {
      await api.patch(`/productos/${producto.id}`, {
        nombre: pNombre,
        precio: pPrecio,
        precioAntes: pPrecioAntes,
        imagen: pImagen,
        precio2: {
          activo: pPrecio2Activo,
          precio: pPrecio2,
          precioAntes: pPrecio2Antes,
        },
        textoOferta1: pTextoOferta1,
        textoOferta2: pTextoOferta2,
        mostrarResenas: pMostrarResenas,
        plantilla,
        version: 3,
      });
          await revalidarProducto(producto.id); // 👈 acá

      marcarGuardado();
      setDirty(false);
      alert("✅ Guardado");
    } catch (err) {
      console.error(err);
      alert("❌ Error guardando");
    } finally {
      setGuardando(false);
    }
  }

  // Drag end
  // Drag end
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 👇 Caso 1: mover SECCIÓN
    if (activeId.startsWith("seccion-") && overId.startsWith("seccion-")) {
      const secciones = plantilla.secciones || [];
      const from = secciones.findIndex((s) => `seccion-${s.id}` === activeId);
      const to = secciones.findIndex((s) => `seccion-${s.id}` === overId);
      if (from >= 0 && to >= 0) {
        moverSeccion(from, to);
      }
      return;
    }

    // 👇 Caso 2: mover BLOQUE
    const secciones = plantilla.secciones || [];
    let deSeccion: Seccion | null = null;
    let deIndex = -1;
    for (const s of secciones) {
      const idx = s.bloques.findIndex((b) => b.id === activeId);
      if (idx >= 0) {
        deSeccion = s;
        deIndex = idx;
        break;
      }
    }
    if (!deSeccion) return;

    // ¿El over es una sección (drop zone) o un bloque?
    if (overId.startsWith("seccion-")) {
      const aSeccionId = overId.replace("seccion-", "");
      if (aSeccionId === deSeccion.id) return;
      const aSeccion = secciones.find((s) => s.id === aSeccionId);
      if (!aSeccion) return;
      moverBloqueEntreSecciones(
        activeId,
        deSeccion.id,
        aSeccionId,
        aSeccion.bloques.length,
      );
      return;
    }

    // Over es un bloque
    let aSeccion: Seccion | null = null;
    let aIndex = -1;
    for (const s of secciones) {
      const idx = s.bloques.findIndex((b) => b.id === overId);
      if (idx >= 0) {
        aSeccion = s;
        aIndex = idx;
        break;
      }
    }
    if (!aSeccion) return;

    if (aSeccion.id === deSeccion.id) {
      moverBloqueDentroSeccion(deSeccion.id, deIndex, aIndex);
    } else {
      moverBloqueEntreSecciones(activeId, deSeccion.id, aSeccion.id, aIndex);
    }
  }

  const secciones = plantilla.secciones || [];
  const bloqueActual = secciones
    .flatMap((s) => s.bloques)
    .find((b) => b.id === seleccionado);
  const defActual: BloqueDef | undefined = bloqueActual
    ? BLOQUES[bloqueActual.tipo]
    : undefined;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* TOPBAR */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/productos"
              className="text-gray-400 hover:text-white text-sm"
            >
              ← Volver
            </Link>
            <h1 className="text-white font-bold">
              🎨 {pNombre || "Cargando..."}
            </h1>
            {dirty && (
              <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-0.5 rounded">
                Sin guardar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVerComoCliente((v) => !v)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                verComoCliente
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
              }`}
            >
              {verComoCliente ? "✏️ Editando" : "👁️ Ver como cliente"}
            </button>
            <button
              onClick={undo}
              disabled={!puedeUndo()}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded text-sm"
              title="Ctrl+Z"
            >
              ↶
            </button>
            <button
              onClick={redo}
              disabled={!puedeRedo()}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 text-white rounded text-sm"
              title="Ctrl+Shift+Z"
            >
              ↷
            </button>
            <button
              onClick={guardar}
              disabled={guardando || !dirty}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm font-semibold"
            >
              {guardando ? "Guardando..." : "💾 Guardar"}
            </button>
          </div>
        </header>

        {/* PANELES */}
        <div
          className={`flex-1 grid overflow-hidden transition-all duration-200 ${
            verComoCliente ? "grid-cols-[1fr]" : "grid-cols-[300px_1fr_340px]"
          }`}
        >
          {/* SIDEBAR IZQ */}
          {!verComoCliente && (
            <aside className="bg-gray-800 border-r border-gray-700 overflow-y-auto flex flex-col">
              {/* TABS */}
              <div className="flex border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
                <button
                  onClick={() => setTab("producto")}
                  className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                    tab === "producto"
                      ? "bg-gray-900 text-white border-b-2 border-blue-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  📝 Producto
                </button>
                <button
                  onClick={() => setTab("landing")}
                  className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                    tab === "landing"
                      ? "bg-gray-900 text-white border-b-2 border-blue-500"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  🎨 Landing
                </button>
              </div>

              {/* TAB PRODUCTO */}
              {tab === "producto" && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-gray-400 text-xs block mb-1">
                      Nombre
                    </label>
                    <input
                      value={pNombre}
                      onChange={(e) => setPNombre(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>

                  <div className="border border-gray-700 rounded p-3 space-y-2">
                    <p className="text-white text-xs font-semibold">
                      💰 Precio 1 unidad
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={pPrecio}
                        onChange={(e) => setPPrecio(Number(e.target.value))}
                        placeholder="Precio"
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                      <input
                        type="number"
                        value={pPrecioAntes}
                        onChange={(e) =>
                          setPPrecioAntes(Number(e.target.value))
                        }
                        placeholder="Antes"
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="border border-purple-600/40 rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-xs font-semibold">
                        🎁 Precio 2 unidades
                      </p>
                      <input
                        type="checkbox"
                        checked={pPrecio2Activo}
                        onChange={(e) => setPPrecio2Activo(e.target.checked)}
                        className="w-4 h-4 accent-purple-600"
                      />
                    </div>
                    {pPrecio2Activo && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={pPrecio2}
                          onChange={(e) => setPPrecio2(Number(e.target.value))}
                          placeholder="Precio"
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        />
                        <input
                          type="number"
                          value={pPrecio2Antes}
                          onChange={(e) =>
                            setPPrecio2Antes(Number(e.target.value))
                          }
                          placeholder="Antes"
                          className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-400 text-xs block">
                      📝 Textos de oferta
                    </label>
                    <input
                      value={pTextoOferta1}
                      onChange={(e) => setPTextoOferta1(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                    <input
                      value={pTextoOferta2}
                      onChange={(e) => setPTextoOferta2(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <InputImagen
                      label="🖼️ Imagen principal"
                      value={pImagen}
                      onChange={setPImagen}
                    />
                  </div>

                  <div className="border-t border-gray-700 pt-3 space-y-2">
                    <p className="text-white text-xs font-semibold">
                      💬 Textos del modal
                    </p>
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={pModalMostrarSub}
                        onChange={(e) => setPModalMostrarSub(e.target.checked)}
                        className="w-4 h-4 accent-blue-500"
                      />
                      Mostrar subtítulo
                    </label>
                    {pModalMostrarSub && (
                      <textarea
                        value={pModalSub}
                        onChange={(e) => setPModalSub(e.target.value)}
                        rows={2}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                      />
                    )}
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={pModalMostrarImp}
                        onChange={(e) => setPModalMostrarImp(e.target.checked)}
                        className="w-4 h-4 accent-blue-500"
                      />
                      Mostrar nota importante
                    </label>
                    {pModalMostrarImp && (
                      <textarea
                        value={pModalImp}
                        onChange={(e) => setPModalImp(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs"
                      />
                    )}
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={pMostrarResenas}
                        onChange={(e) => setPMostrarResenas(e.target.checked)}
                        className="w-4 h-4 accent-blue-500"
                      />
                      ⭐ Mostrar reseñas
                    </label>
                  </div>
                </div>
              )}

              {/* TAB LANDING — CON SECCIONES */}
              {tab === "landing" && (
                <div className="p-3 space-y-2">
                  <AgregarSeccionDropdown />

                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                  >
                    <SortableContext
                      items={secciones.map((s) => `seccion-${s.id}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      {secciones.map((seccion) => (
                        <SeccionSidebar
                          key={seccion.id}
                          seccion={seccion}
                          seleccionado={seleccionado}
                          seccionSeleccionada={seccionSeleccionada}
                          onSelectBloque={(id) => {
                            seleccionar(id);
                            setSeccionSeleccionada(null);
                          }}
                          onSelectSeccion={() => {
                            seleccionar(null);
                            setSeccionSeleccionada(
                              seccionSeleccionada === seccion.id
                                ? null
                                : seccion.id,
                            );
                          }}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </aside>
          )}

          {/* PREVIEW */}
          <main className="bg-gray-950 flex items-start justify-center p-6 overflow-y-auto">
            <div className="bg-black rounded-[2rem] p-3 border-4 border-gray-700 shadow-2xl relative">
              <iframe
                ref={iframeRef}
                src="/admin/productos/preview"
                className="w-[360px] h-[700px] rounded-[1.5rem] bg-white block"
                title="Preview"
              />
            </div>
          </main>

          {/* PANEL DER */}
          {!verComoCliente && (
            <aside className="bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
              <h2 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">
                ⚙️ Ajustes
              </h2>

              {seccionSeleccionada ? (
                // ─── AJUSTES DE SECCIÓN ───
                (() => {
                  const seccion = secciones.find(
                    (s) => s.id === seccionSeleccionada,
                  );
                  if (!seccion) return null;
                  const def = SECCIONES[seccion.tipo];
                  if (!def) return null;   // 👈 GUARD
                  const aj = seccion.ajustes || {
                    ancho: "fill",
                    anchoMax: 480,
                    colorFondo: null,
                    radioEsquinas: 0,
                    paddingArriba: 0,
                    paddingAbajo: 0,
                    paddingLados: 0,
                  };
                  const upd = (cambios: any) =>
                    actualizarAjustesSeccion(seccion.id, cambios);

                  return (
                    <div className="space-y-4">
                      <div className="border-b border-gray-700 pb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-white text-sm font-semibold">
                            {def.icono} {seccion.nombre}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Sección · ID: {seccion.id.slice(0, 8)}
                          </p>
                        </div>
                        <button
                          onClick={() => setSeccionSeleccionada(null)}
                          className="text-gray-500 hover:text-white text-lg leading-none shrink-0"
                          title="Cerrar panel"
                        >
                          ×
                        </button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                          📐 Tamaño
                        </p>
                        <label className="block space-y-1">
                          <span className="text-gray-400 text-xs block">
                            Ancho
                          </span>
                          <select
                            value={aj.ancho}
                            onChange={(e) => upd({ ancho: e.target.value })}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                          >
                            <option value="fill">Rellenar (100%)</option>
                            <option value="ajustar">Ajustar (centrado)</option>
                          </select>
                        </label>
                        {aj.ancho === "ajustar" && (
                          <label className="block space-y-1">
                            <span className="text-gray-400 text-xs block">
                              Ancho máximo
                            </span>
                            <Slider
                              value={aj.anchoMax}
                              onChange={(v) => upd({ anchoMax: v })}
                              min={320}
                              max={1200}
                              step={20}
                            />
                          </label>
                        )}
                      </div>

                      <div className="space-y-2 pt-3 border-t border-gray-700">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                          🎨 Apariencia
                        </p>
                        <label className="block space-y-1">
                          <span className="text-gray-400 text-xs block">
                            Color de fondo
                          </span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={aj.colorFondo || "#ffffff"}
                              onChange={(e) =>
                                upd({ colorFondo: e.target.value })
                              }
                              className="h-9 w-14 rounded border border-gray-600 bg-gray-700 cursor-pointer"
                            />
                            <span className="text-gray-400 text-xs">
                              {aj.colorFondo || "Heredado del tema"}
                            </span>
                            {aj.colorFondo && (
                              <button
                                onClick={() => upd({ colorFondo: null })}
                                className="text-[10px] text-gray-500 hover:text-white underline"
                              >
                                quitar
                              </button>
                            )}
                          </div>
                        </label>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-gray-700">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                          🔲 Bordes
                        </p>
                        <label className="block space-y-1">
                          <span className="text-gray-400 text-xs block">
                            Radio de esquinas
                          </span>
                          <Slider
                            value={aj.radioEsquinas}
                            onChange={(v) => upd({ radioEsquinas: v })}
                            min={0}
                            max={64}
                          />
                        </label>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-gray-700">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                          📏 Relleno
                        </p>
                        <label className="block space-y-1">
                          <span className="text-gray-400 text-xs block">
                            Arriba
                          </span>
                          <Slider
                            value={aj.paddingArriba}
                            onChange={(v) => upd({ paddingArriba: v })}
                            min={0}
                            max={120}
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-gray-400 text-xs block">
                            Abajo
                          </span>
                          <Slider
                            value={aj.paddingAbajo}
                            onChange={(v) => upd({ paddingAbajo: v })}
                            min={0}
                            max={120}
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-gray-400 text-xs block">
                            Lados
                          </span>
                          <Slider
                            value={aj.paddingLados}
                            onChange={(v) => upd({ paddingLados: v })}
                            min={0}
                            max={80}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })()
              ) : !defActual ? (
                <div className="text-gray-400 text-sm space-y-3">
                  <p>Selecciona un bloque o el nombre de una sección.</p>

                  {/* 🧭 NAVBAR */}
                  <details open>
                    <summary className="cursor-pointer text-xs text-gray-400 font-bold uppercase tracking-wide">
                      🧭 Barra de navegación
                    </summary>
                    <div className="mt-3 space-y-3">
                      <label className="flex items-center gap-2 text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={plantilla.tema.nav?.mostrar ?? true}
                          onChange={(e) =>
                            actualizarTema({
                              nav: {
                                ...(plantilla.tema.nav ?? NAV_DEFAULT),
                                mostrar: e.target.checked,
                              },
                            })
                          }
                          className="w-4 h-4 accent-blue-500"
                        />
                        Mostrar barra de navegación
                      </label>

                      {plantilla.tema.nav?.mostrar !== false && (
                        <>
                          <label className="flex items-center gap-2 text-xs text-gray-300">
                            <input
                              type="checkbox"
                              checked={
                                plantilla.tema.nav?.mostrarHamburguesa ?? true
                              }
                              onChange={(e) =>
                                actualizarTema({
                                  nav: {
                                    ...(plantilla.tema.nav ?? NAV_DEFAULT),
                                    mostrarHamburguesa: e.target.checked,
                                  },
                                })
                              }
                              className="w-4 h-4 accent-blue-500"
                            />
                            Mostrar menú hamburguesa
                          </label>

                          <InputImagen
                            label="Logo"
                            value={plantilla.tema.nav?.logoUrl || ""}
                            onChange={(url) =>
                              actualizarTema({
                                nav: {
                                  ...(plantilla.tema.nav ?? NAV_DEFAULT),
                                  logoUrl: url,
                                },
                              })
                            }
                          />

                          <label className="block space-y-1">
                            <span className="text-gray-400 text-xs block">
                              Altura del logo (px)
                            </span>
                            <Slider
                              value={plantilla.tema.nav?.logoAltura ?? 40}
                              onChange={(v) =>
                                actualizarTema({
                                  nav: {
                                    ...(plantilla.tema.nav ?? NAV_DEFAULT),
                                    logoAltura: v,
                                  },
                                })
                              }
                              min={20}
                              max={80}
                            />
                          </label>

                          <label className="block space-y-1">
                            <span className="text-gray-400 text-xs block">
                              Color de fondo
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={
                                  plantilla.tema.nav?.colorFondo || "#ffffff"
                                }
                                onChange={(e) =>
                                  actualizarTema({
                                    nav: {
                                      ...(plantilla.tema.nav ?? NAV_DEFAULT),
                                      colorFondo: e.target.value,
                                    },
                                  })
                                }
                                className="h-9 w-14 rounded border border-gray-600 bg-gray-700 cursor-pointer"
                              />
                              <span className="text-gray-400 text-xs">
                                {plantilla.tema.nav?.colorFondo || "#ffffff"}
                              </span>
                            </div>
                          </label>

                          <label className="block space-y-1">
                            <span className="text-gray-400 text-xs block">
                              Color de iconos
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={
                                  plantilla.tema.nav?.colorIconos || "#000000"
                                }
                                onChange={(e) =>
                                  actualizarTema({
                                    nav: {
                                      ...(plantilla.tema.nav ?? NAV_DEFAULT),
                                      colorIconos: e.target.value,
                                    },
                                  })
                                }
                                className="h-9 w-14 rounded border border-gray-600 bg-gray-700 cursor-pointer"
                              />
                              <span className="text-gray-400 text-xs">
                                {plantilla.tema.nav?.colorIconos || "#000000"}
                              </span>
                            </div>
                          </label>
                        </>
                      )}
                    </div>
                  </details>

                  {/* 🎨 TEMA */}
                  <details>
                    <summary className="cursor-pointer text-xs text-gray-500">
                      🎨 Tema del producto
                    </summary>
                    <div className="mt-2 space-y-2">
                      <label className="block">
                        {/*
                        <span className="text-gray-400 text-xs">
                          Color primario
                        </span>
                        <input
                          type="color"
                          value={plantilla.tema.colorPrimario}
                          onChange={(e) =>
                            actualizarTema({ colorPrimario: e.target.value })
                          }
                          className="h-9 w-full rounded border border-gray-600 bg-gray-700 cursor-pointer"
                        />
                        */}
                      </label>
                      <label className="block">
                        <span className="text-gray-400 text-xs">
                          Color de fondo
                        </span>
                        <input
                          type="color"
                          value={plantilla.tema.colorFondo}
                          onChange={(e) =>
                            actualizarTema({ colorFondo: e.target.value })
                          }
                          className="h-9 w-full rounded border border-gray-600 bg-gray-700 cursor-pointer"
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-400 text-xs">
                          Ancho máximo (px)
                        </span>
                        <input
                          type="number"
                          value={plantilla.tema.anchoMax}
                          onChange={(e) =>
                            actualizarTema({ anchoMax: Number(e.target.value) })
                          }
                          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        />
                      </label>
                    </div>
                  </details>
                </div>
              ) : (
                (() => {
                  const e = bloqueActual!.estilos || {};
                  const updEstilo = (cambios: any) =>
                    actualizarEstilosBloque(bloqueActual!.id, cambios);

                  return (
                    <div className="space-y-4">
                      <div className="border-b border-gray-700 pb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-white text-sm font-semibold">
                            {defActual.icono} {defActual.nombre}
                          </p>
                          <p className="text-gray-500 text-xs">
                            ID: {bloqueActual!.id.slice(0, 8)}
                          </p>
                        </div>
                        <button
                          onClick={() => seleccionar(null)}
                          className="text-gray-500 hover:text-white text-lg leading-none shrink-0"
                          title="Cerrar panel"
                        >
                          ×
                        </button>
                      </div>

                      {/* TABS */}
                      <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
                        <button
                          onClick={() => setTabInterna("contenido")}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                            tabInterna === "contenido"
                              ? "bg-blue-600 text-white"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Contenido
                        </button>
                        <button
                          onClick={() => setTabInterna("estilo")}
                          className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                            tabInterna === "estilo"
                              ? "bg-blue-600 text-white"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Estilo
                        </button>
                      </div>

                      {/* TAB CONTENIDO */}
                      {tabInterna === "contenido" && (
                        <div className="space-y-3">
 {defActual.schema.map((prop) => {
  // 👇 Si es repeater, buscar campos por clave específica
  if (prop.tipo === "repeater") {
    const campos =
      REPEATER_CAMPOS[`${bloqueActual!.tipo}_${prop.key}`] ||
      REPEATER_CAMPOS[bloqueActual!.tipo] ||
      [];
    return (
      <div key={prop.key} className="space-y-2">
        <span className="text-gray-400 text-xs block">
          {prop.label}
        </span>
        <EditorRepeater
          items={bloqueActual!.props[prop.key]}
          campos={campos}
          onChange={(nuevos) =>
            actualizarProps(bloqueActual!.id, {
              [prop.key]: nuevos,
            })
          }
        />
      </div>
    );
  }
  // 👇 Si NO es repeater, render normal
  return (
    <label key={prop.key} className="block space-y-1">
      <span className="text-gray-400 text-xs block">
        {prop.label}
      </span>
      <InputProp
        prop={prop}
        value={bloqueActual!.props[prop.key]}
        onChange={(v: any) =>
          actualizarProps(bloqueActual!.id, {
            [prop.key]: v,
          })
        }
        onSnapshot={() => {
          useEditor.setState((s: any) => ({
            historial: [
              ...s.historial.slice(-50),
              JSON.parse(JSON.stringify(s.plantilla)),
            ],
            futuro: [],
          }));
        }}
      />
    </label>
  );
})}
 
                        </div>
                      )}

                      {/* TAB ESTILO */}
                      {tabInterna === "estilo" && (
                        <div className="space-y-3">
{/* 🔤 TIPOGRAFÍA */}
{bloqueActual!.tipo !== "hero_imagen" && (
  <Grupo titulo="🔤 Tipografía">
    <label className="block space-y-1">
      <span className="text-gray-400 text-xs block">
        Tamaño de fuente
      </span>
      <Slider
        value={e.tamanoFuente ?? 16}
        onChange={(v) => updEstilo({ tamanoFuente: v })}
        min={8}
        max={72}
      />
    </label>

    <label className="block space-y-1">
      <span className="text-gray-400 text-xs block">
        Peso
      </span>
      <BotonDual
        value={e.pesoFuente || "normal"}
        onChange={(v) => updEstilo({ pesoFuente: v })}
        opciones={[
          { valor: "normal", label: "Normal" },
          { valor: "bold", label: "Bold" },
          { valor: "black", label: "Black" },
        ]}
      />
    </label>

    <label className="block space-y-1">
      <span className="text-gray-400 text-xs block">
        Interlineado
      </span>
      <Slider
        value={e.interlineado ?? 1.4}
        onChange={(v) => updEstilo({ interlineado: v })}
        min={1}
        max={2.5}
        step={0.1}
        unit="x"
      />
    </label>

    <label className="block space-y-1">
      <span className="text-gray-400 text-xs block">
        Espaciado entre letras
      </span>
      <Slider
        value={e.espaciadoLetras ?? 0}
        onChange={(v) => updEstilo({ espaciadoLetras: v })}
        min={-2}
        max={5}
        step={0.1}
      />
    </label>

    <label className="flex items-center gap-2 text-xs text-gray-300">
      <input
        type="checkbox"
        checked={!!e.cursiva}
        onChange={(ev) => updEstilo({ cursiva: ev.target.checked })}
        className="w-4 h-4 accent-blue-500"
      />
      Cursiva
    </label>

    <label className="flex items-center gap-2 text-xs text-gray-300">
      <input
        type="checkbox"
        checked={!!e.mayusculas}
        onChange={(ev) => updEstilo({ mayusculas: ev.target.checked })}
        className="w-4 h-4 accent-blue-500"
      />
      MAYÚSCULAS
    </label>
  </Grupo>
)}
                          {/* 📐 TAMAÑO */}
                          <Grupo titulo="📐 Tamaño">
                            <label className="block space-y-1">
                              <span className="text-gray-400 text-xs block">
                                Ancho
                              </span>
                              <BotonDual
                                value={e.ancho || "auto"}
                                onChange={(v) => updEstilo({ ancho: v })}
                                opciones={[
                                  { valor: "auto", label: "Auto" },
                                  { valor: "fill", label: "Rellenar" },
                                  { valor: "ajustar", label: "Ajustar" },
                                ]}
                              />
                            </label>
                            {e.ancho === "ajustar" && (
                              <label className="block space-y-1">
                                <span className="text-gray-400 text-xs block">
                                  Ancho máximo
                                </span>
                                <Slider
                                  value={e.anchoMax ?? 320}
                                  onChange={(v) => updEstilo({ anchoMax: v })}
                                  min={200}
                                  max={1200}
                                  step={20}
                                />
                              </label>
                            )}
                          </Grupo>

                          {/* 🎨 APARIENCIA */}
                          <Grupo titulo="🎨 Apariencia">
                            <label className="block space-y-1">
                              <span className="text-gray-400 text-xs block">
                                Color de fondo
                              </span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={e.colorFondo || "#ffffff"}
                                  onChange={(ev) =>
                                    updEstilo({
                                      colorFondo: ev.target.value,
                                    })
                                  }
                                  className="h-9 w-14 rounded border border-gray-600 bg-gray-700 cursor-pointer"
                                />
                                <span className="text-gray-400 text-xs">
                                  {e.colorFondo || "Sin fondo"}
                                </span>
                                {e.colorFondo && (
                                  <button
                                    onClick={() =>
                                      updEstilo({ colorFondo: null })
                                    }
                                    className="text-[10px] text-gray-500 hover:text-white underline"
                                  >
                                    quitar
                                  </button>
                                )}
                              </div>
                            </label>
                            <label className="block space-y-1">
                              <span className="text-gray-400 text-xs block">
                                Opacidad (%)
                              </span>
                              <Slider
                                value={e.opacidad ?? 100}
                                onChange={(v) => updEstilo({ opacidad: v })}
                                min={0}
                                max={100}
                                unit="%"
                              />
                            </label>
                          </Grupo>

                          {/* 🔲 BORDES */}
                          <Grupo titulo="🔲 Bordes">
                            <label className="block space-y-1">
                              <span className="text-gray-400 text-xs block">
                                Radio de esquinas
                              </span>
                              <Slider
                                value={e.radioEsquinas ?? 0}
                                onChange={(v) =>
                                  updEstilo({ radioEsquinas: v })
                                }
                                min={0}
                                max={64}
                              />
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-300">
                              <input
                                type="checkbox"
                                checked={!!e.mostrarBorde}
                                onChange={(ev) =>
                                  updEstilo({
                                    mostrarBorde: ev.target.checked,
                                  })
                                }
                                className="w-4 h-4 accent-blue-500"
                              />
                              Mostrar borde
                            </label>
                            {e.mostrarBorde && (
                              <>
                                <label className="block space-y-1">
                                  <span className="text-gray-400 text-xs block">
                                    Grosor
                                  </span>
                                  <Slider
                                    value={e.grosorBorde ?? 1}
                                    onChange={(v) =>
                                      updEstilo({ grosorBorde: v })
                                    }
                                    min={1}
                                    max={10}
                                  />
                                </label>
                                <label className="block space-y-1">
                                  <span className="text-gray-400 text-xs block">
                                    Color del borde
                                  </span>
                                  <input
                                    type="color"
                                    value={e.colorBorde || "#e5e7eb"}
                                    onChange={(ev) =>
                                      updEstilo({
                                        colorBorde: ev.target.value,
                                      })
                                    }
                                    className="h-9 w-14 rounded border border-gray-600 bg-gray-700 cursor-pointer"
                                  />
                                </label>
                              </>
                            )}
                          </Grupo>

                          {/* 📏 RELLENO */}
                          <Grupo titulo="📏 Relleno">
                            <label className="block space-y-1">
                              <span className="text-gray-400 text-xs block">
                                Arriba
                              </span>
                              <Slider
                                value={e.paddingArriba ?? 0}
                                onChange={(v) =>
                                  updEstilo({ paddingArriba: v })
                                }
                                min={0}
                                max={120}
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-gray-400 text-xs block">
                                Abajo
                              </span>
                              <Slider
                                value={e.paddingAbajo ?? 0}
                                onChange={(v) => updEstilo({ paddingAbajo: v })}
                                min={0}
                                max={120}
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-gray-400 text-xs block">
                                Lados
                              </span>
                              <Slider
                                value={e.paddingLados ?? 0}
                                onChange={(v) => updEstilo({ paddingLados: v })}
                                min={0}
                                max={80}
                              />
                            </label>
                          </Grupo>

                          {/* 📐 MARGEN */}
                          <Grupo titulo="📐 Margen">
                            <label className="block space-y-1">
                              <span className="text-gray-400 text-xs block">
                                Arriba
                              </span>
                              <Slider
                                value={e.marginArriba ?? 0}
                                onChange={(v) => updEstilo({ marginArriba: v })}
                                min={0}
                                max={120}
                              />
                            </label>
                            <label className="block space-y-1">
                              <span className="text-gray-400 text-xs block">
                                Abajo
                              </span>
                              <Slider
                                value={e.marginAbajo ?? 0}
                                onChange={(v) => updEstilo({ marginAbajo: v })}
                                min={0}
                                max={120}
                              />
                            </label>
                          </Grupo>

                          <Grupo titulo="↔️ Alineación">
                            <BotonDual
                              value={e.alineacion || "izq"}
                              onChange={(v) => updEstilo({ alineacion: v })}
                              opciones={[
                                { valor: "izq", label: "Izq" },
                                { valor: "centro", label: "Centro" },
                                { valor: "der", label: "Der" },
                              ]}
                            />
                          </Grupo>

                          {/* 👁️ VISIBILIDAD */}
                          <Grupo titulo="👁️ Visibilidad">
                            <label className="flex items-center gap-2 text-xs text-gray-300">
                              <input
                                type="checkbox"
                                checked={!!e.oculto}
                                onChange={(ev) =>
                                  updEstilo({ oculto: ev.target.checked })
                                }
                                className="w-4 h-4 accent-blue-500"
                              />
                              Ocultar bloque en la landing
                            </label>
                          </Grupo>
                        </div>
                      )}

                      {/* ELIMINAR */}
                      <div className="pt-3 border-t border-gray-700">
                        <button
                          onClick={() => {
                            if (confirm("¿Eliminar este bloque?")) {
                              useEditor
                                .getState()
                                .eliminarBloque(bloqueActual!.id);
                            }
                          }}
                          className="w-full py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded text-sm"
                        >
                          🗑 Eliminar bloque
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </aside>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
