from pydantic import BaseModel
from typing import Optional

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

    imagen: Optional[str] = ""
    event_id: Optional[str] = None