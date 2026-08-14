from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta

from app.firebase import db
from app.dependencies.auth import verificar_admin
from app.utils.blacklist import normalizar_telefono, invalidar_cache

router = APIRouter()


@router.get("/")
def listar_blacklist(user=Depends(verificar_admin)):
    docs = db.collection("blacklist_numeros").stream()
    return [{"numero": d.id, **d.to_dict()} for d in docs]


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
