import firebase_admin

from firebase_admin import (
    credentials,
    firestore
)

from app.config import (
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY
)

private_key = FIREBASE_PRIVATE_KEY.replace(
    "\\n",
    "\n"
)

cred = credentials.Certificate({
    "type": "service_account",
    "project_id": FIREBASE_PROJECT_ID,
    "client_email": FIREBASE_CLIENT_EMAIL,
    "private_key": private_key,
    "token_uri":
        "https://oauth2.googleapis.com/token",
})

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()