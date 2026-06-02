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

def enviar_place_order(pedido: dict):

    url = "https://business-api.tiktok.com/open_api/v1.3/event/track/"

    headers = {
        "Access-Token": TIKTOK_ACCESS_TOKEN,
        "Content-Type": "application/json",
    }

    payload = {
        "event_source": "web",
        "event_source_id": TIKTOK_PIXEL_ID,
        "data": [
            {
                "event": "CompletePayment",
                "event_id": pedido.get("event_id"),
                #"event_time": int(time.time()),

                "context": {
                    "page": {
                        "url": pedido.get("url", "")
                    },
                    "user": {
                        "phone_number": hash_sha256(pedido.get("telefono")),
                        "external_id": hash_sha256(pedido.get("telefono")),
                    }
                },

                "properties": {
                    "content_id": pedido.get("productoId"),
                    "content_name": pedido.get("productoNombre"),
                    "value": float(pedido.get("precio") or 0),
                    "currency": "COP",
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

    print("TikTok Event:", response.status_code, response.text)