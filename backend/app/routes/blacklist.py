import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from google.cloud.firestore_v1.field_path import FieldPath
from datetime import datetime, timedelta

from app.firebase import db
from app.dependencies.auth import verificar_admin
from app.utils.blacklist import normalizar_telefono, invalidar_cache

router = APIRouter()


@router.get("/")
def listar_blacklist(
    limit: int = Query(10, ge=1, le=10),
    cursor: Optional[str] = None,   # id (número) del último item de la página anterior
    q: Optional[str] = None,        # prefijo del número
    desde: Optional[str] = None,    # YYYY-MM-DD
    hasta: Optional[str] = None,    # YYYY-MM-DD
    orden: str = Query("reciente"),
    user=Depends(verificar_admin),
):
    base = db.collection("blacklist_numeros")
    q = (q or "").strip()

    if q:
        # Búsqueda por prefijo del número (el número es el id del documento)
        prefijo = re.sub(r"\D", "", q) or q
        query = (
            base.where(FieldPath.document_id(), ">=", base.document(prefijo))
                .where(FieldPath.document_id(), "<=", base.document(prefijo + "\uf8ff"))
                .order_by(FieldPath.document_id())
        )
    else:
        direction = "DESCENDING" if orden == "reciente" else "ASCENDING"
        query = base
        if desde:
            query = query.where("agregadoEn", ">=", desde)
        if hasta:
            query = query.where("agregadoEn", "<=", hasta + "\uf8ff")
        query = query.order_by("agregadoEn", direction=direction)

    # Conteo solo en la primera página (1 lectura por cada 1.000 docs)
    total = None
    if not cursor:
        try:
            total = query.count().get()[0][0].value
        except Exception as e:
            print(f"⚠️ No se pudo contar blacklist: {e}")

    # Cursor = id del último documento (no se salta nada aunque haya fechas iguales)
    if cursor:
        snap = base.document(cursor).get()   # 1 lectura extra desde la página 2
        if not snap.exists:
            return {"items": [], "next_cursor": None, "has_more": False, "total": None}
        query = query.start_after(snap)

    docs = list(query.limit(limit + 1).stream())
    has_more = len(docs) > limit
    docs = docs[:limit]

    # "numero" se arma con el id, porque el documento no tiene ese campo
    items = [{"numero": d.id, **d.to_dict()} for d in docs]
    next_cursor = docs[-1].id if (has_more and docs) else None

    return {"items": items, "next_cursor": next_cursor, "has_more": has_more, "total": total}


@router.post("/")
def agregar_a_blacklist(
    numero: str,
    motivo: str = "",
    user=Depends(verificar_admin)
):
    numero_limpio = normalizar_telefono(numero)

    if len(numero_limpio) != 10 or not numero_limpio.startswith("09"):
        raise HTTPException(status_code=400, detail="Número inválido")

    hora_ecuador = datetime.utcnow() - timedelta(hours=5)

    db.collection("blacklist_numeros").document(numero_limpio).set({
        "motivo": motivo,
        "agregadoEn": hora_ecuador.isoformat(),
    })

    invalidar_cache()
    return {"ok": True, "numero": numero_limpio}


@router.delete("/{numero}")
def quitar_de_blacklist(numero: str, user=Depends(verificar_admin)):
    numero_limpio = normalizar_telefono(numero)

    doc_ref = db.collection("blacklist_numeros").document(numero_limpio)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="Número no está en la blacklist")

    doc_ref.delete()
    invalidar_cache()
    return {"ok": True, "numero": numero_limpio}