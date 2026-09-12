from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime

from app.firebase import db
from app.utils.resenas import generar_resenas
from app.schemas.producto import ProductoCreate, ProductoUpdate
from app.dependencies.auth import verificar_admin

router = APIRouter()


@router.get("")
def listar_productos():
    docs = db.collection("productos").where("activo", "==", True).stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


@router.get("/{producto_id}")
def obtener_producto(producto_id: str):
    doc = db.collection("productos").document(producto_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"id": doc.id, **doc.to_dict()}


@router.post("")
def crear_producto(producto: ProductoCreate, user=Depends(verificar_admin)):
    data = producto.model_dump()

    if data.get("mostrarResenas"):
        data["resenas"] = generar_resenas(8)
    else:
        data["resenas"] = []

    data["creadoEn"] = datetime.utcnow().isoformat()

    ref = db.collection("productos").add(data)
    return {"ok": True, "id": ref[1].id}


@router.patch("/{producto_id}")
def editar_producto(
    producto_id: str,
    producto: ProductoUpdate,
    user=Depends(verificar_admin)
):
    ref = db.collection("productos").document(producto_id)
    doc = ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    data = producto.model_dump(exclude_unset=True)

    if "mostrarResenas" in data:
        if data.get("mostrarResenas"):
            if not data.get("resenas"):
                data["resenas"] = generar_resenas(8)
        else:
            data["resenas"] = []

    data["actualizadoEn"] = datetime.utcnow().isoformat()

    ref.update(data)

    return {"ok": True, "actualizado": list(data.keys())}


@router.delete("/{producto_id}")
def eliminar_producto(producto_id: str, user=Depends(verificar_admin)):
    ref = db.collection("productos").document(producto_id)
    doc = ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    ref.update({"activo": False, "eliminadoEn": datetime.utcnow().isoformat()})
    return {"ok": True}