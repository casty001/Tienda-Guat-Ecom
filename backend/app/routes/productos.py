from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from google.cloud.firestore import DELETE_FIELD
import unicodedata
import uuid
import time

from app.firebase import db
from app.utils.resenas import generar_resenas
from app.schemas.producto import ProductoCreate, ProductoUpdate
from app.dependencies.auth import verificar_admin

router = APIRouter()

# ═══════════════════════════════════════════════════════════════
# CACHÉ EN MEMORIA (solo resúmenes livianos para la lista/buscador)
# ═══════════════════════════════════════════════════════════════
_cache_productos = {"data": None, "timestamp": 0.0}
CACHE_TTL = 60  # segundos


def _invalidar_cache():
    _cache_productos["data"] = None


def _norm(texto):
    """Minúsculas y sin tildes, para comparar."""
    t = unicodedata.normalize("NFD", str(texto or ""))
    return "".join(c for c in t if unicodedata.category(c) != "Mn").lower()


def _cargar_resumenes():
    ahora = time.time()
    if (
        _cache_productos["data"] is None
        or ahora - _cache_productos["timestamp"] > CACHE_TTL
    ):
        docs = (
            db.collection("productos")
            .select(["nombre", "precio", "precioAntes", "imagen", "activo", "creadoEn"])
            .stream()
        )
        lista = []
        for d in docs:
            x = d.to_dict() or {}
            if not x.get("activo", True):
                continue
            nombre = x.get("nombre") or ""
            lista.append(
                {
                    "id": d.id,
                    "nombre": nombre,
                    "precio": x.get("precio"),
                    "precioAntes": x.get("precioAntes"),
                    "imagen": x.get("imagen"),
                    "_norm": _norm(nombre),
                    "_creado": x.get("creadoEn") or "",
                }
            )
        lista.sort(key=lambda p: p["_creado"], reverse=True)
        _cache_productos["data"] = lista
        _cache_productos["timestamp"] = ahora
    return _cache_productos["data"]


# ═══════════════════════════════════════════════════════════════
# LISTAR (paginado + buscador)
# ═══════════════════════════════════════════════════════════════
@router.get("")
def listar_productos(
    limit: int = Query(10, ge=1, le=50),
    start_after: str = None,
    search: str = None,
):
    productos = _cargar_resumenes()

    # Buscador: sin mayúsculas, sin tildes, partes de palabra, varias palabras
    if search and search.strip():
        palabras = _norm(search).split()
        productos = [p for p in productos if all(w in p["_norm"] for w in palabras)]

    inicio = 0
    if start_after:
        ids = [p["id"] for p in productos]
        if start_after not in ids:
            return {"items": [], "next_cursor": None}
        inicio = ids.index(start_after) + 1

    pagina = productos[inicio : inicio + limit]
    items = [{k: v for k, v in p.items() if not k.startswith("_")} for p in pagina]
    tiene_mas = inicio + limit < len(productos)

    return {
        "items": items,
        "next_cursor": items[-1]["id"] if tiene_mas and items else None,
    }


# ═══════════════════════════════════════════════════════════════
# OBTENER UNO
# ═══════════════════════════════════════════════════════════════
@router.get("/{producto_id}")
def obtener_producto(producto_id: str):
    doc = db.collection("productos").document(producto_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    data = doc.to_dict()
    if not data.get("activo", True):
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"id": doc.id, **data}


# ═══════════════════════════════════════════════════════════════
# CREAR
# ═══════════════════════════════════════════════════════════════
@router.post("")
def crear_producto(producto: ProductoCreate, user=Depends(verificar_admin)):
    data = producto.model_dump()
    data["nombre_lower"] = (data.get("nombre") or "").lower()
    data["activo"] = True

    if data.get("mostrarResenas"):
        data["resenas"] = generar_resenas(8)
    else:
        data["resenas"] = []

    data["creadoEn"] = datetime.now(timezone.utc).isoformat()
    data["actualizadoEn"] = data["creadoEn"]

    ref = db.collection("productos").add(data)
    _invalidar_cache()

    return {"ok": True, "id": ref[1].id}


# ═══════════════════════════════════════════════════════════════
# DUPLICAR
# ═══════════════════════════════════════════════════════════════
def _regenerar_ids(plantilla):
    """Da IDs nuevos a los bloques. Si algo viene raro, lo deja como está."""
    if not isinstance(plantilla, dict):
        return plantilla

    def _bloques(lista):
        for b in lista or []:
            if isinstance(b, dict):
                b["id"] = str(uuid.uuid4())

    _bloques(plantilla.get("bloques"))
    for s in plantilla.get("secciones") or []:
        if isinstance(s, dict):
            s["id"] = str(uuid.uuid4())
            _bloques(s.get("bloques"))
    return plantilla


@router.post("/{producto_id}/duplicar")
def duplicar_producto(producto_id: str, user=Depends(verificar_admin)):
    doc = db.collection("productos").document(producto_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    data = doc.to_dict() or {}
    if not data.get("activo", True):
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Campos que no deben heredarse
    for k in ("creadoEn", "actualizadoEn", "eliminadoEn"):
        data.pop(k, None)

    ahora = datetime.now(timezone.utc).isoformat()
    data["nombre"] = f"{data.get('nombre', '')} (Copia)"
    data["nombre_lower"] = data["nombre"].lower()
    data["activo"] = True
    data["plantilla"] = _regenerar_ids(data.get("plantilla"))
    data["creadoEn"] = ahora
    data["actualizadoEn"] = ahora

    _, ref = db.collection("productos").add(data)
    _invalidar_cache()

    return {
        "ok": True,
        "id": ref.id,
        "producto": {
            "id": ref.id,
            "nombre": data["nombre"],
            "precio": data.get("precio"),
            "precioAntes": data.get("precioAntes"),
            "imagen": data.get("imagen"),
        },
    }


# ═══════════════════════════════════════════════════════════════
# EDITAR
# ═══════════════════════════════════════════════════════════════
@router.patch("/{producto_id}")
def editar_producto(
    producto_id: str,
    producto: ProductoUpdate,
    user=Depends(verificar_admin),
):
    ref = db.collection("productos").document(producto_id)
    doc = ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existente = doc.to_dict() or {}
    data = producto.model_dump(exclude_unset=True)

    if data.get("nombre"):
        data["nombre_lower"] = data["nombre"].lower()

    # Solo genera reseñas si no hay ni en el request ni guardadas
    if "mostrarResenas" in data:
        if data.get("mostrarResenas"):
            if not data.get("resenas") and not existente.get("resenas"):
                data["resenas"] = generar_resenas(8)
        else:
            data["resenas"] = []

    data["actualizadoEn"] = datetime.now(timezone.utc).isoformat()

    # None -> borrar el campo en Firestore
    for k, v in list(data.items()):
        if v is None:
            data[k] = DELETE_FIELD

    ref.update(data)
    _invalidar_cache()

    return {"ok": True, "actualizado": list(data.keys())}


# ═══════════════════════════════════════════════════════════════
# ELIMINAR (lógico)
# ═══════════════════════════════════════════════════════════════
@router.delete("/{producto_id}")
def eliminar_producto(producto_id: str, user=Depends(verificar_admin)):
    ref = db.collection("productos").document(producto_id)
    doc = ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    ref.update(
        {"activo": False, "eliminadoEn": datetime.now(timezone.utc).isoformat()}
    )
    _invalidar_cache()

    return {"ok": True}