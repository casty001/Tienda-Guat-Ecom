import requests
import time
import os
import hashlib
import unicodedata

META_PIXEL_ID = os.getenv("META_PIXEL_ID")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")

def hash_sha256(valor):
    if not valor:
        return None

    return hashlib.sha256(
        str(valor).strip().lower().encode()
    ).hexdigest()

def quitar_acentos(texto):
    return ''.join(
        c for c in unicodedata.normalize('NFD', texto)
        if unicodedata.category(c) != 'Mn'
    )

def enviar_purchase_meta(pedido: dict, request_meta: dict = None):
    url = f"https://graph.facebook.com/v23.0/{META_PIXEL_ID}/events"

    telefono = str(pedido.get("telefono", ""))
    telefono = ''.join(filter(str.isdigit, telefono))
    telefono = telefono.lstrip("0")

    if not telefono.startswith("593"):
        telefono = f"593{telefono}"

    nombre_completo = str(pedido.get("nombre", "")).strip()
    partes_nombre = nombre_completo.split(" ")
    primer_nombre = partes_nombre[0] if partes_nombre else ""
    apellido = " ".join(partes_nombre[1:]) if len(partes_nombre) > 1 else ""

    ciudad_raw = str(pedido.get("ciudad", "")).strip().lower().replace(" ", "")
    ciudad = quitar_acentos(ciudad_raw)

    departamento_raw = str(pedido.get("departamento", "")).strip().lower().replace(" ", "")
    departamento = quitar_acentos(departamento_raw)

    user_data = {
        "ph": [hash_sha256(telefono)],
        "external_id": [hash_sha256(telefono)],
    }

    if primer_nombre:
        user_data["fn"] = [hash_sha256(quitar_acentos(primer_nombre))]

    if apellido:
        user_data["ln"] = [hash_sha256(quitar_acentos(apellido))]

    if ciudad:
        user_data["ct"] = [hash_sha256(ciudad)]
    if departamento:
        user_data["st"] = [hash_sha256(departamento)]

    user_data["country"] = [hash_sha256("ec")]

    if pedido.get("fbp"):
        user_data["fbp"] = pedido.get("fbp")

    if pedido.get("fbc"):
        user_data["fbc"] = pedido.get("fbc")

    if request_meta and request_meta.get("ip"):
        user_data["client_ip_address"] = request_meta.get("ip")

    if request_meta and request_meta.get("user_agent"):
        user_data["client_user_agent"] = request_meta.get("user_agent")

    payload = {
        "data": [
            {
                "event_name": "Purchase",
                "event_time": int(time.time()),
                "event_id": pedido.get("event_id"),
                "action_source": "website",
                "event_source_url": pedido.get("url", ""),
                "user_data": user_data,
                "custom_data": {
                    "currency": "USD",
                    "value": float(pedido.get("precio") or 0),
                    "content_ids": [pedido.get("productoId")],
                    "content_name": pedido.get("productoNombre"),
                    "content_type": "product",
                }
            }
        ],
        #"test_event_code": "TEST73640"
    }

    response = requests.post(
        url,
        json=payload,
        params={"access_token": META_ACCESS_TOKEN},
        timeout=10
    )

    print("META EVENT:", response.status_code, response.text)
    print("🔍 PAYLOAD ENVIADO A META:", payload)