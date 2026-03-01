from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.core.config import settings
from app.db import init_db

app = FastAPI(title=settings.app_name, docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount('/static', StaticFiles(directory='app/static'), name='static')


@app.get('/docs', include_in_schema=False)
def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f'{settings.app_name} - Swagger UI',
        swagger_css_url='/static/docs-theme.css',
    )


@app.get('/redoc', include_in_schema=False)
def custom_redoc_html():
    return get_redoc_html(openapi_url=app.openapi_url, title=f'{settings.app_name} - ReDoc')


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.include_router(api_router)
