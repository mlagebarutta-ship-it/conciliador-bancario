from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Optional
from datetime import datetime, timezone

from database import db
from models.user import User, UserLogin, PERFIL_SUPER_ADMIN, PERFIL_COLABORADOR
from auth.helpers import (
    hash_password, verify_password, create_token,
    require_auth, log_activity
)

router = APIRouter(prefix="/api")


@router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.usuarios.find_one({"email": credentials.email.lower()}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if not verify_password(credentials.senha, user['senha']):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if user.get('status') != 'ativo':
        raise HTTPException(status_code=401, detail="Usuário inativo. Contate o administrador.")

    tenant_data = None
    if user.get('perfil') != PERFIL_SUPER_ADMIN and user.get('tenant_id'):
        tenant = await db.tenants.find_one({"id": user['tenant_id']}, {"_id": 0})
        if not tenant:
            raise HTTPException(status_code=401, detail="Escritório não encontrado")
        if tenant.get('status') != 'ativo':
            raise HTTPException(status_code=401, detail="Escritório bloqueado. Contate o suporte.")
        tenant_data = {"id": tenant['id'], "nome": tenant['nome']}

    token = create_token(user['id'], user['email'], user['perfil'], user.get('tenant_id'))

    await log_activity(
        user['id'], user['nome'], "Login realizado",
        tenant_id=user.get('tenant_id'),
        tenant_nome=tenant_data['nome'] if tenant_data else None
    )

    await db.usuarios.update_one(
        {"id": user['id']},
        {"$set": {"ultimo_acesso": datetime.now(timezone.utc).isoformat()}}
    )

    return {
        "token": token,
        "user": {
            "id": user['id'],
            "nome": user['nome'],
            "email": user['email'],
            "perfil": user['perfil'],
            "tenant_id": user.get('tenant_id'),
            "tenant": tenant_data
        }
    }


@router.get("/auth/me")
async def get_me(current_user: Dict = Depends(require_auth)):
    response = {
        "id": current_user['id'],
        "nome": current_user['nome'],
        "email": current_user['email'],
        "perfil": current_user['perfil'],
        "tenant_id": current_user.get('tenant_id'),
        "tenant": current_user.get('tenant'),
        "empresas_vinculadas": []
    }
    if current_user.get('perfil') == PERFIL_COLABORADOR and current_user.get('tenant_id'):
        vinculos = await db.usuario_empresas.find({
            "usuario_id": current_user['id'],
            "tenant_id": current_user['tenant_id']
        }, {"_id": 0}).to_list(1000)
        empresa_ids = [v['empresa_id'] for v in vinculos]
        if empresa_ids:
            empresas = await db.companies.find({
                "id": {"$in": empresa_ids},
                "tenant_id": current_user['tenant_id']
            }, {"_id": 0}).to_list(1000)
            response["empresas_vinculadas"] = empresas
    return response


@router.post("/auth/change-password")
async def change_password(
    senha_atual: str,
    nova_senha: str,
    current_user: Dict = Depends(require_auth)
):
    user = await db.usuarios.find_one({"id": current_user['id']}, {"_id": 0})
    if not verify_password(senha_atual, user['senha']):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    await db.usuarios.update_one(
        {"id": current_user['id']},
        {"$set": {"senha": hash_password(nova_senha)}}
    )
    await log_activity(current_user['id'], current_user['nome'], "Senha alterada")
    return {"message": "Senha alterada com sucesso"}


@router.post("/auth/init-admin")
async def init_admin():
    user_count = await db.usuarios.count_documents({})
    if user_count > 0:
        raise HTTPException(status_code=400, detail="Sistema já possui usuários cadastrados")
    admin = User(
        nome="Administrador",
        email="admin@dominio.com",
        senha=hash_password("admin123"),
        perfil="administrador",
        status="ativo"
    )
    doc = admin.model_dump()
    doc['data_criacao'] = doc['data_criacao'].isoformat()
    await db.usuarios.insert_one(doc)
    return {
        "message": "Usuário administrador criado com sucesso",
        "email": "admin@dominio.com",
        "senha_temporaria": "admin123",
        "aviso": "Altere a senha após o primeiro login!"
    }
