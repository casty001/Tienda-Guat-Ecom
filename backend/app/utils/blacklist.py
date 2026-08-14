import re
import time
from app.firebase import db

_cache = {"numeros": set(), "ts": 0}
TTL = 300  # 5 minutos


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


def _cargar_blacklist() -> set:
    docs = db.collection("blacklist_numeros").stream()
    return {d.id for d in docs}


def esta_en_blacklist(numero: str) -> bool:
    now = time.time()
    if now - _cache["ts"] > TTL:
        _cache["numeros"] = _cargar_blacklist()
        _cache["ts"] = now
    return normalizar_telefono(numero) in _cache["numeros"]


def invalidar_cache():
    """Fuerza recarga en la siguiente consulta. Útil tras agregar/quitar un número."""
    _cache["ts"] = 0
