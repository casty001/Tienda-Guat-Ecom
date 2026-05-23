from pydantic import BaseModel
from typing import Optional

class ImagenesLanding(BaseModel):
    imagen1: Optional[str] = ""
    imagen2: Optional[str] = ""
    imagen3: Optional[str] = ""
    imagen4: Optional[str] = ""

class ProductoCreate(BaseModel):
    nombre: str

    precio: float

    precioAntes: Optional[float] = 0

    imagen: str

    imagenesLanding: Optional[
        ImagenesLanding
    ] = ImagenesLanding()
    mostrarContador: bool = True
    minutosContador: int = 28

    mostrarEstrellas: bool = True
    textoEstrellas: str = "+100.000 clientes satisfechos"

    textoBoton: str = "COMPRAR AHORA Y PAGAR AL RECIBIR"
    activo: bool = True
    mostrarInfoCompra: bool = True
    textoDescuento: str = "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS"
    queIncluye: str = ""
    informacionEnvio: str = ""
    devolucionesReembolsos: str = ""