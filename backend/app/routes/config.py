from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

from app.firebase import db
from app.schemas.config import ConfigUpdate, ConfigOut
from app.dependencies.auth import verificar_admin

router = APIRouter()

DOC_PATH = ("config", "general")


def _get_config_dict() -> dict:
    doc = db.collection(DOC_PATH[0]).document(DOC_PATH[1]).get()
    if not doc.exists:
        return {}
    return doc.to_dict() or {}


# Reemplaza la parte de correos_notificacion en obtener_config y actualizar_config con esto:

@router.get("", response_model=ConfigOut)
def obtener_config():
    data = _get_config_dict()
    
    # Si no hay correos guardados, ponemos 3 vacíos por defecto
    correos = data.get("correos_notificacion")
    if not correos or len(correos) == 0:
        correos = ["", "", ""]
    
    # Nos aseguramos de que siempre haya 3 (rellenamos con vacíos)
    while len(correos) < 3:
        correos.append("")

    return ConfigOut(
        nombre_tienda=data.get("nombre_tienda") or "Lunio Store",
        logo_url=data.get("logo_url"),
        correos_notificacion=correos[:3], # Limitamos a 3
    )

@router.put("", response_model=ConfigOut)
def actualizar_config(
    payload: ConfigUpdate,
    user=Depends(verificar_admin),
):
    data = payload.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="Nada que actualizar")

    if "nombre_tienda" in data:
        nombre = (data["nombre_tienda"] or "").strip()
        if not nombre:
            raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
        data["nombre_tienda"] = nombre

    if "logo_url" in data and data["logo_url"] is not None:
        data["logo_url"] = data["logo_url"].strip() or None

    # Limpiamos y limitamos a 3
    if "correos_notificacion" in data and data["correos_notificacion"] is not None:
        correos_limpios = [c.strip() for c in data["correos_notificacion"] if c.strip()]
        # Si quedan menos de 3 después de limpiar, no importa, se guardan los que haya
        data["correos_notificacion"] = correos_limpios[:3]

    data["actualizadoEn"] = datetime.utcnow().isoformat()

    ref = db.collection(DOC_PATH[0]).document(DOC_PATH[1])
    ref.set(data, merge=True)

    merged = _get_config_dict()
    correos_finales = merged.get("correos_notificacion") or ["", "", ""]
    while len(correos_finales) < 3:
        correos_finales.append("")

    return ConfigOut(
        nombre_tienda=merged.get("nombre_tienda") or "Lunio Store",
        logo_url=merged.get("logo_url"),
        correos_notificacion=correos_finales[:3],
    )