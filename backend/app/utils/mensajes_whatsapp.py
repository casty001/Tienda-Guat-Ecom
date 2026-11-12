
import re

PLANTILLAS_POR_DEFECTO = {
    "aceptado": (
        "¡Gracias por tu compra, {nombre}! 😁\n\n"
        "🚚 Tu {producto} está siendo preparado.\n"
        "✅ Recuerda que tienes 6 meses de garantía "
        "por defectos de fábrica.\n"
        "🎉 La entrega estimada es de 2 a 4 días hábiles.\n"
        "✉️ Tu guía de envío será compartida durante el día."
    ),
    "guia_enviada": (
        "¡Hola, {nombre}! 😊\n\n"
        "Tu pedido ya fue despachado correctamente 🚚✨\n\n"
        "📦 *Número de guía:* {guia}\n"
        "🚛 *Transportadora:* {transportadora}\n\n"
        "Puedes hacer seguimiento directamente en la página "
        "de la transportadora 🔍\n\n"
        "⏳ Tu pedido puede tardar entre 1 y 7 días hábiles "
        "dependiendo de la ciudad.\n\n"
        "¡Gracias por tu compra y confianza! 💙"
    )
}

VARIABLES_PERMITIDAS = {
    "nombre",
    "producto",
    "transportadora",
    "guia"
}

PATRON = re.compile(r"\{([a-zA-Z][a-zA-Z0-9_]*)\}")


def validar_plantilla(texto):
    encontradas = set(PATRON.findall(texto))
    desconocidas = encontradas - VARIABLES_PERMITIDAS

    if desconocidas:
        raise ValueError(
            "Variables desconocidas: " +
            ", ".join(sorted(desconocidas))
        )

    return texto.strip()


def cargar_plantillas(db):
    doc = (
        db.collection("configuracion")
        .document("whatsapp")
        .get()
    )

    guardadas = doc.to_dict() if doc.exists else {}
    guardadas = guardadas or {}

    resultado = dict(PLANTILLAS_POR_DEFECTO)

    for clave in resultado:
        valor = guardadas.get(clave)

        if isinstance(valor, str) and valor.strip():
            resultado[clave] = valor

    return resultado


def renderizar_plantilla(plantilla, pedido):
    datos = {
        "nombre": str(pedido.get("nombre") or "cliente").strip(),
        "producto": str(
            pedido.get("productoNombre") or "producto"
        ).strip(),
        "transportadora": str(
            pedido.get("transportadora") or ""
        ).strip(),
        "guia": str(
            pedido.get("numeroGuia") or ""
        ).strip()
    }

    validar_plantilla(plantilla)

    return PATRON.sub(
        lambda match: datos[match.group(1)],
        plantilla
    )
