from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Optional
from datetime import datetime

from database import db
from models.user import User, UserCreate, UserUpdate, UserEmpresa, PERFIL_SUPER_ADMIN, PERFIL_COLABORADOR, PERFIL_ADMIN_TENANT
from auth.helpers import (
    hash_password, require_admin, get_tenant_id, log_activity
)

router = APIRouter(prefix="/api")


@router.get("/usuarios")
async def list_users(current_user: Dict = Depends(require_admin)):
    if current_user.get('perfil') == PERFIL_SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Super Admin deve usar /superadmin/usuarios")
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant não identificado")
    users = await db.usuarios.find({"tenant_id": tenant_id}, {"_id": 0, "senha": 0}).to_list(1000)
    for u in users:
        if isinstance(u.get('data_criacao'), str):
            pass
        elif u.get('data_criacao'):
            u['data_criacao'] = u['data_criacao'].isoformat()
    return users


@router.post("/usuarios")
async def create_user(user_data: UserCreate, current_user: Dict = Depends(require_admin)):
    tenant_id = current_user.get('tenant_id')
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant não identificado")
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if tenant:
        current_count = await db.usuarios.count_documents({"tenant_id": tenant_id})
        if current_count >= tenant.get('max_usuarios', 5):
            raise HTTPException(status_code=400, detail=f"Limite de usuários atingido ({tenant.get('max_usuarios', 5)})")
    existing = await db.usuarios.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    perfil = user_data.perfil
    if current_user.get('perfil') == PERFIL_COLABORADOR:
        perfil = PERFIL_COLABORADOR
    if perfil not in [PERFIL_COLABORADOR, PERFIL_ADMIN_TENANT]:
        perfil = PERFIL_COLABORADOR
    user = User(
        tenant_id=tenant_id, nome=user_data.nome,
        email=user_data.email.lower(), senha=hash_password(user_data.senha), perfil=perfil
    )
    doc = user.model_dump()
    doc['data_criacao'] = doc['data_criacao'].isoformat()
    await db.usuarios.insert_one(doc)
    await log_activity(
        current_user['id'], current_user['nome'],
        "Usuário criado", f"Novo usuário: {user.nome} ({user.email}) - Perfil: {user.perfil}",
        tenant_id=tenant_id, tenant_nome=tenant.get('nome') if tenant else None
    )
    return {
        "id": user.id, "nome": user.nome, "email": user.email,
        "perfil": user.perfil, "status": user.status,
        "tenant_id": tenant_id, "data_criacao": doc['data_criacao']
    }


@router.get("/usuarios/{user_id}")
async def get_user(user_id: str, current_user: Dict = Depends(require_admin)):
    tenant_id = current_user.get('tenant_id')
    query = {"id": user_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    user = await db.usuarios.find_one(query, {"_id": 0, "senha": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    vinculos = await db.usuario_empresas.find({"usuario_id": user_id, "tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    empresa_ids = [v['empresa_id'] for v in vinculos]
    empresas = []
    if empresa_ids:
        empresas = await db.companies.find({"id": {"$in": empresa_ids}, "tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    user['empresas_vinculadas'] = empresas
    return user


@router.put("/usuarios/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate, current_user: Dict = Depends(require_admin)):
    tenant_id = current_user.get('tenant_id')
    user = await db.usuarios.find_one({"id": user_id, "tenant_id": tenant_id})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    update_fields = {}
    if user_data.nome:
        update_fields['nome'] = user_data.nome
    if user_data.email:
        existing = await db.usuarios.find_one({"email": user_data.email.lower(), "id": {"$ne": user_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        update_fields['email'] = user_data.email.lower()
    if user_data.senha:
        update_fields['senha'] = hash_password(user_data.senha)
    if user_data.perfil:
        update_fields['perfil'] = user_data.perfil
    if user_data.status:
        update_fields['status'] = user_data.status
    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    result = await db.usuarios.update_one({"id": user_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    await log_activity(current_user['id'], current_user['nome'], "Usuário atualizado", f"ID: {user_id}")
    return await db.usuarios.find_one({"id": user_id}, {"_id": 0, "senha": 0})


@router.delete("/usuarios/{user_id}")
async def delete_user(user_id: str, current_user: Dict = Depends(require_admin)):
    if user_id == current_user['id']:
        raise HTTPException(status_code=400, detail="Não é possível excluir seu próprio usuário")
    user = await db.usuarios.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    await db.usuario_empresas.delete_many({"usuario_id": user_id})
    await db.usuarios.delete_one({"id": user_id})
    await log_activity(
        current_user['id'], current_user['nome'],
        "Usuário excluído", f"Usuário: {user['nome']} ({user['email']})"
    )
    return {"message": "Usuário excluído"}


# User-Company Links
@router.post("/usuarios/{user_id}/empresas")
async def link_user_company(user_id: str, empresa_id: str, current_user: Dict = Depends(require_admin)):
    tenant_id = get_tenant_id(current_user)
    user_query = {"id": user_id}
    if tenant_id:
        user_query["tenant_id"] = tenant_id
    user = await db.usuarios.find_one(user_query)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    empresa_query = {"id": empresa_id}
    if tenant_id:
        empresa_query["tenant_id"] = tenant_id
    empresa = await db.companies.find_one(empresa_query)
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    existing = await db.usuario_empresas.find_one({"usuario_id": user_id, "empresa_id": empresa_id})
    if existing:
        raise HTTPException(status_code=400, detail="Empresa já vinculada a este usuário")
    vinculo = UserEmpresa(tenant_id=tenant_id, usuario_id=user_id, empresa_id=empresa_id)
    await db.usuario_empresas.insert_one(vinculo.model_dump())
    await log_activity(
        current_user['id'], current_user['nome'],
        "Empresa vinculada ao usuário", f"Usuário: {user['nome']} - Empresa: {empresa['name']}",
        tenant_id=tenant_id
    )
    return {"message": "Empresa vinculada com sucesso"}


@router.delete("/usuarios/{user_id}/empresas/{empresa_id}")
async def unlink_user_company(user_id: str, empresa_id: str, current_user: Dict = Depends(require_admin)):
    result = await db.usuario_empresas.delete_one({"usuario_id": user_id, "empresa_id": empresa_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado")
    await log_activity(
        current_user['id'], current_user['nome'],
        "Vínculo empresa-usuário removido", f"Usuário ID: {user_id} - Empresa ID: {empresa_id}"
    )
    return {"message": "Vínculo removido"}


@router.get("/usuarios/{user_id}/empresas")
async def get_user_companies(user_id: str, current_user: Dict = Depends(require_admin)):
    vinculos = await db.usuario_empresas.find({"usuario_id": user_id}, {"_id": 0}).to_list(1000)
    empresa_ids = [v['empresa_id'] for v in vinculos]
    if not empresa_ids:
        return []
    empresas = await db.companies.find({"id": {"$in": empresa_ids}}, {"_id": 0}).to_list(1000)
    return empresas


# Activity Logs
@router.get("/activity-logs")
async def get_activity_logs(
    usuario_id: Optional[str] = None, empresa_id: Optional[str] = None,
    acao: Optional[str] = None, limit: int = 100,
    current_user: Dict = Depends(require_admin)
):
    query = {}
    if usuario_id:
        query["usuario_id"] = usuario_id
    if empresa_id:
        query["empresa_id"] = empresa_id
    if acao:
        query["acao"] = {"$regex": acao, "$options": "i"}
    logs = await db.activity_logs.find(query, {"_id": 0}).sort("data_hora", -1).limit(limit).to_list(limit)
    return logs
