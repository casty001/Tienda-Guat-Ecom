import base64
import hashlib
import json
import os
import re
import secrets
import unicodedata

from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from google.api_core.exceptions import NotFound
from google.cloud import firestore
from pydantic import BaseModel, Field

from app.firebase import db

from app.utils.tiktok import enviar_place_order
from app.utils.meta import enviar_purchase_meta
from app.utils.email import enviar_correo_pedido

from app.utils.mensajes_whatsapp import (
    PLANTILLAS_POR_DEFECTO,
    cargar_plantillas,
    renderizar_plantilla,
    validar_plantilla,
)
from app.schemas.pedido import PedidoCreate, PedidoDespacho

from app.dependencies.auth import verificar_admin

from app.utils.blacklist import esta_en_blacklist, normalizar_telefono

router = APIRouter()

ESTADOS_VALIDOS = ["pendiente", "aceptado", "guia_enviada", "entregado", "cancelado"]
def normalizar_nombre(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", str(texto or ""))

    # Quitar tildes y otros signos diacríticos.
    texto = "".join(
        caracter
        for caracter in texto
        if not unicodedata.combining(caracter)
    )

    texto = texto.casefold()

    # Eliminar apóstrofes sin separar la palabra.
    texto = re.sub(r"['’`´]", "", texto)

    # Sustituir otros signos por espacios.
    texto = re.sub(r"[^a-z0-9\s]", " ", texto)

    # Eliminar espacios duplicados.
    return " ".join(texto.split())

class ConfiguracionNotificaciones(BaseModel):
    extensionActiva: bool = False
    notificarAceptado: bool = False
    notificarGuia: bool = False


def leer_configuracion_notificaciones(transaction=None):
    ref = db.collection("configuracion").document("whatsapp")
    snap = ref.get(transaction=transaction)
    datos = snap.to_dict() or {}
    return {
        "extensionActiva": datos.get("extensionActiva") is True,
        "notificarAceptado": datos.get("notificarAceptado") is True,
        "notificarGuia": datos.get("notificarGuia") is True,
    }


def notificacion_permitida(config, tipo):
    if not config["extensionActiva"]:
        return False
    if tipo == "aceptado":
        return config["notificarAceptado"]
    if tipo == "guia_enviada":
        return config["notificarGuia"]
    return False


def _limpiar_none(obj):
    if isinstance(obj, dict):
        return {k: _limpiar_none(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [_limpiar_none(v) for v in obj]
    return obj


# ───────────────────────── CREAR PEDIDO ─────────────────────────
@router.post("/")
def crear_pedido(pedido: PedidoCreate, request: Request):
    data = pedido.model_dump()
    data["estado"] = "pendiente"

    hora_colombia = datetime.utcnow() - timedelta(hours=5)
    data["creadoEn"] = hora_colombia.isoformat()

    bloqueado = esta_en_blacklist(data.get("telefono", ""))
    data["blacklisted"] = bloqueado
    data["estado"] = "cancelado" if bloqueado else "pendiente"

    # Copia solo para Firestore: el tracking usa "data", que no se toca.
    data_firestore = {
    **data,
    "nombreLower": normalizar_nombre(data.get("nombre", "")),
    "telefonoNormalizado": normalizar_telefono(data.get("telefono", "")),
}
    data_firestore = _limpiar_none(data_firestore)

    ref = db.collection("pedidos").add(data_firestore)
    pedido_id = ref[1].id

    request_meta = {
        "ip": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
    }

    if not bloqueado:
        try:
            enviar_place_order(data, request_meta)
        except Exception as e:
            print(f"⚠️ Error con TikTok: {e}")

        try:
            enviar_purchase_meta(data, request_meta)
        except Exception as e:
            print(f"⚠️ Error con Meta CAPI: {e}")

        try:
            enviar_correo_pedido(data, pedido_id)
        except Exception as e:
            print(f"⚠️ Error con correo: {e}")
    else:
        print(
            f"🚫 Pedido {pedido_id} bloqueado por blacklist, no se envían píxeles ni correo"
        )

    return {"ok": True, "id": pedido_id, "bloqueado": bloqueado}


# ───────── LISTAR Y BUSCAR: SOLO CAMPOS EXISTENTES, SIN ESCRITURAS ─────────
# El cursor incluye campo ordenado y ID para no leer el documento del cursor.
def _codificar_cursor(valor: str, doc_id: str) -> str:
    raw = json.dumps([valor, doc_id], ensure_ascii=True, separators=(",", ":"))
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def _decodificar_cursor(cursor: str) -> tuple[str, str]:
    try:
        decoded = base64.urlsafe_b64decode(cursor + "=" * (-len(cursor) % 4))
        valor, doc_id = json.loads(decoded.decode())
        if not isinstance(valor, str) or not isinstance(doc_id, str):
            raise ValueError()
        if not re.fullmatch(r"[A-Za-z0-9_-]{6,150}", doc_id):
            raise ValueError()
        return valor, doc_id
    except (ValueError, UnicodeDecodeError, TypeError, json.JSONDecodeError):
        raise HTTPException(422, "Cursor inválido")


def _consultar_pedidos(
    q: str = "",
    tipo: str = "nombre",
    estado: str = "todos",
    cursor: Optional[str] = None,
):
    consulta = db.collection("pedidos")
    if estado != "todos":
        if estado not in ESTADOS_VALIDOS:
            raise HTTPException(422, "Estado inválido")
        consulta = consulta.where("estado", "==", estado)

   
    q = q.strip()

    if q and tipo == "id":
        if not (1 <= len(q) <= 150) or "/" in q or q in (".", ".."):
            raise HTTPException(422, "ID de pedido inválido")

        doc = db.collection("pedidos").document(q).get()

        if not doc.exists:
            return {
                "items": [],
                "has_more": False,
                "next_cursor": None,
                "total": None,
            }

        data = doc.to_dict() or {}

        if estado != "todos" and data.get("estado") != estado:
            return {
                "items": [],
                "has_more": False,
                "next_cursor": None,
                "total": None,
            }

        return {
            "items": [{"id": doc.id, **data}],
            "has_more": False,
            "next_cursor": None,
            "total": None,
        }

    if q:
        if tipo == "nombre":
            prefijo = normalizar_nombre(q)

            if not 3 <= len(prefijo) <= 60:
                raise HTTPException(
                    422, "Introduce al menos 3 caracteres de nombre"
                )

            campo = "nombreLower"

        elif tipo == "telefono":
            prefijo = re.sub(r"\D", "", q)

            if not 4 <= len(prefijo) <= 18:
                raise HTTPException(
                    422,
                    "Introduce entre 4 y 18 dígitos"
                )

            # Permitir buscar celulares ecuatorianos sin el 0 inicial.
            if prefijo.startswith("9") and not prefijo.startswith("09"):
                prefijo = "0" + prefijo

            campo = "telefonoNormalizado"

        else:
            raise HTTPException(422, "Tipo de búsqueda inválido")

        consulta = (
            consulta.where(campo, ">=", prefijo)
            .where(campo, "<", prefijo + "\uf8ff")
            .order_by(campo, direction=firestore.Query.ASCENDING)
        )

    else:
        campo = "creadoEn"
        consulta = consulta.order_by(
            campo, direction=firestore.Query.DESCENDING
        )

    consulta = consulta.order_by(
        "__name__",
        direction=(firestore.Query.ASCENDING if q else firestore.Query.DESCENDING),
    )

    if cursor:
        valor, doc_id = _decodificar_cursor(cursor)
        consulta = consulta.start_after(
            [valor, db.collection("pedidos").document(doc_id)]
        )

    docs = list(consulta.limit(11).stream())
    visibles = docs[:10]
    ultimo = visibles[-1] if visibles else None
    return {
        "items": [{"id": d.id, **d.to_dict()} for d in visibles],
        "has_more": len(docs) > 10,
        "next_cursor": (
            _codificar_cursor((ultimo.to_dict() or {}).get(campo, ""), ultimo.id)
            if len(docs) > 10 and ultimo
            else None
        ),
        "total": None,
    }


@router.get("/")
def listar_pedidos(
    limit: int = Query(10, ge=10, le=10),
    cursor: Optional[str] = Query(None, max_length=400),
    estado: str = Query("todos"),
    user=Depends(verificar_admin),
):
    return _consultar_pedidos(estado=estado, cursor=cursor)


@router.get("/buscar")
def buscar_pedidos(
    q: str = Query(..., min_length=1, max_length=150),
    tipo: Literal["nombre", "telefono", "id"] = "nombre",
    estado: str = Query("todos"),
    cursor: Optional[str] = Query(None, max_length=400),
    user=Depends(verificar_admin),
):
    return _consultar_pedidos(
        q=q.lower() if tipo == "nombre" else q, tipo=tipo, estado=estado, cursor=cursor
    )


# ───────────────────────── CAMBIAR ESTADO ─────────────────────────
@router.patch("/{pedido_id}/estado")
def cambiar_estado(pedido_id: str, estado: str, user=Depends(verificar_admin)):
    if estado not in ESTADOS_VALIDOS:
        raise HTTPException(400, "Estado inválido")

    # Con las notificaciones de guía apagadas se puede pasar a "guía enviada" directo.
    if estado == "guia_enviada":
        config = leer_configuracion_notificaciones()
        if notificacion_permitida(config, "guia_enviada"):
            raise HTTPException(400, "Debes registrar la guía para despachar.")

    referencia = db.collection("pedidos").document(pedido_id)
    ahora = datetime.now(timezone.utc).isoformat()

    if estado == "aceptado":

        @firestore.transactional
        def aceptar(transaction):
            snap = referencia.get(transaction=transaction)
            if not snap.exists:
                raise HTTPException(404, "Pedido no encontrado")

            pedido = snap.to_dict() or {}
            config = leer_configuracion_notificaciones(transaction=transaction)
            notifica = notificacion_permitida(config, "aceptado")

            anterior = pedido.get("estado")
            control = pedido.get("whatsappAceptado")

            if anterior == "aceptado":
                return {"ok": True, "yaAceptado": True, "whatsappAceptado": control}

            # La restricción solo existe para evitar mensajes duplicados por WhatsApp
            if notifica and anterior != "pendiente":
                raise HTTPException(409, "Solo puedes aceptar pedidos pendientes.")

            cambios = {"estado": "aceptado", "actualizadoEn": ahora}

            if notifica:
                if not isinstance(control, dict):
                    control = {
                        "estado": "pendiente",
                        "mensajeId": None,
                        "confirmadoEn": None,
                        "ultimoError": None,
                    }
                cambios["whatsappAceptado"] = control
            else:
                control = None

            transaction.update(referencia, cambios)
            return {"ok": True, "yaAceptado": False, "whatsappAceptado": control}

        return aceptar(db.transaction())

    try:
        referencia.update({"estado": estado, "actualizadoEn": ahora})
    except NotFound:
        raise HTTPException(404, "Pedido no encontrado")

    return {"ok": True}


# ───────────────────────── DESPACHO ─────────────────────────
@router.patch("/{pedido_id}/despacho")
def registrar_despacho(
    pedido_id: str,
    despacho: PedidoDespacho,
    user=Depends(verificar_admin),
):
    referencia = db.collection("pedidos").document(pedido_id)

    @firestore.transactional
    def guardar(transaction):
        snapshot = referencia.get(transaction=transaction)
        if not snapshot.exists:
            raise HTTPException(404, "Pedido no encontrado")

        pedido = snapshot.to_dict() or {}
        estado_actual = pedido.get("estado")

        if estado_actual == "guia_enviada":
            if (
                pedido.get("transportadora") == despacho.transportadora
                and pedido.get("numeroGuia") == despacho.numeroGuia
            ):
                return {
                    "ok": True,
                    "yaRegistrado": True,
                    "estado": "guia_enviada",
                    "transportadora": despacho.transportadora,
                    "numeroGuia": despacho.numeroGuia,
                    "whatsappGuia": pedido.get("whatsappGuia"),
                }
            if pedido.get("numeroGuia"):
                raise HTTPException(409, "El pedido ya tiene una guía diferente.")
        elif estado_actual != "aceptado":
            raise HTTPException(409, "Solo puedes despachar pedidos aceptados.")

        config = leer_configuracion_notificaciones(transaction=transaction)
        notifica = notificacion_permitida(config, "guia_enviada")

        if notifica and not (pedido.get("telefono") or "").strip():
            raise HTTPException(400, "El pedido no tiene teléfono registrado.")

        ahora = (datetime.utcnow() - timedelta(hours=5)).isoformat()
        whatsapp_guia = (
            {
                "estado": "pendiente",
                "mensajeId": None,
                "confirmadoEn": None,
                "ultimoError": None,
            }
            if notifica
            else None
        )

        cambios = {
            "estado": "guia_enviada",
            "transportadora": despacho.transportadora,
            "numeroGuia": despacho.numeroGuia,
            "guiaRegistradaEn": ahora,
            "actualizadoEn": ahora,
        }
        if notifica:
            cambios["whatsappGuia"] = whatsapp_guia

        transaction.update(referencia, cambios)

        return {
            "ok": True,
            "yaRegistrado": False,
            "estado": "guia_enviada",
            "transportadora": despacho.transportadora,
            "numeroGuia": despacho.numeroGuia,
            "whatsappGuia": whatsapp_guia,
        }

    return guardar(db.transaction())


# ───────────────────────── WHATSAPP ─────────────────────────
class TicketWhatsApp(BaseModel):
    ticket: str = Field(min_length=40, max_length=300)


class ResultadoWhatsApp(TicketWhatsApp):
    accion: Literal["clic_ejecutado", "requiere_revision"]
    detalle: str = Field(default="", max_length=300)


def _telefono_ecuador(valor):
    digitos = re.sub(r"\D", "", str(valor or ""))
    if re.fullmatch(r"09\d{8}", digitos):
        return "593" + digitos[1:]
    if re.fullmatch(r"9\d{8}", digitos):
        return "593" + digitos
    if re.fullmatch(r"5939\d{8}", digitos):
        return digitos
    raise HTTPException(422, "El pedido no tiene un teléfono móvil ecuatoriano válido.")


def _mensaje_guia(transportadora, guia, pedido=None):
    datos = dict(pedido or {})
    datos["transportadora"] = transportadora
    datos["numeroGuia"] = guia
    plantilla = cargar_plantillas(db)["guia_enviada"]
    return renderizar_plantilla(plantilla, datos)


def _separar_ticket(ticket):
    pedido_id, separador, secreto = ticket.partition(".")
    if (
        not separador
        or not re.fullmatch(r"[A-Za-z0-9_-]{6,150}", pedido_id)
        or not re.fullmatch(r"[A-Za-z0-9_-]{32,100}", secreto)
    ):
        raise HTTPException(400, "Autorización inválida.")
    digest = hashlib.sha256(secreto.encode()).hexdigest()
    ref = db.collection("pedidos").document(pedido_id)
    return ref, digest


def _control_por_ticket(pedido, digest, estado_requerido):
    for campo in ("whatsappAceptado", "whatsappGuia"):
        control = pedido.get(campo) or {}
        if control.get("estado") == estado_requerido and secrets.compare_digest(
            control.get("tokenHash") or "", digest
        ):
            return campo, control
    raise HTTPException(409, "Autorización usada o inválida.")


@router.post("/{pedido_id}/whatsapp/autorizar", dependencies=[Depends(verificar_admin)])
def autorizar_whatsapp_guia(
    pedido_id: str, tipo: Literal["aceptado", "guia_enviada"] = "guia_enviada"
):
    ref = db.collection("pedidos").document(pedido_id)
    secreto = secrets.token_urlsafe(32)
    digest = hashlib.sha256(secreto.encode()).hexdigest()
    ahora = datetime.now(timezone.utc)
    vence = ahora + timedelta(minutes=5)

    @firestore.transactional
    def reservar(transaction):
        snap = ref.get(transaction=transaction)
        if not snap.exists:
            raise HTTPException(404, "Pedido no encontrado.")

        pedido = snap.to_dict() or {}
        configuracion = leer_configuracion_notificaciones(transaction=transaction)

        if not notificacion_permitida(configuracion, tipo):
            raise HTTPException(
                409, "Esta notificación está desactivada en Lunio Store."
            )

        campo = "whatsappAceptado" if tipo == "aceptado" else "whatsappGuia"
        control = pedido.get(campo) or {}

        if pedido.get("estado") != tipo:
            raise HTTPException(409, "El pedido no está en el estado requerido.")
        if control.get("estado") != "pendiente":
            raise HTTPException(409, "Esta notificación ya fue reservada o intentada.")

        telefono = _telefono_ecuador(
            pedido.get("telefonoNormalizado") or pedido.get("telefono")
        )
        if tipo == "guia_enviada" and (
            not pedido.get("transportadora") or not pedido.get("numeroGuia")
        ):
            raise HTTPException(422, "Faltan los datos del despacho.")

        modo_general = (
            os.getenv("LUNIO_WHATSAPP_AUTO_ALLOW_ALL", "false").lower() == "true"
        )
        telefono_prueba = os.getenv("LUNIO_WHATSAPP_AUTO_TEST_PHONE", "").strip()

        print(
            "[LUNIO] Diagnóstico de autorización:",
            {
                "modo_general": modo_general,
                "numero_configurado": bool(telefono_prueba),
                "coincide": telefono == telefono_prueba,
                "telefono_pedido_ultimos4": telefono[-4:],
                "telefono_prueba_ultimos4": telefono_prueba[-4:],
            },
            flush=True,
        )

        if not modo_general and telefono != telefono_prueba:
            raise HTTPException(
                403, "Modo de prueba activo: este teléfono no está autorizado."
            )

        transaction.update(
            ref,
            {
                f"{campo}.estado": "reservado",
                f"{campo}.tokenHash": digest,
                f"{campo}.venceEn": vence,
                f"{campo}.ultimoError": None,
            },
        )

    reservar(db.transaction())
    return {"ticket": f"{pedido_id}.{secreto}", "venceEn": vence.isoformat()}


@router.post("/whatsapp/consumir")
def consumir_whatsapp_guia(datos: TicketWhatsApp):
    ref, digest = _separar_ticket(datos.ticket)
    ahora = datetime.now(timezone.utc)

    @firestore.transactional
    def consumir(transaction):
        snap = ref.get(transaction=transaction)
        if not snap.exists:
            raise HTTPException(404, "Pedido no encontrado.")

        pedido = snap.to_dict() or {}
        campo, control = _control_por_ticket(pedido, digest, "reservado")
        estado_requerido = "aceptado" if campo == "whatsappAceptado" else "guia_enviada"
        configuracion = leer_configuracion_notificaciones(transaction=transaction)

        if not notificacion_permitida(configuracion, estado_requerido):
            raise HTTPException(409, "El envío de WhatsApp fue desactivado.")
        if (
            not control.get("venceEn")
            or control["venceEn"] <= ahora
            or pedido.get("estado") != estado_requerido
        ):
            raise HTTPException(409, "Autorización vencida o pedido inválido.")

        telefono = _telefono_ecuador(
            pedido.get("telefonoNormalizado") or pedido.get("telefono")
        )

        if campo == "whatsappAceptado":
            plantilla = cargar_plantillas(db)["aceptado"]
            mensaje = renderizar_plantilla(plantilla, pedido)
        else:
            mensaje = _mensaje_guia(
                pedido["transportadora"], pedido["numeroGuia"], pedido
            )

        transaction.update(
            ref, {f"{campo}.estado": "intentando", f"{campo}.intentadoEn": ahora}
        )
        return {"telefono": telefono, "mensaje": mensaje}

    return consumir(db.transaction())


@router.post("/whatsapp/resultado")
def registrar_resultado_whatsapp(datos: ResultadoWhatsApp):
    ref, digest = _separar_ticket(datos.ticket)
    ahora = datetime.now(timezone.utc)

    @firestore.transactional
    def registrar(transaction):
        snap = ref.get(transaction=transaction)
        if not snap.exists:
            raise HTTPException(404, "Pedido no encontrado.")

        pedido = snap.to_dict() or {}
        campo, _control = _control_por_ticket(pedido, digest, "intentando")

        transaction.update(
            ref,
            {
                f"{campo}.estado": datos.accion,
                f"{campo}.confirmadoEn": None,
                f"{campo}.ultimoError": (
                    datos.detalle if datos.accion == "requiere_revision" else None
                ),
                f"{campo}.resultadoRegistradoEn": ahora,
                f"{campo}.tokenHash": firestore.DELETE_FIELD,
                f"{campo}.venceEn": firestore.DELETE_FIELD,
            },
        )

    registrar(db.transaction())
    return {"ok": True, "estado": datos.accion}


# ───────────────────────── CONFIGURACIÓN ─────────────────────────
class ConfiguracionMensajesWhatsApp(BaseModel):
    aceptado: str = Field(min_length=10, max_length=2500)
    guia_enviada: str = Field(min_length=10, max_length=2500)


@router.get("/configuracion/mensajes", dependencies=[Depends(verificar_admin)])
def obtener_configuracion_mensajes():
    return {
        "plantillas": cargar_plantillas(db),
        "predeterminadas": PLANTILLAS_POR_DEFECTO,
    }


@router.put("/configuracion/mensajes", dependencies=[Depends(verificar_admin)])
def guardar_configuracion_mensajes(datos: ConfiguracionMensajesWhatsApp):
    try:
        aceptado = validar_plantilla(datos.aceptado)
        guia = validar_plantilla(datos.guia_enviada)
    except ValueError as error:
        raise HTTPException(422, str(error))

    db.collection("configuracion").document("whatsapp").set(
        {
            "aceptado": aceptado,
            "guia_enviada": guia,
            "actualizadoEn": datetime.now(timezone.utc),
        },
        merge=True,
    )

    return {"ok": True, "plantillas": {"aceptado": aceptado, "guia_enviada": guia}}


@router.get("/configuracion/notificaciones", dependencies=[Depends(verificar_admin)])
def obtener_configuracion_notificaciones():
    return leer_configuracion_notificaciones()


@router.put("/configuracion/notificaciones", dependencies=[Depends(verificar_admin)])
def actualizar_configuracion_notificaciones(datos: ConfiguracionNotificaciones):
    configuracion = datos.model_dump()
    db.collection("configuracion").document("whatsapp").set(
        {**configuracion, "actualizadoEn": datetime.now(timezone.utc)}, merge=True
    )
    return {"ok": True, "configuracion": configuracion}
