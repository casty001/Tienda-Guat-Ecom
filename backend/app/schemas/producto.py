from typing import Literal, Optional
from pydantic import BaseModel, Field

# ═══════════════════════════════════════════════════════════════
# 🆕 SISTEMA DE BLOQUES (estilo Shopify)
# ═══════════════════════════════════════════════════════════════

class NavLink(BaseModel):
    label: str = ""
    href: str = ""


class Nav(BaseModel):
    mostrar: bool = True
    logoUrl: str = "/logo.svg"
    logoAltura: int = 40
    colorFondo: str = "#ffffff"
    colorIconos: str = "#000000"
    mostrarHamburguesa: bool = True
    links: list[NavLink] = Field(default_factory=list)   # 👈 preparado para el paso 2


class Bloque(BaseModel):
    id: str
    tipo: str
    props: dict = Field(default_factory=dict)
    estilos: dict = Field(default_factory=dict)   # 👈 NUEVO — el editor ya lo manda


class Tema(BaseModel):
    colorPrimario: str = "#cb1515"
    colorFondo: str = "#ffffff"
    tipografia: str = "Inter"
    anchoMax: int = 480
    nav: Nav = Field(default_factory=Nav)   # 👈 NUEVO


class AjustesSeccion(BaseModel):
    ancho: Literal["fill", "ajustar"] = "fill"
    anchoMax: int = 480
    colorFondo: Optional[str] = None
    radioEsquinas: int = 0
    paddingArriba: int = 0
    paddingAbajo: int = 0
    paddingLados: int = 0


class Seccion(BaseModel):
    id: str
    tipo: str   # "header" | "producto" | "compra" | "testimonios" | "faq" | "custom"
    nombre: str = ""
    visible: bool = True
    colapsada: bool = False
    bloques: list[Bloque] = Field(default_factory=list)
    ajustes: AjustesSeccion = Field(default_factory=AjustesSeccion)


class Plantilla(BaseModel):
    version: int = 3
    bloques: list[Bloque] = Field(default_factory=list)   # legacy
    secciones: list[Seccion] = Field(default_factory=list)
    tema: Tema = Field(default_factory=Tema)

# ═══════════════════════════════════════════════════════════════
# SCHEMA EXISTENTE (tal cual lo tenías)
# ═══════════════════════════════════════════════════════════════

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
    subtituloModal: str = (
        "Por alta demanda, este pedido se reserva por pocos minutos. "
        "Finaliza tu compra antes de que se agote."
    )

    mostrarTextoImportanteModal: bool = True
    textoImportanteModal: str = (
        "⚡IMPORTANTE⚡\n"
        "📲Confirmar tu pedido por WPP para poder enviarle\n"
        "📍Si prefieres retirar en Servientrega, solicita por WPP"
    )

    beneficiosChecklist: list[BeneficioChecklist] = Field(
        default_factory=list
    )
    ordenSecciones: list[str] = Field(default_factory=lambda: [
        "banner_contador",
        "barra_estrellas",
        "galeria_y_compra",
        "faqs",
        "resenas",
    ])


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

    # 🆕 campos nuevos — ahora sí funcionan porque Plantilla está arriba
    plantilla: Optional[Plantilla] = None
    plantillaPublicada: Optional[Plantilla] = None
    schemaVersion: int = 1


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

    # 🆕 campos nuevos
    plantilla: Optional[Plantilla] = None
    plantillaPublicada: Optional[Plantilla] = None
    schemaVersion: Optional[int] = None