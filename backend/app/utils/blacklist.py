import re
from app.firebase import db

COLECCION = "blacklist_numeros"


def normalizar_telefono(numero: str) -> str:
    """
    Normaliza a formato local ecuatoriano: 09XXXXXXXX (10 dígitos).
    Acepta variantes: +593991234567, 593991234567, 0991234567, 991234567
    """
    limpio = re.sub(r"\D", "", numero or "")

    if limpio.startswith("593"):
        limpio = "0" + limpio[3:]
    elif len(limpio) == 9 and limpio.startswith("9"):
        limpio = "0" + limpio

    return limpio


def esta_en_blacklist(numero: str) -> bool:
    tel = normalizar_telefono(numero)
    if not tel:
        return False
    try:
        # El id del documento es el número: 1 sola lectura
        return db.collection(COLECCION).document(tel).get().exists
    except Exception as e:
        # Si Firestore falla, el pedido NO se pierde: se trata como no bloqueado
        print(f"⚠️ Error consultando blacklist: {e}")
        return False


def invalidar_cache():
    """Ya no hay caché. Se deja vacía para no romper imports en routes/blacklist.py."""
    pass