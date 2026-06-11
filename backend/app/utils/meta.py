import requests
import time
import os
import hashlib

META_PIXEL_ID = os.getenv("META_PIXEL_ID")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")

def hash_sha256(valor):
    if not valor:
        return None

    return hashlib.sha256(
        str(valor).strip().lower().encode()
    ).hexdigest()

def enviar_purchase_meta(pedido: dict):

    url = f"https://graph.facebook.com/v23.0/{META_PIXEL_ID}/events"

    telefono = str(
        pedido.get("telefono", "")
    )

    telefono = ''.join(
        filter(str.isdigit, telefono)
    )

    if not telefono.startswith("57"):
        telefono = f"57{telefono}"

    payload = {
        "data": [
            {
                "event_name": "Purchase",

                "event_time": int(time.time()),

                "event_id": pedido.get("event_id"),

                "action_source": "website",

                "user_data": {
                    "ph": [
                        hash_sha256(telefono)
                    ]
                },

                "custom_data": {
                    "currency": "COP",

                    "value": float(
                        pedido.get("precio") or 0
                    ),

                    "content_ids": [
                        pedido.get("productoId")
                    ],

                    "content_name":
                        pedido.get("productoNombre"),

                    "content_type": "product",
                }
            }
        ],
        #"test_event_code": "TEST59534"

    }

    response = requests.post(
        url,
        json=payload,
        params={
            "access_token":
                META_ACCESS_TOKEN
        },
        timeout=10
    )

    print(
        "META EVENT:",
        response.status_code,
        response.text
    )