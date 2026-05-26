from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from datetime import datetime

from database import db
from models.company import Company, CompanyCreate
from auth.helpers import require_auth, get_tenant_id, get_user_allowed_company_ids, log_activity
from utils.helpers import clean_cnpj

router = APIRouter(prefix="/api")


@router.post("/companies", response_model=Company)
async def create_company(company: CompanyCreate, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    company_obj = Company(**company.model_dump(), tenant_id=tenant_id)
    doc = company_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['cnpj'] = clean_cnpj(doc['cnpj'])
    await db.companies.insert_one(doc)
    await log_activity(
        usuario_id=current_user['id'], usuario_nome=current_user['nome'],
        acao="Cadastrou empresa", detalhes=f"Empresa: {company.name}",
        tenant_id=tenant_id, tenant_nome=current_user.get('tenant', {}).get('nome')
    )
    return company_obj


@router.get("/companies", response_model=List[Company])
async def get_companies(current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"tenant_id": tenant_id} if tenant_id else {}
    allowed_company_ids = await get_user_allowed_company_ids(current_user)
    if allowed_company_ids is not None:
        if not allowed_company_ids:
            return []
        query["id"] = {"$in": allowed_company_ids}
    companies = await db.companies.find(query, {"_id": 0}).to_list(1000)
    for c in companies:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return companies


@router.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": company_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    allowed_company_ids = await get_user_allowed_company_ids(current_user)
    if allowed_company_ids is not None and company_id not in allowed_company_ids:
        raise HTTPException(status_code=403, detail="Você não tem acesso a esta empresa")
    company = await db.companies.find_one(query, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    if isinstance(company.get('created_at'), str):
        company['created_at'] = datetime.fromisoformat(company['created_at'])
    return company


@router.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company: CompanyCreate, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": company_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    existing = await db.companies.find_one(query, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    update_data = company.model_dump()
    update_data['cnpj'] = clean_cnpj(update_data['cnpj'])
    result = await db.companies.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return await get_company(company_id, current_user)


@router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": company_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    company = await db.companies.find_one(query, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    result = await db.companies.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    await log_activity(
        usuario_id=current_user['id'], usuario_nome=current_user['nome'],
        acao="Excluiu empresa", detalhes=f"Empresa: {company.get('name')}",
        tenant_id=tenant_id, tenant_nome=current_user.get('tenant', {}).get('nome')
    )
    return {"message": "Empresa excluída com sucesso"}
