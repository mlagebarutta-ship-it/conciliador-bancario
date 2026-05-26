from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Optional, List
from datetime import datetime, timezone, timedelta

from database import db
from models.tenant import Tenant, TenantCreate, TenantUpdate
from models.user import User, UserCreate, PERFIL_SUPER_ADMIN, PERFIL_ADMIN_TENANT
from auth.helpers import (
    hash_password, require_super_admin, log_activity
)

router = APIRouter(prefix="/api/superadmin")


@router.get("/dashboard")
async def superadmin_dashboard(current_user: Dict = Depends(require_super_admin)):
    total_tenants = await db.tenants.count_documents({})
    tenants_ativos = await db.tenants.count_documents({"status": "ativo"})
    total_usuarios = await db.usuarios.count_documents({"perfil": {"$ne": PERFIL_SUPER_ADMIN}})
    total_empresas = await db.companies.count_documents({})
    total_extratos = await db.bank_statements.count_documents({})
    total_transacoes = await db.transactions.count_documents({})

    from_date = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    atividade_recente = await db.activity_logs.find(
        {"data_hora": {"$gte": from_date}}, {"_id": 0}
    ).sort("data_hora", -1).limit(20).to_list(20)

    planos = await db.tenants.aggregate([
        {"$group": {"_id": "$plano", "count": {"$sum": 1}}}
    ]).to_list(10)

    top_escritorios = await db.companies.aggregate([
        {"$group": {"_id": "$tenant_id", "total_empresas": {"$sum": 1}}},
        {"$sort": {"total_empresas": -1}},
        {"$limit": 5}
    ]).to_list(5)

    for item in top_escritorios:
        tenant = await db.tenants.find_one({"id": item["_id"]}, {"_id": 0, "nome": 1})
        item["nome"] = tenant["nome"] if tenant else "Desconhecido"

    return {
        "metricas": {
            "total_escritorios": total_tenants,
            "escritorios_ativos": tenants_ativos,
            "total_usuarios": total_usuarios,
            "total_empresas": total_empresas,
            "total_extratos": total_extratos,
            "total_transacoes": total_transacoes
        },
        "escritorios_por_plano": {p["_id"]: p["count"] for p in planos},
        "top_escritorios": top_escritorios,
        "atividade_recente": atividade_recente
    }


@router.get("/tenants")
async def list_tenants(current_user: Dict = Depends(require_super_admin)):
    tenants = await db.tenants.find({}, {"_id": 0}).sort("data_criacao", -1).to_list(1000)
    for tenant in tenants:
        tenant["total_usuarios"] = await db.usuarios.count_documents({"tenant_id": tenant["id"]})
        tenant["total_empresas"] = await db.companies.count_documents({"tenant_id": tenant["id"]})
        tenant["total_extratos"] = await db.bank_statements.count_documents({"tenant_id": tenant["id"]})
        if isinstance(tenant.get('data_criacao'), datetime):
            tenant['data_criacao'] = tenant['data_criacao'].isoformat()
    return tenants


@router.post("/tenants")
async def create_tenant(tenant_data: TenantCreate, current_user: Dict = Depends(require_super_admin)):
    if tenant_data.cnpj:
        existing = await db.tenants.find_one({"cnpj": tenant_data.cnpj})
        if existing:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    tenant = Tenant(
        nome=tenant_data.nome, cnpj=tenant_data.cnpj, email=tenant_data.email,
        telefone=tenant_data.telefone, endereco=tenant_data.endereco, plano=tenant_data.plano
    )
    doc = tenant.model_dump()
    doc['data_criacao'] = doc['data_criacao'].isoformat()
    await db.tenants.insert_one(doc)
    await log_activity(
        current_user['id'], current_user['nome'],
        "Escritório criado", detalhes=f"Nome: {tenant.nome}, CNPJ: {tenant.cnpj}"
    )
    return {**doc, "_id": None}


