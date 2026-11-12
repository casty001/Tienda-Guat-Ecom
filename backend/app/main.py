from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from app.routes import (
    productos,
    pedidos,
    upload,
    blacklist,
    config,
)

app = FastAPI(
    title="Tienda Drop API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    productos.router,
    prefix="/productos",
    tags=["Productos"]
)

app.include_router(
    pedidos.router,
    prefix="/pedidos",
    tags=["Pedidos"]
)

app.include_router(
    upload.router,
    prefix="/upload",
    tags=["Upload"]
)

app.include_router(
    blacklist.router,
    prefix="/blacklist",
    tags=["Blacklist"]
)

app.include_router(
    config.router,
    prefix="/config",
    tags=["Config"]
)

@app.get("/")
def root():
    return {
        "ok": True,
        "message": "Tienda Drop API funcionando"
    }

@app.head("/")
def root_head():
    return Response(status_code=200)