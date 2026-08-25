from typing import Literal, Optional

from pydantic import BaseModel, Field


class ImagenesLanding(BaseModel):
    imagen1: str = ""
    imagen2: str = ""
    imagen3: str = ""
    imagen4: str = ""
    imagen5: str = ""

class PreguntaFrecuente(BaseModel):
    pregunta: str = ""
    respuesta: str = ""

class Resena(BaseModel):
    nombre: str = ""
    ciudad: str = ""
    resena: str = ""
    puntuacion: float = 5
    fecha: str = ""
    verificado: bool = True

class Precio2Opcional(BaseModel):
    activo: bool = False
    precio: float = 0
    precioAntes: float = 0

class BeneficioChecklist(BaseModel):
    titulo: str = ""
    descripcion: str = ""

class ConfigDiseno(BaseModel):
    mostrarContador: bool = True
    minutosContador: int = 28

    # 🎨 NUEVO: color del banner del contador, editable desde el admin (hex, ej. "#E06000")
    colorBanner: str = "#E06000"

    mostrarEstrellas: bool = True
    textoEstrellas: str = "+100.000 clientes satisfechos"

    textoBoton: str = "COMPRAR AHORA Y PAGAR AL RECIBIR"

    mostrarInfoCompra: bool = True
    textoDescuento: str = (
        "POR HOY CON EL 50% DE DESCUENTO + ENVÍO GRATIS"
    )
    queIncluye: str = ""
    informacionEnvio: str = ""
    devolucionesReembolsos: str = ""

    mostrarOrdenesHoy: bool = True
    ordenesHoy: int = 137

    mostrarOpinionesVerificadas: bool = True
    opinionesVerificadasCount: int = 1247

    caracteristicasDestacadas: str = ""

    mostrarSubtituloModal: bool = True
    subtituloModal: str = "Por alta demanda, este pedido se reserva por pocos minutos. Finaliza tu compra antes de que se agote."

    mostrarTextoImportanteModal: bool = True
    textoImportanteModal: str = "⚡IMPORTANTE⚡\n📲Confirmar tu pedido por WPP para poder enviarle\n📍Si prefieres retirar en Servientrega, solicita por WPP"

    beneficiosChecklist: list[BeneficioChecklist] = Field(
        default_factory=list
    )
class ProductoCreate(BaseModel):

    nombre: str

    precio: float

    precioAntes: float = 0

    imagen: str

    precio2: Precio2Opcional = Field(
        default_factory=Precio2Opcional
    )

    textoOferta1: str = "1 Unidad + Regalo"

    textoOferta2: str = "2 Unidades + Regalo"

    imagenesLanding: ImagenesLanding = Field(
        default_factory=ImagenesLanding
    )
    mostrarResenas: bool = True

    resenas: list[Resena] = Field(
        default_factory=list
    )

    preguntasFrecuentes: list[PreguntaFrecuente] = Field(
        default_factory=list
    )
    activo: bool = True
    disenoLanding: Literal["clasico", "moderno"] = "clasico"

    disenoClasico: ConfigDiseno = Field(
        default_factory=ConfigDiseno
    )

    disenoModerno: ConfigDiseno = Field(
        default_factory=ConfigDiseno
    )

class ProductoUpdate(BaseModel):

    nombre: Optional[str] = None

    precio: Optional[float] = None

    precioAntes: Optional[float] = None

    imagen: Optional[str] = None

    precio2: Optional[Precio2Opcional] = None

    textoOferta1: Optional[str] = None

    textoOferta2: Optional[str] = None

    imagenesLanding: Optional[ImagenesLanding] = None

    mostrarResenas: Optional[bool] = None

    resenas: Optional[list[Resena]] = None

    preguntasFrecuentes: Optional[list[PreguntaFrecuente]] = None

    activo: Optional[bool] = None

    disenoLanding: Optional[
        Literal["clasico", "moderno"]
    ] = None

    disenoClasico: Optional[ConfigDiseno] = None

    disenoModerno: Optional[ConfigDiseno] = None