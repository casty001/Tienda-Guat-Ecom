import cloudinary
import cloudinary.uploader

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends
)

from app.dependencies.auth import (
    verificar_admin
)

from app.config import (
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
)

router = APIRouter()

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)

@router.post("/imagen")
async def subir_imagen(
    file: UploadFile = File(...),
    user=Depends(verificar_admin)
):

    result = (
        cloudinary.uploader.upload(
            file.file,
            folder="tienda_drop/productos"
        )
    )

    return {
        "ok": True,
        "url": result["secure_url"],
        "public_id": result["public_id"]
    }