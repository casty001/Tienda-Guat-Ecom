"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import AdminGuard from "@/components/AdminGuard";
import {
  BLOQUES,
  SECCIONES,
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
  type DragEndEvent,
  useDroppable,
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
          <img src={value} alt="preview" className="w-full h-40 object-contain" />
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
  { key: string; label: string; tipo: "text" | "textarea" | "number" }[]
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
    { key: "nombre", label: "Nombre", tipo: "text" },
    { key: "ciudad", label: "Ciudad", tipo: "text" },
    { key: "resena", label: "Reseña", tipo: "textarea" },
    { key: "puntuacion", label: "Puntuación (1-5)", tipo: "number" },
  ],
};

const REPEATER_PROP_KEY: Record<string, string> = {
  prueba_social: "beneficios",
  faqs: "items",
  resenas: "items",
};

function EditorRepeater({
  items,
  campos,
  onChange,
}: {
  items: any[];
  campos: { key: string; label: string; tipo: "text" | "textarea" | "number" }[];
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
            <span className="text-xs text-gray-400 font-semibold">#{i + 1}</span>
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
              ) : (
                <input
                  type={c.tipo === "number" ? "number" : "text"}
                  value={item[c.key] ?? ""}
                  onChange={(e) =>
                    actualizarItem(
                      i,
                      c.key,
                      c.tipo === "number" ? Number(e.target.value) : e.target.value
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
    return <InputImagen value={value || ""} onChange={onChange} />;
  }
  if (prop.tipo === "toggle") {
    return (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
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
        onChange={(e) => onChange(e.target.value)}
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
  const agregarBloque = useEditor((s) => s.agregarBloque);
  const renombrarSeccion = useEditor((s) => s.renombrarSeccion);
  const toggleVisible = useEditor((s) => s.toggleVisibleSeccion);
  const def = SECCIONES[seccion.tipo];

  // Drop zone de la sección (para drag entre secciones)
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `seccion-${seccion.id}`,
    data: { seccionId: seccion.id },
  });

  return (
    <div
      ref={setDropRef}
      className={`rounded-lg border transition-colors ${
        isOver ? "border-blue-500 bg-blue-950/30" : "border-gray-700 bg-gray-850"
      } ${!seccion.visible ? "opacity-50" : ""}`}
      style={{ backgroundColor: isOver ? undefined : "#1a1d22" }}
    >
      {/* Header de la sección */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <button
          onClick={() => setAbierta((v) => !v)}
          className="text-gray-400 hover:text-white text-xs w-4"
        >
          {abierta ? "▼" : "▶"}
        </button>
        <button
  onClick={onSelectSeccion}
  className={`text-xs font-semibold flex-1 truncate text-left ${
    seccionSeleccionada === seccion.id
      ? "text-blue-400"
      : "text-white hover:text-blue-300"
  }`}
>
  {def.icono} {seccion.nombre}
</button>
        <button
          onClick={() => toggleVisible(seccion.id)}
          className={`text-xs ${
            seccion.visible ? "text-gray-400 hover:text-white" : "text-yellow-500"
          }`}
          title={seccion.visible ? "Ocultar sección" : "Mostrar sección"}
        >
          {seccion.visible ? "👁" : "🚫"}
        </button>
      </div>

      {abierta && (
        <div className="px-2 pb-2 space-y-1.5">
          {/* Lista de bloques */}
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

          {/* Botón añadir bloque */}
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
                {def.bloquesPermitidos.map((tipo) => {
                  const bdef = BLOQUES[tipo];
                  if (!bdef) return null;
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
                })}
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
  actualizarTema,
  actualizarAjustesSeccion,
  moverBloqueDentroSeccion,
  moverBloqueEntreSecciones,
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
const [seccionSeleccionada, setSeccionSeleccionada] = useState<string | null>(null);

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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "PREVIEW_READY") setPreviewListo(true);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

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
      },
      window.location.origin
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
  ]);

  // Dirty
  useEffect(() => {
    setDirty(hayCambios());
  }, [plantilla, hayCambios]);

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
  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Buscar el bloque activo y su sección
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
        aSeccion.bloques.length
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
      moverBloqueEntreSecciones(
        activeId,
        deSeccion.id,
        aSeccion.id,
        aIndex
      );
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
                        onChange={(e) => setPPrecioAntes(Number(e.target.value))}
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
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
      setSeccionSeleccionada(seccion.id);
    }}
  />
))}
                  </DndContext>
                </div>
              )}
            </aside>
          )}

          {/* PREVIEW */}
          <main className="bg-gray-950 flex items-center justify-center p-6 overflow-y-auto">
            <div className="bg-black rounded-[2rem] p-3 border-4 border-gray-700 shadow-2xl">
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
    const seccion = secciones.find((s) => s.id === seccionSeleccionada);
    if (!seccion) return null;
    const def = SECCIONES[seccion.tipo];
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
        <div className="border-b border-gray-700 pb-2">
          <p className="text-white text-sm font-semibold">
            {def.icono} {seccion.nombre}
          </p>
          <p className="text-gray-500 text-xs">
            Sección · ID: {seccion.id.slice(0, 8)}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
            📐 Tamaño
          </p>
          <label className="block space-y-1">
            <span className="text-gray-400 text-xs block">Ancho</span>
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
              <span className="text-gray-400 text-xs block">Ancho máximo</span>
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
            <span className="text-gray-400 text-xs block">Color de fondo</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={aj.colorFondo || "#ffffff"}
                onChange={(e) => upd({ colorFondo: e.target.value })}
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
            <span className="text-gray-400 text-xs block">Arriba</span>
            <Slider
              value={aj.paddingArriba}
              onChange={(v) => upd({ paddingArriba: v })}
              min={0}
              max={120}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-gray-400 text-xs block">Abajo</span>
            <Slider
              value={aj.paddingAbajo}
              onChange={(v) => upd({ paddingAbajo: v })}
              min={0}
              max={120}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-gray-400 text-xs block">Lados</span>
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

    <details>
      <summary className="cursor-pointer text-xs text-gray-500">
        🎨 Tema del producto
      </summary>
      <div className="mt-2 space-y-2">
        <label className="block">
          <span className="text-gray-400 text-xs">Color primario</span>
          <input
            type="color"
            value={plantilla.tema.colorPrimario}
            onChange={(e) =>
              actualizarTema({ colorPrimario: e.target.value })
            }
            className="h-9 w-full rounded border border-gray-600 bg-gray-700 cursor-pointer"
          />
        </label>
        <label className="block">
          <span className="text-gray-400 text-xs">Color de fondo</span>
          <input
            type="color"
            value={plantilla.tema.colorFondo}
            onChange={(e) => actualizarTema({ colorFondo: e.target.value })}
            className="h-9 w-full rounded border border-gray-600 bg-gray-700 cursor-pointer"
          />
        </label>
        <label className="block">
          <span className="text-gray-400 text-xs">Ancho máximo (px)</span>
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
  <div className="space-y-4">
    <div className="border-b border-gray-700 pb-2">
      <p className="text-white text-sm font-semibold">
        {defActual.icono} {defActual.nombre}
      </p>
      <p className="text-gray-500 text-xs">
        ID: {bloqueActual!.id.slice(0, 8)}
      </p>
    </div>

    {defActual.schema.map((prop) => {
      const repeaterKey = REPEATER_PROP_KEY[bloqueActual!.tipo];
      if (prop.tipo === "repeater" && repeaterKey === prop.key) {
        const campos = REPEATER_CAMPOS[bloqueActual!.tipo] || [];
        return (
          <div key={prop.key} className="space-y-2">
            <span className="text-gray-400 text-xs block">{prop.label}</span>
            <EditorRepeater
              items={bloqueActual!.props[prop.key]}
              campos={campos}
              onChange={(nuevos) =>
                actualizarProps(bloqueActual!.id, { [prop.key]: nuevos })
              }
            />
          </div>
        );
      }
      return (
        <label key={prop.key} className="block space-y-1">
          <span className="text-gray-400 text-xs block">{prop.label}</span>
          <InputProp
            prop={prop}
            value={bloqueActual!.props[prop.key]}
            onChange={(v: any) =>
              actualizarProps(bloqueActual!.id, { [prop.key]: v })
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

    <div className="pt-3 border-t border-gray-700">
      <button
        onClick={() => {
          if (confirm("¿Eliminar este bloque?")) {
            useEditor.getState().eliminarBloque(bloqueActual!.id);
          }
        }}
        className="w-full py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded text-sm"
      >
        🗑 Eliminar bloque
      </button>
    </div>
  </div>
)}
            </aside>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}