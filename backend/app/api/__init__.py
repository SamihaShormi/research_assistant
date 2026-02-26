from fastapi import APIRouter

from app.api.auth import auth_router, me_router
from app.api.health import router as health_router
from app.api.projects import projects_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(me_router)
api_router.include_router(projects_router, prefix="/projects")
