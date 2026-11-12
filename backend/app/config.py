import os
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# TUS VARIABLES ORIGINALES (INTACTAS)
# ==========================================
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID")

FIREBASE_CLIENT_EMAIL = os.getenv(
    "FIREBASE_CLIENT_EMAIL"
)

FIREBASE_PRIVATE_KEY = os.getenv(
    "FIREBASE_PRIVATE_KEY"
)

CLOUDINARY_CLOUD_NAME = os.getenv(
    "CLOUDINARY_CLOUD_NAME"
)

CLOUDINARY_API_KEY = os.getenv(
    "CLOUDINARY_API_KEY"
)

CLOUDINARY_API_SECRET = os.getenv(
    "CLOUDINARY_API_SECRET"
)

# ==========================================
# NUEVO: LÓGICA PARA LOS DOS PÍXELES DE META
# ==========================================
# Píxel A (Existente)
META_PIXEL_ID = os.getenv("META_PIXEL_ID", "904323315400372")
META_ACCESS_TOKEN = os.getenv("META_ACCESS_TOKEN")
META_TEST_EVENT_CODE_A = os.getenv("META_TEST_EVENT_CODE_A", "")

# Píxel B (Nuevo)
META_PIXEL_ID_B = os.getenv("META_PIXEL_ID_B", "1828743848252644")
META_ACCESS_TOKEN_B = os.getenv("META_ACCESS_TOKEN_B")
META_TEST_EVENT_CODE_B = os.getenv("META_TEST_EVENT_CODE_B", "")

# Diccionario central para no enredar la lógica en otros archivos
META_PIXELS = {
    "A": {
        "pixel_id": META_PIXEL_ID,
        "access_token": META_ACCESS_TOKEN,
        "test_event_code": META_TEST_EVENT_CODE_A
    },
    "B": {
        "pixel_id": META_PIXEL_ID_B,
        "access_token": META_ACCESS_TOKEN_B,
        "test_event_code": META_TEST_EVENT_CODE_B
    }
}

def pixel_valido(meta_pixel_id: str | None) -> str:
    """
    Decide a qué píxel enviar.
    Si viene vacío, nulo o basura -> Va al A.
    Si viene el ID del B -> Va al B.
    """
    if not meta_pixel_id:
        return "A"
    
    if str(meta_pixel_id).strip() == META_PIXEL_ID_B:
        return "B"
        
    return "A" # Fallback seguro