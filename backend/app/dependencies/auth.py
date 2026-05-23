from fastapi import (
    Header,
    HTTPException
)

from firebase_admin import auth

def verificar_admin(
    authorization: str = Header(None)
):

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="No autorizado"
        )

    token = authorization.replace(
        "Bearer ",
        ""
    )

    try:
        decoded_token = auth.verify_id_token(
            token
        )

        return decoded_token

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )   