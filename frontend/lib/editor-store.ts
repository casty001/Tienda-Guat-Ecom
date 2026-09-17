import { create } from "zustand";
import {
  BLOQUES,
  SECCIONES,
  ORDEN_SECCIONES,
  crearSeccion,
  crearSeccionesVacias,
  migrarASecciones,
  type Bloque,
  type Plantilla,
  type Seccion,
  type TipoSeccion,
} from "./bloques";
import { NAV_DEFAULT } from "./bloques"; // 👈 agrega este import

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function clonarPlantilla(p: Plantilla): Plantilla {
  return {
    version: p.version,
    tema: { ...p.tema },
    bloques: (p.bloques || []).map((b) => ({
      id: b.id,
      tipo: b.tipo,
      props: { ...b.props },
      estilos: b.estilos ? { ...b.estilos } : undefined,   // 👈 NUEVO
    })),
    secciones: (p.secciones || []).map((s) => ({
      id: s.id,
      tipo: s.tipo,
      nombre: s.nombre,
      visible: s.visible,
            colapsada: s.colapsada ?? false,   // 👈 ESTA LÍNEA FALTA

      ajustes: { ...(s as any).ajustes },
      bloques: s.bloques.map((b) => ({
        id: b.id,
        tipo: b.tipo,
        props: { ...b.props },
        estilos: b.estilos ? { ...b.estilos } : undefined,   // 👈 NUEVO
      })),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════

type EditorState = {
  // Datos
  plantilla: Plantilla;
  original: Plantilla;

  // UI
  seleccionado: string | null;         // id del bloque seleccionado
  seccionSeleccionada: string | null;  // id de la sección seleccionada (opcional)

  // Historial
  historial: Plantilla[];
  futuro: Plantilla[];

  // ─── Carga / guardado ───
  cargar: (p: Plantilla) => void;
  marcarGuardado: () => void;
  hayCambios: () => boolean;

  // ─── Selección ───
  seleccionar: (id: string | null) => void;
  seleccionarSeccion: (id: string | null) => void;

  // ─── Bloques (dentro de secciones) ───
  agregarBloque: (tipo: string, seccionId: string, index?: number) => void;
  moverBloqueDentroSeccion: (seccionId: string, from: number, to: number) => void;
  moverBloqueEntreSecciones: (
    bloqueId: string,
    deSeccionId: string,
    aSeccionId: string,
    aIndex: number
  ) => void;
  duplicarBloque: (id: string) => void;
  eliminarBloque: (id: string) => void;
  actualizarProps: (id: string, props: Record<string, any>) => void;
    actualizarEstilosBloque: (id: string, estilos: Record<string, any>) => void;

  // ─── Secciones ───
  renombrarSeccion: (id: string, nombre: string) => void;
  toggleVisibleSeccion: (id: string) => void;
  actualizarAjustesSeccion: (id: string, ajustes: Partial<any>) => void;
  agregarSeccion: (tipo: TipoSeccion, index?: number) => void;
  eliminarSeccion: (id: string) => void;
  duplicarSeccion: (id: string) => void;
  moverSeccion: (from: number, to: number) => void;
  // ─── Tema ───
  actualizarTema: (tema: Partial<Plantilla["tema"]>) => void;

  // ─── Historial ───
  undo: () => void;
  redo: () => void;
  puedeUndo: () => boolean;
  puedeRedo: () => boolean;
};

const PLANTILLA_VACIA: Plantilla = {
  version: 3,
  bloques: [],
  secciones: crearSeccionesVacias(),
  tema: {
    colorPrimario: "#cb1515",
    colorFondo: "#121212",
    tipografia: "Inter",
    anchoMax: 480,
    nav: { ...NAV_DEFAULT }, // 👈 agregado

  },
};

function conHistorial(state: EditorState, nuevaPlantilla: Plantilla) {
  return {
    historial: [...state.historial.slice(-50), clonarPlantilla(state.plantilla)],
    futuro: [],
    plantilla: nuevaPlantilla,
  };
}

// Devuelve la sección que contiene el bloque con ese id
function encontrarSeccionDelBloque(plantilla: Plantilla, bloqueId: string) {
  const secciones = plantilla.secciones || [];
  for (const s of secciones) {
    if (s.bloques.some((b) => b.id === bloqueId)) return s;
  }
  return null;
}

export const useEditor = create<EditorState>((set, get) => ({
  plantilla: clonarPlantilla(PLANTILLA_VACIA),
  original: clonarPlantilla(PLANTILLA_VACIA),
  seleccionado: null,
  seccionSeleccionada: null,
  historial: [],
  futuro: [],

  // ──────────────────────────────────────────────────────────────
  // CARGA / GUARDADO
  // ──────────────────────────────────────────────────────────────
  cargar: (p) => {
    // 👇 Normalizar: si viene en formato viejo (bloques planos), migrar a secciones
    const normalizada = migrarASecciones(p);
    set({
      plantilla: clonarPlantilla(normalizada),
      original: clonarPlantilla(normalizada),
      seleccionado: null,
      seccionSeleccionada: null,
      historial: [],
      futuro: [],
    });
  },

  marcarGuardado: () => {
    const state = get();
    set({ original: clonarPlantilla(state.plantilla) });
  },

  hayCambios: () => {
    const { plantilla, original } = get();
    return JSON.stringify(plantilla) !== JSON.stringify(original);
  },

  // ──────────────────────────────────────────────────────────────
  // SELECCIÓN
  // ──────────────────────────────────────────────────────────────
  seleccionar: (id) => set({ seleccionado: id }),
  seleccionarSeccion: (id) => set({ seccionSeleccionada: id }),

  // ──────────────────────────────────────────────────────────────
  // AGREGAR BLOQUE A UNA SECCIÓN
  // ──────────────────────────────────────────────────────────────
  agregarBloque: (tipo, seccionId, index) => {
    const state = get();
    const def = BLOQUES[tipo];
    if (!def) return;

    const secciones = state.plantilla.secciones || [];
    const seccion = secciones.find((s) => s.id === seccionId);
    if (!seccion) return;

    // Respetar límite de bloques del tipo
    if (def.max > 0) {
      const cuenta = seccion.bloques.filter((b) => b.tipo === tipo).length;
      if (cuenta >= def.max) {
        alert(`Máximo ${def.max} bloque(s) de "${def.nombre}" en esta sección`);
        return;
      }
    }

    const nuevo: Bloque = {
      id: newId(),
      tipo,
      props: { ...def.defaults },
    };

    const nuevasSecciones = secciones.map((s) => {
      if (s.id !== seccionId) return s;
      const bloques = [...s.bloques];
      bloques.splice(index ?? bloques.length, 0, nuevo);
      return { ...s, bloques };
    });

    set({
      ...conHistorial(state, { ...state.plantilla, secciones: nuevasSecciones }),
      seleccionado: nuevo.id,
    });
  },

  // ──────────────────────────────────────────────────────────────
  // MOVER BLOQUE DENTRO DE SU SECCIÓN
  // ──────────────────────────────────────────────────────────────
  moverBloqueDentroSeccion: (seccionId, from, to) => {
    const state = get();
    if (from === to) return;

    const secciones = state.plantilla.secciones || [];
    const nuevasSecciones = secciones.map((s) => {
      if (s.id !== seccionId) return s;
      const bloques = [...s.bloques];
      if (from < 0 || to < 0 || from >= bloques.length || to >= bloques.length)
        return s;
      const [item] = bloques.splice(from, 1);
      bloques.splice(to, 0, item);
      return { ...s, bloques };
    });

    set(conHistorial(state, { ...state.plantilla, secciones: nuevasSecciones }));
  },

  // ──────────────────────────────────────────────────────────────
  // MOVER BLOQUE ENTRE SECCIONES (drag de una sección a otra)
  // ──────────────────────────────────────────────────────────────
  moverBloqueEntreSecciones: (bloqueId, deSeccionId, aSeccionId, aIndex) => {
    const state = get();
    if (deSeccionId === aSeccionId) return;

    const secciones = state.plantilla.secciones || [];
    const deSeccion = secciones.find((s) => s.id === deSeccionId);
    const aSeccion = secciones.find((s) => s.id === aSeccionId);
    if (!deSeccion || !aSeccion) return;

    const bloque = deSeccion.bloques.find((b) => b.id === bloqueId);
    if (!bloque) return;

    // Verificar que el bloque puede ir en la sección destino
    const def = SECCIONES[aSeccion.tipo];
    if (def && !def.bloquesPermitidos.includes(bloque.tipo)) {
      alert(`"${BLOQUES[bloque.tipo]?.nombre}" no puede ir en "${def.nombre}"`);
      return;
    }

    const nuevasSecciones = secciones.map((s) => {
      if (s.id === deSeccionId) {
        return { ...s, bloques: s.bloques.filter((b) => b.id !== bloqueId) };
      }
      if (s.id === aSeccionId) {
        const bloques = [...s.bloques];
        bloques.splice(aIndex, 0, bloque);
        return { ...s, bloques };
      }
      return s;
    });

    set(conHistorial(state, { ...state.plantilla, secciones: nuevasSecciones }));
  },

  // ──────────────────────────────────────────────────────────────
  // DUPLICAR BLOQUE
  // ──────────────────────────────────────────────────────────────
  duplicarBloque: (id) => {
    const state = get();
    const secciones = state.plantilla.secciones || [];
    const seccion = encontrarSeccionDelBloque(state.plantilla, id);
    if (!seccion) return;

    const index = seccion.bloques.findIndex((b) => b.id === id);
    if (index < 0) return;
    const original = seccion.bloques[index];
    const def = BLOQUES[original.tipo];
    if (!def) return;

    if (def.max > 0) {
      const cuenta = seccion.bloques.filter((b) => b.tipo === original.tipo).length;
      if (cuenta >= def.max) {
        alert(`Máximo ${def.max} bloque(s) de "${def.nombre}" en esta sección`);
        return;
      }
    }

    const copia: Bloque = {
      id: newId(),
      tipo: original.tipo,
      props: { ...original.props },
    };

    const nuevasSecciones = secciones.map((s) => {
      if (s.id !== seccion.id) return s;
      const bloques = [...s.bloques];
      bloques.splice(index + 1, 0, copia);
      return { ...s, bloques };
    });

    set({
      ...conHistorial(state, { ...state.plantilla, secciones: nuevasSecciones }),
      seleccionado: copia.id,
    });
  },

  // ──────────────────────────────────────────────────────────────
  // ELIMINAR BLOQUE
  // ──────────────────────────────────────────────────────────────
  eliminarBloque: (id) => {
    const state = get();
    const secciones = state.plantilla.secciones || [];
    let encontrado = false;

    const nuevasSecciones = secciones.map((s) => {
      if (s.bloques.some((b) => b.id === id)) {
        encontrado = true;
        return { ...s, bloques: s.bloques.filter((b) => b.id !== id) };
      }
      return s;
    });

    if (!encontrado) return;

    set({
      ...conHistorial(state, { ...state.plantilla, secciones: nuevasSecciones }),
      seleccionado: state.seleccionado === id ? null : state.seleccionado,
    });
  },

  // ──────────────────────────────────────────────────────────────
  // ACTUALIZAR PROPS DE UN BLOQUE (sin historial — se llama al escribir)
  // ──────────────────────────────────────────────────────────────
  actualizarProps: (id, props) => {
    const state = get();
    const secciones = state.plantilla.secciones || [];
    const nuevasSecciones = secciones.map((s) => ({
      ...s,
      bloques: s.bloques.map((b) =>
        b.id === id ? { ...b, props: { ...b.props, ...props } } : b
      ),
    }));
    set({ plantilla: { ...state.plantilla, secciones: nuevasSecciones } });
  },
  actualizarEstilosBloque: (id, estilos) => {
    const state = get();
    const secciones = state.plantilla.secciones || [];
    const nuevasSecciones = secciones.map((s) => ({
      ...s,
      bloques: s.bloques.map((b) =>
        b.id === id
          ? { ...b, estilos: { ...(b.estilos || {}), ...estilos } }
          : b
      ),
    }));
    set({ plantilla: { ...state.plantilla, secciones: nuevasSecciones } });
  },
  // ──────────────────────────────────────────────────────────────
  // SECCIONES
  // ──────────────────────────────────────────────────────────────
  renombrarSeccion: (id, nombre) => {
    const state = get();
    const secciones = (state.plantilla.secciones || []).map((s) =>
      s.id === id ? { ...s, nombre } : s
    );
    set({ plantilla: { ...state.plantilla, secciones } });
  },

  toggleVisibleSeccion: (id) => {
    const state = get();
    const secciones = (state.plantilla.secciones || []).map((s) =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    set(conHistorial(state, { ...state.plantilla, secciones }));
  },
  actualizarAjustesSeccion: (id, ajustes) => {
    const state = get();
    const secciones = (state.plantilla.secciones || []).map((s) =>
      s.id === id
        ? { ...s, ajustes: { ...(s.ajustes || {}), ...ajustes } }
        : s
    );
    set(conHistorial(state, { ...state.plantilla, secciones }));
  },
    // ──────────────────────────────────────────────────────────────
  // AGREGAR SECCIÓN
  // ──────────────────────────────────────────────────────────────
  agregarSeccion: (tipo, index) => {
    const state = get();
    const def = SECCIONES[tipo];
    if (!def) return;

    const nueva = crearSeccion(tipo);

    const secciones = [...(state.plantilla.secciones || [])];
    secciones.splice(index ?? secciones.length, 0, nueva);

    set({
      ...conHistorial(state, { ...state.plantilla, secciones }),
      seccionSeleccionada: nueva.id,
      seleccionado: null,
    });
  },

  // ──────────────────────────────────────────────────────────────
  // ELIMINAR SECCIÓN
  // ──────────────────────────────────────────────────────────────
  eliminarSeccion: (id) => {
    const state = get();
    const secciones = state.plantilla.secciones || [];
    const seccion = secciones.find((s) => s.id === id);
    if (!seccion) return;

    // Verificar si es fija
    const def = SECCIONES[seccion.tipo];
    if (def?.fija) {
      alert(
        `La sección "${seccion.nombre}" es fija y no se puede eliminar. Podés ocultarla con el botón 👁.`,
      );
      return;
    }

    if (
      seccion.bloques.length > 0 &&
      !confirm(
        `¿Eliminar la sección "${seccion.nombre}" con sus ${seccion.bloques.length} bloque(s)?`,
      )
    ) {
      return;
    }

    const nuevas = secciones.filter((s) => s.id !== id);

    set({
      ...conHistorial(state, { ...state.plantilla, secciones: nuevas }),
      seccionSeleccionada:
        state.seccionSeleccionada === id ? null : state.seccionSeleccionada,
    });
  },

  // ──────────────────────────────────────────────────────────────
  // DUPLICAR SECCIÓN (con todos sus bloques)
  // ──────────────────────────────────────────────────────────────
  duplicarSeccion: (id) => {
    const state = get();
    const secciones = state.plantilla.secciones || [];
    const index = secciones.findIndex((s) => s.id === id);
    if (index < 0) return;

    const original = secciones[index];

    // Clonar con IDs nuevos
    const copia: Seccion = {
      ...original,
      id: newId(),
      nombre: `${original.nombre} (copia)`,
      bloques: original.bloques.map((b) => ({
        ...b,
        id: newId(),
        props: { ...b.props },
        estilos: b.estilos ? { ...b.estilos } : undefined,
      })),
    };

    const nuevas = [...secciones];
    nuevas.splice(index + 1, 0, copia);

    set({
      ...conHistorial(state, { ...state.plantilla, secciones: nuevas }),
      seccionSeleccionada: copia.id,
    });
  },

  // ──────────────────────────────────────────────────────────────
  // MOVER SECCIÓN (reordenar)
  // ──────────────────────────────────────────────────────────────
  moverSeccion: (from, to) => {
    const state = get();
    if (from === to) return;

    const secciones = state.plantilla.secciones || [];
    if (from < 0 || to < 0 || from >= secciones.length || to >= secciones.length)
      return;

    const nuevas = [...secciones];
    const [item] = nuevas.splice(from, 1);
    nuevas.splice(to, 0, item);

    set(conHistorial(state, { ...state.plantilla, secciones: nuevas }));
  },
  // ──────────────────────────────────────────────────────────────
  // TEMA
  // ──────────────────────────────────────────────────────────────
  actualizarTema: (tema) => {
    const state = get();
    set({
      plantilla: {
        ...state.plantilla,
        tema: { ...state.plantilla.tema, ...tema },
      },
    });
  },

  // ──────────────────────────────────────────────────────────────
  // HISTORIAL
  // ──────────────────────────────────────────────────────────────
  undo: () => {
    const state = get();
    if (!state.historial.length) return;
    const prev = state.historial[state.historial.length - 1];
    set({
      plantilla: prev,
      historial: state.historial.slice(0, -1),
      futuro: [clonarPlantilla(state.plantilla), ...state.futuro],
    });
  },

  redo: () => {
    const state = get();
    if (!state.futuro.length) return;
    const [next, ...resto] = state.futuro;
    set({
      plantilla: next,
      historial: [...state.historial, clonarPlantilla(state.plantilla)],
      futuro: resto,
    });
  },

  puedeUndo: () => get().historial.length > 0,
  puedeRedo: () => get().futuro.length > 0,
}));