from typing import Optional, List  # 👈 Agrega List aquí
from pydantic import BaseModel, Field

class ConfigUpdate(BaseModel):
    nombre_tienda: Optional[str] = Field(default=None, max_length=80)
    logo_url: Optional[str] = None
    correos_notificacion: Optional[List[str]] = None

class ConfigOut(BaseModel):
    nombre_tienda: str = "Lunio Store"
    logo_url: Optional[str] = None
    correos_notificacion: List[str] = []