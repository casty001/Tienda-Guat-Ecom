import requests
import time
import os
import hashlib

TIKTOK_PIXEL_ID = os.getenv("TIKTOK_PIXEL_ID")
TIKTOK_ACCESS_TOKEN = os.getenv("TIKTOK_ACCESS_TOKEN")

def hash_sha256(valor):
    if not valor:
        return None

    return hashlib.sha256(
        str(valor).strip().lower().encode()
    ).hexdigest()

def enviar_place_order(pedido: dict, request_meta: dict = None):

    url = "https://business-api.tiktok.com/open_api/v1.3/event/track/"

    headers = {
        "Access-Token": TIKTOK_ACCESS_TOKEN,
        "Content-Type": "application/json",
    }

    telefono = str(pedido.get("telefono", ""))
    telefono = ''.join(filter(str.isdigit, telefono))
    telefono = telefono.lstrip("0")
    if not telefono.startswith("593"):
        telefono = f"593{telefono}"
    telefono_e164 = f"+{telefono}"

    payload = {
        "event_source": "web",
        "event_source_id": TIKTOK_PIXEL_ID,
        "data": [
            {
                "event": "CompletePayment",
                "event_id": pedido.get("event_id"),
                "event_time": int(time.time()),

                "context": {
                    "page": {
                        "url": pedido.get("url", "")
                    },
                    "user": {
                        "phone_number": hash_sha256(telefono_e164),
                        "external_id": hash_sha256(pedido.get("anonId")),
                        "ttclid": pedido.get("ttclid"),
                        "ip": request_meta.get("ip") if request_meta else None,
                        "user_agent": request_meta.get("user_agent") if request_meta else None,
                    }
                },

            "properties": {
                "contents": [
                    {
                        "content_id": str(pedido.get("productoId", "")),
                        "content_type": "product",
                        "content_name": pedido.get("productoNombre", ""),
                        "price": float(pedido.get("precio") or 0),
                        "quantity": 1,
                    }
                ],
                "value": float(pedido.get("precio") or 0),
                "currency": "USD",
            }
            }
        ]
    }
    response = requests.post(
        url,
        json=payload,
        headers=headers,
        timeout=10
    )

    print("🔍 PAYLOAD ENVIADO A TIKTOK:", payload)
    print("TikTok Event:", response.status_code, response.text)