@router.get("/tenants/{tenant_id}")
async def get_tenant(tenant_id: str, current_user: Dict = Depends(require_super_admin)):
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Escritório não encontrado")
    tenant["usuarios"] = await db.usuarios.find({"tenant_id": tenant_id}, {"_id": 0, "senha": 0}).to_list(1000)
    tenant["empresas"] = await db.companies.find({"tenant_id": tenant_id}, {"_id": 0}).to_list(1000)
    tenant["total_extratos"] = await db.bank_statements.count_documents({"tenant_id": tenant_id})
    tenant["total_transacoes"] = await db.transactions.count_documents({"tenant_id": tenant_id})
    return tenant


@router.put("/tenants/{tenant_id}")
async def update_tenant(tenant_id: str, tenant_data: TenantUpdate, current_user: Dict = Depends(require_super_admin)):
    update_fields = {k: v for k, v in tenant_data.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    update_fields['data_atualizacao'] = datetime.now(timezone.utc).isoformat()
    result = await db.tenants.update_one({"id": tenant_id}, {"$set": update_fields})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Escritório não encontrado")
    await log_activity(
        current_user['id'], current_user['nome'],
        "Escritório atualizado", detalhes=f"ID: {tenant_id}, Campos: {list(update_fields.keys())}"
    )
    return await db.tenants.find_one({"id": tenant_id}, {"_id": 0})


@router.delete("/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str, current_user: Dict = Depends(require_super_admin)):
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Escritório não encontrado")
    await db.usuarios.delete_many({"tenant_id": tenant_id})
    await db.companies.delete_many({"tenant_id": tenant_id})
    await db.bank_statements.delete_many({"tenant_id": tenant_id})
    await db.transactions.delete_many({"tenant_id": tenant_id})
    await db.usuario_empresas.delete_many({"tenant_id": tenant_id})
    await db.activity_logs.delete_many({"tenant_id": tenant_id})
    await db.tenants.delete_one({"id": tenant_id})
    await log_activity(
        current_user['id'], current_user['nome'],
        "Escritório excluído", detalhes=f"Nome: {tenant['nome']}, CNPJ: {tenant.get('cnpj')}"
    )
    return {"message": "Escritório e dados relacionados excluídos"}


@router.post("/tenants/{tenant_id}/admin")
async def create_tenant_admin(tenant_id: str, user_data: UserCreate, current_user: Dict = Depends(require_super_admin)):
    tenant = await db.tenants.find_one({"id": tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Escritório não encontrado")
    existing = await db.usuarios.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    user = User(
        tenant_id=tenant_id, nome=user_data.nome,
        email=user_data.email.lower(), senha=hash_password(user_data.senha),
        perfil=PERFIL_ADMIN_TENANT
    )
    doc = user.model_dump()
    doc['data_criacao'] = doc['data_criacao'].isoformat()
    await db.usuarios.insert_one(doc)
    await log_activity(
        current_user['id'], current_user['nome'],
        "Admin de escritório criado", detalhes=f"Usuário: {user.nome}, Escritório: {tenant['nome']}"
    )
    return {"id": user.id, "nome": user.nome, "email": user.email, "perfil": user.perfil, "tenant_id": tenant_id}


@router.get("/usuarios")
async def list_all_users(tenant_id: Optional[str] = None, current_user: Dict = Depends(require_super_admin)):
    query = {"perfil": {"$ne": PERFIL_SUPER_ADMIN}}
    if tenant_id:
        query["tenant_id"] = tenant_id
    users = await db.usuarios.find(query, {"_id": 0, "senha": 0}).sort("data_criacao", -1).to_list(1000)
    for user in users:
        if user.get("tenant_id"):
            tenant = await db.tenants.find_one({"id": user["tenant_id"]}, {"_id": 0, "nome": 1})
            user["tenant_nome"] = tenant["nome"] if tenant else "Desconhecido"
        if isinstance(user.get('data_criacao'), datetime):
            user['data_criacao'] = user['data_criacao'].isoformat()
    return users


@router.put("/usuarios/{user_id}/reset-password")
async def reset_user_password(user_id: str, nova_senha: str, current_user: Dict = Depends(require_super_admin)):
    user = await db.usuarios.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.get("perfil") == PERFIL_SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Não é possível resetar senha de Super Admin")
    await db.usuarios.update_one({"id": user_id}, {"$set": {"senha": hash_password(nova_senha)}})
    await log_activity(
        current_user['id'], current_user['nome'],
        "Senha resetada", detalhes=f"Usuário: {user['nome']} ({user['email']})"
    )
    return {"message": "Senha resetada com sucesso"}


@router.put("/usuarios/{user_id}/toggle-status")
async def toggle_user_status(user_id: str, current_user: Dict = Depends(require_super_admin)):
    user = await db.usuarios.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.get("perfil") == PERFIL_SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Não é possível alterar status de Super Admin")
    new_status = "inativo" if user["status"] == "ativo" else "ativo"
    await db.usuarios.update_one({"id": user_id}, {"$set": {"status": new_status}})
    await log_activity(
        current_user['id'], current_user['nome'],
        f"Usuário {'ativado' if new_status == 'ativo' else 'desativado'}",
        detalhes=f"Usuário: {user['nome']} ({user['email']})"
    )
    return {"message": f"Usuário {new_status}", "status": new_status}


@router.get("/logs")
async def get_global_logs(
    tenant_id: Optional[str] = None, usuario_id: Optional[str] = None,
    acao: Optional[str] = None, limit: int = 100,
    current_user: Dict = Depends(require_super_admin)
):
    query = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if usuario_id:
        query["usuario_id"] = usuario_id
    if acao:
        query["acao"] = {"$regex": acao, "$options": "i"}
    logs = await db.activity_logs.find(query, {"_id": 0}).sort("data_hora", -1).limit(limit).to_list(limit)
    return logs


@router.post("/init")
async def init_super_admin():
    existing = await db.usuarios.find_one({"perfil": PERFIL_SUPER_ADMIN})
    if existing:
        raise HTTPException(status_code=400, detail="Super Admin já existe")
    super_admin = User(
        nome="Super Administrador", email="mlagebarutta@gmail.com",
        senha=hash_password("super123"), perfil=PERFIL_SUPER_ADMIN, tenant_id=None
    )
    doc = super_admin.model_dump()
    doc['data_criacao'] = doc['data_criacao'].isoformat()
    await db.usuarios.insert_one(doc)
    return {
        "message": "Super Admin criado com sucesso",
        "email": "mlagebarutta@gmail.com",
        "senha_temporaria": "super123",
        "aviso": "ALTERE A SENHA IMEDIATAMENTE!"
    }


@router.post("/migrate-data")
async def migrate_data_to_tenant(current_user: Dict = Depends(require_super_admin)):
    default_tenant = await db.tenants.find_one(
        {"$or": [{"nome": {"$regex": "Padrão", "$options": "i"}}, {}]}, {"_id": 0}
    )
    if not default_tenant:
        raise HTTPException(status_code=404, detail="Nenhum tenant encontrado. Crie um escritório primeiro.")
    tenant_id = default_tenant['id']
    results = {}

    for collection_name in ['companies', 'chart_of_accounts', 'account_items', 'classification_rules',
                            'bank_statements', 'classification_history', 'accounting_processes']:
        collection = db[collection_name]
        r = await collection.update_many(
            {"$or": [{"tenant_id": {"$exists": False}}, {"tenant_id": None}]},
            {"$set": {"tenant_id": tenant_id}}
        )
        results[collection_name] = r.modified_count

    await log_activity(
        usuario_id=current_user['id'], usuario_nome=current_user['nome'],
        acao="Migração de dados para tenant",
        detalhes=f"Tenant: {default_tenant['nome']}, Resultados: {results}"
    )
    return {"message": "Migração concluída", "tenant_id": tenant_id, "tenant_nome": default_tenant['nome'], "migrated": results}
