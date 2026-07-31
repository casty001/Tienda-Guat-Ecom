from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    Request   # 👈 nuevo import
)

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

router = APIRouter()

@router.post("/")
def crear_pedido(
    pedido: PedidoCreate,
    request: Request   # 👈 nuevo parámetro
):
    data = pedido.model_dump()
    data["estado"] = "pendiente"
    
    hora_colombia = datetime.utcnow() - timedelta(hours=5)
    data["creadoEn"] = hora_colombia.isoformat()

    ref = db.collection("pedidos").add(data)
    pedido_id = ref[1].id

    request_meta = {
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
    }

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

    return {
        "ok": True,
        "id": pedido_id
    }

@router.get("/")
def listar_pedidos(
    user=Depends(verificar_admin)
):
    docs = db.collection("pedidos")\
        .order_by("creadoEn", direction="DESCENDING")\
        .stream()

    return [
        {"id": doc.id, **doc.to_dict()}
        for doc in docs
    ]

@router.patch("/{pedido_id}/estado")
def cambiar_estado(
    pedido_id: str,
    estado: str,
    user=Depends(verificar_admin)
):
    if estado not in ["pendiente", "aceptado", "cancelado"]:
        raise HTTPException(
            status_code=400,
            detail="Estado inválido"
        )

    ref = db.collection("pedidos").document(pedido_id)
    doc = ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=404,
            detail="Pedido no encontrado"
        )
    
    hora_colombia = datetime.utcnow() - timedelta(hours=5)
    ref.update({
        "estado": estado,
        "actualizadoEn": hora_colombia.isoformat()
    })

    return {"ok": True}