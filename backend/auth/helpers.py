import hashlib
import jwt
import secrets
import os
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from database import db
from models.user import (
    ActivityLog,
    PERFIL_SUPER_ADMIN, PERFIL_COLABORADOR, PERFIS_ADMIN
)

JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def create_token(user_id: str, email: str, perfil: str, tenant_id: str = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "perfil": perfil,
        "tenant_id": tenant_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[Dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[Dict]:
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        return None
    user = await db.usuarios.find_one({"id": payload["user_id"]}, {"_id": 0, "senha": 0})
    if not user or user.get("status") != "ativo":
        return None
    if user.get("perfil") != PERFIL_SUPER_ADMIN and user.get("tenant_id"):
        tenant = await db.tenants.find_one({"id": user["tenant_id"]}, {"_id": 0})
        if not tenant or tenant.get("status") != "ativo":
            return None
        user["tenant"] = tenant
    return user


async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    user = await get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Não autorizado")
    return user


async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    user = await require_auth(credentials)
    if user.get("perfil") not in PERFIS_ADMIN:
        raise HTTPException(status_code=403, detail="Acesso negado. Requer perfil de administrador.")
    return user


async def require_super_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    user = await require_auth(credentials)
    if user.get("perfil") != PERFIL_SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Acesso negado. Requer perfil de Super Admin.")
    return user


def get_tenant_id(user: Dict) -> Optional[str]:
    if user.get("perfil") == PERFIL_SUPER_ADMIN:
        return None
    return user.get("tenant_id")


async def get_user_allowed_company_ids(user: Dict) -> Optional[List[str]]:
    if user.get("perfil") in PERFIS_ADMIN:
        return None
    tenant_id = user.get("tenant_id")
    vinculos = await db.usuario_empresas.find({
        "usuario_id": user['id'],
        "tenant_id": tenant_id
    }, {"_id": 0}).to_list(1000)
    empresa_ids = [v['empresa_id'] for v in vinculos]
    return empresa_ids


async def log_activity(usuario_id: str, usuario_nome: str, acao: str, detalhes: str = None,
                       empresa_id: str = None, empresa_nome: str = None,
                       tenant_id: str = None, tenant_nome: str = None):
    log = ActivityLog(
        tenant_id=tenant_id,
        tenant_nome=tenant_nome,
        usuario_id=usuario_id,
        usuario_nome=usuario_nome,
        acao=acao,
        detalhes=detalhes,
        empresa_id=empresa_id,
        empresa_nome=empresa_nome
    )
    doc = log.model_dump()
    doc['data_hora'] = doc['data_hora'].isoformat()
    await db.activity_logs.insert_one(doc)
