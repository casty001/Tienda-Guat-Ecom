from pydantic import BaseModel
from typing import Optional


class ImagenesLanding(BaseModel):
    imagen1: Optional[str] = ""
    imagen2: Optional[str] = ""
    imagen3: Optional[str] = ""
    imagen4: Optional[str] = ""
    imagen5: Optional[str] = ""

class PreguntaFrecuente(BaseModel):
    pregunta: str = ""
    respuesta: str = ""


class Resena(BaseModel):
    nombre: str = ""
    ciudad: str = ""
    resena: str = ""
    puntuacion: int = 5
    fecha: str = ""
    verificado: bool = True

class Precio2Opcional(BaseModel):
    activo: bool = False
    precio: float = 0
    precioAntes: float = 0
class ProductoCreate(BaseModel):
    nombre: str
    precio: float
    precioAntes: Optional[float] = 0
    imagen: str
    precio2: Optional[Precio2Opcional] = Precio2Opcional()

    imagenesLanding: Optional[ImagenesLanding] = ImagenesLanding()

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

    mostrarResenas: bool = True
    resenas: list[Resena] = []

    preguntasFrecuentes: list[PreguntaFrecuente] = []