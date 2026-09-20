from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re

class PedidoCreate(BaseModel):
    nombre: str
    telefono: str
    departamento: Optional[str] = ""
    ciudad: str
    direccion: str
    referencia: Optional[str] = ""
    productoId: str
    productoNombre: str
    precio: float
    precioBase: Optional[float] = None           # 👈 NUEVO
    costoEnvio: Optional[float] = 0              # 👈 NUEVO
    envioPrioritario: Optional[bool] = False     # 👈 NUEVO
    opcionIndex: Optional[int] = Field(default=None, ge=0, le=10)  # 👈 NUEVO
    opcionSeleccionadaTitulo: Optional[str] = "" # 👈 NUEVO
    imagen: Optional[str] = ""
    event_id: Optional[str] = None
    fbp: Optional[str] = None
    fbc: Optional[str] = None
    ttclid: Optional[str] = None
    anonId: Optional[str] = None
    url: Optional[str] = None

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, v: str) -> str:
        limpio = re.sub(r"\D", "", v or "")

        # normaliza para validar
        if limpio.startswith("593"):
            limpio = "0" + limpio[3:]
        elif len(limpio) == 9 and limpio.startswith("9"):
            limpio = "0" + limpio

        if len(limpio) != 10 or not limpio.startswith("09"):
            raise ValueError(
                "Digita correctamente tu numero de telefono"
            )
        return v  # guarda el valor original tal como lo mandó el usuario