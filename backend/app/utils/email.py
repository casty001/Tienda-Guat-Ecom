import os
import html
import logging
import requests

# 👇 IMPORTAMOS LA DB
from app.firebase import db 

MAIL_API_KEY = os.getenv("MAIL_API_KEY")

logger = logging.getLogger(__name__)


def enviar_correo_pedido(pedido: dict, pedido_id: str):
    """Envía correo al admin cuando hay un nuevo pedido."""

    if not MAIL_API_KEY:
        logger.error("MAIL_API_KEY no configurada")
        return False

    try:
        # 👇 NUEVO: Obtener correos dinámicos de Firestore
        doc = db.collection("config").document("general").get()
        correos_dinamicos = []
        
        if doc.exists:
            correos_dinamicos = doc.to_dict().get("correos_notificacion") or []

        # Si por alguna razón está vacío, usamos los por defecto
        if not correos_dinamicos:
            correos_dinamicos = [
                "materedu.ecom@gmail.com", 
                "bryansteven7000@gmail.com", 
                "juane.yepesr@gmail.com"
            ]

        # Formatear para Brevo
        lista_destinatarios = [{"email": c} for c in correos_dinamicos]

        total = round(float(pedido.get("precio") or 0), 2)

        def dato(campo):
            return html.escape(
                str(pedido.get(campo) or "N/A")
            )

        contenido = f"""
            <h1>🛒 Nuevo Pedido Lunio Ecuador</h1>
            <p><strong>ID:</strong> #{html.escape(str(pedido_id)[:8])}</p>
            <p><strong>Cliente:</strong> {dato('nombre')}</p>
            <p><strong>Teléfono:</strong> {dato('telefono')}</p>
            <p><strong>Producto:</strong> {dato('productoNombre')}</p>
            <p><strong>Total:</strong> ${total:.2f}</p>
            <p><strong>Dirección:</strong> {dato('direccion')}</p>
            <hr>
            <p>
                <a href="https://lunioecuador.com/admin/pedidos">
                    Ver todos los pedidos
                </a>
            </p>
        """

        payload = {
            "sender": {
                "name": "Lunio Store Ecuador",
                "email": "pedidos@lunioecuador.com"
            },
            # 👇 NUEVO: Usar la lista dinámica
            "to": lista_destinatarios, 
            "subject": (
                "🛒 Nuevo pedido Lunio Store Ecuador - "
                + str(pedido.get("productoNombre") or "Producto")
            ),
            "htmlContent": contenido
        }

        respuesta = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": MAIL_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            json=payload,
            timeout=15
        )

        respuesta.raise_for_status()

        return respuesta.status_code == 201

    except requests.exceptions.RequestException:
        logger.exception("Error de comunicación con Brevo")
        return False

    except (ValueError, TypeError):
        logger.exception("Error en los datos del pedido")
        return False