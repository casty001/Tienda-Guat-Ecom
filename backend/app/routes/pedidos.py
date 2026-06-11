from fastapi import (
    APIRouter,
    HTTPException,
    Depends
)

from app.utils.tiktok import (
    enviar_place_order
)

from app.utils.meta import (
    enviar_purchase_meta
)

from datetime import datetime

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
    pedido: PedidoCreate
):

    data = pedido.model_dump()

    data["estado"] = "pendiente"

    data["creadoEn"] = (
        datetime.utcnow().isoformat()
    )

    ref = (
        db.collection("pedidos")
        .add(data)
    )

    enviar_place_order(data)

    enviar_purchase_meta(data)

    return {
        "ok": True,
        "id": ref[1].id
    }

@router.get("/")
def listar_pedidos(
    user=Depends(verificar_admin)
):

    docs = (
        db.collection("pedidos")
        .order_by(
            "creadoEn",
            direction="DESCENDING"
        )
        .stream()
    )

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

    if estado not in [
        "pendiente",
        "aceptado",
        "cancelado"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Estado inválido"
        )

    ref = (
        db.collection("pedidos")
        .document(pedido_id)
    )

    doc = ref.get()

    if not doc.exists:
        raise HTTPException(
            status_code=404,
            detail="Pedido no encontrado"
        )

    ref.update({
        "estado": estado,
        "actualizadoEn":
            datetime.utcnow().isoformat()
    })

    return {"ok": True}