import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import crear_tablas
from app.routes.clientes import router as router_clientes
from app.routes.consulta import router as router_consulta
from app.routes.historias import router as router_historias
from app.routes.metricas import router as router_metricas
from app.routes.pacientes import router as router_pacientes
from app.routes.citas import router as router_citas
from app.routes.vacunas import router as router_vacunas

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    crear_tablas()
    logging.getLogger(__name__).info("Base de datos lista")
    yield


app = FastAPI(
    title="VetIA API",
    description="Sistema automatizado de historias clínicas veterinarias",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router_consulta)
app.include_router(router_clientes)
app.include_router(router_pacientes)
app.include_router(router_historias)
app.include_router(router_metricas)
app.include_router(router_vacunas)
app.include_router(router_citas)


@app.get("/")
def raiz():
    return {"estado": "ok", "servicio": "VetIA API", "version": "0.1.0"}


@app.get("/health")
def health():
    return {"estado": "ok"}
