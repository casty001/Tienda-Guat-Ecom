from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from google.api_core.exceptions import NotFound

from app.utils.tiktok import (
    enviar_place_order
)

from app.utils.meta import (
    enviar_purchase_meta
)
from app.utils.email import enviar_correo_pedido

from datetime import datetime, timedelta

from app.firebase import db

from app.schemas.pedido import (
    PedidoCreate
)

from app.dependencies.auth import (
    verificar_admin
)

from app.utils.blacklist import esta_en_blacklist, normalizar_telefono

router = APIRouter()
ESTADOS_VALIDOS = ["pendiente", "aceptado", "guia_enviada", "entregado", "cancelado"]

@router.post("/")
def crear_pedido(
    pedido: PedidoCreate,
    request: Request
):
    data = pedido.model_dump()
    data["estado"] = "pendiente"

    hora_colombia = datetime.utcnow() - timedelta(hours=5)
    data["creadoEn"] = hora_colombia.isoformat()

    bloqueado = esta_en_blacklist(data.get("telefono", ""))
    data["blacklisted"] = bloqueado
    data["estado"] = "cancelado" if bloqueado else "pendiente"

    ref = db.collection("pedidos").add(data)
    pedido_id = ref[1].id

    request_meta = {
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
    }

    if not bloqueado:
        try:
            enviar_place_order(data, request_meta)
        except Exception as e:
            print(f"⚠️ Error con TikTok: {e}")

        try:
            enviar_purchase_meta(data, request_meta)
        except Exception as e:
            print(f"⚠️ Error con Meta CAPI: {e}")

        try:
            enviar_correo_pedido(data, pedido_id)
        except Exception as e:
            print(f"⚠️ Error con correo: {e}")
    else:
        print(f"🚫 Pedido {pedido_id} bloqueado por blacklist, no se envían píxeles ni correo")

    return {
        "ok": True,
        "id": pedido_id,
        "bloqueado": bloqueado,
    }


@router.get("/")
def listar_pedidos(
    limit: int = Query(10, ge=1, le=50),
    cursor: Optional[str] = None,  # creadoEn del último pedido de la página anterior
    user=Depends(verificar_admin),
):
    query = db.collection("pedidos").order_by(
        "creadoEn", direction="DESCENDING"
    )

    if cursor:
        query = query.start_after({"creadoEn": cursor})

    # limit+1 para saber si hay otra página (1 lectura extra)
    docs = list(query.limit(limit + 1).stream())

    has_more = len(docs) > limit
    docs = docs[:limit]

    items = [{"id": d.id, **d.to_dict()} for d in docs]
    next_cursor = items[-1].get("creadoEn") if (has_more and items) else None

    # El total solo se cuenta en la primera página (1 lectura por cada 1.000 pedidos)
    total = None
    if not cursor:
        try:
            total = db.collection("pedidos").count().get()[0][0].value
        except Exception as e:
            print(f"⚠️ No se pudo contar pedidos: {e}")

    return {
        "items": items,
        "next_cursor": next_cursor,
        "has_more": has_more,
        "total": total,
    }

@router.patch("/{pedido_id}/estado")
def cambiar_estado(
    pedido_id: str,
    estado: str,
    user=Depends(verificar_admin)
):
    if estado not in ESTADOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail="Estado inválido"
        )

    hora_colombia = datetime.utcnow() - timedelta(hours=5)

    try:
        # update() lanza NotFound si no existe, así no hace falta un get() antes
        db.collection("pedidos").document(pedido_id).update({
            "estado": estado,
            "actualizadoEn": hora_colombia.isoformat()
        })
    except NotFound:
        raise HTTPException(
            status_code=404,
            detail="Pedido no encontrado"
        )

    return {"ok": True}