from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from database import db, client

# Import all routers
from routes.auth import router as auth_router
from routes.superadmin import router as superadmin_router
from routes.users import router as users_router
from routes.dashboard import router as dashboard_router
from routes.companies import router as companies_router
from routes.chart_of_accounts import router as chart_router
from routes.classification import router as classification_router
from routes.statements import router as statements_router
from routes.accounting import router as accounting_router
from routes.converter import router as converter_router

app = FastAPI()

# Root endpoint
@app.get("/api")
async def root():
    return {"message": "API Agente Contábil - Sistema Domínio"}

# Register all routers
app.include_router(auth_router)
app.include_router(superadmin_router)
app.include_router(users_router)
app.include_router(dashboard_router)
app.include_router(companies_router)
app.include_router(chart_router)
app.include_router(classification_router)
app.include_router(statements_router)
app.include_router(accounting_router)
app.include_router(converter_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
