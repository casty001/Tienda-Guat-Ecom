import resend
import os

RESEND_API_KEY2 = os.getenv("RESEND_API_KEY2")

resend.api_key = RESEND_API_KEY2

def enviar_correo_pedido(pedido: dict, pedido_id: str):
    """Envía correo al admin cuando hay un nuevo pedido"""
    
    if not RESEND_API_KEY2:
        #print("⚠️ RESEND_API_KEY no configurado")
        return False
    
    total = round(pedido.get('precio', 0), 2)

    try:
        r = resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": ["jestebanyepesr@gmail.com"],  # ← lista
            "subject": f"🛒 Nuevo pedido Lunio Store Ecuador - {pedido.get('productoNombre', 'Producto')}",
            "html": f"""
                <h1>🛒 Nuevo Pedido</h1>
                <p><strong>ID:</strong> #{pedido_id[:8]}</p>
                <p><strong>Cliente:</strong> {pedido.get('nombre', 'N/A')}</p>
                <p><strong>Teléfono:</strong> {pedido.get('telefono', 'N/A')}</p>
                <p><strong>Producto:</strong> {pedido.get('productoNombre', 'N/A')}</p>
                <p><strong>Total:</strong> ${total}</p>
                <p><strong>Dirección:</strong> {pedido.get('direccion', 'N/A')}</p>
                <hr>
                <p><a href="https://luniostore.netlify.app/admin/pedidos">Ver todos los pedidos</a></p>
            """
        })
        return True
    except Exception as e:
        return False