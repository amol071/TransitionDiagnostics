"""Main FastAPI app."""
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
import logging
import os

from core import db, init_storage, close_db
from routes_auth import router as auth_router
from routes_cases import router as cases_router
from routes_forms import router as forms_router
from routes_documents import router as documents_router
from routes_ai import router as ai_router
from seed import seed_all

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ldc")

app = FastAPI(title="LDC AI Platform")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "LDC AI Platform", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(cases_router)
api_router.include_router(forms_router)
api_router.include_router(documents_router)
api_router.include_router(ai_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    init_storage()
    try:
        seeded = await seed_all()
        logger.info(f"Seed done: new={seeded}")
    except Exception as e:
        logger.exception(f"Seed failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    close_db()
