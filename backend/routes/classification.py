from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional
from datetime import datetime

from database import db
from models.transaction import ClassificationRule, ClassificationRuleCreate
from auth.helpers import require_auth, get_tenant_id

router = APIRouter(prefix="/api")


@router.post("/classification-rules", response_model=ClassificationRule)
async def create_rule(rule: ClassificationRuleCreate, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    company_name = None
    if rule.company_id:
        company = await db.companies.find_one({"id": rule.company_id, "tenant_id": tenant_id}, {"_id": 0})
        if company:
            company_name = company.get('name')
        else:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")
    rule_obj = ClassificationRule(**rule.model_dump(), tenant_id=tenant_id, company_name=company_name)
    doc = rule_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.classification_rules.insert_one(doc)
    return rule_obj


@router.get("/classification-rules", response_model=List[ClassificationRule])
async def get_rules(company_id: Optional[str] = None, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"tenant_id": tenant_id} if tenant_id else {}
    if company_id:
        query["$or"] = [
            {"company_id": company_id},
            {"company_id": None},
            {"company_id": {"$exists": False}}
        ]
    rules = await db.classification_rules.find(query, {"_id": 0}).sort("priority", -1).to_list(1000)
    for r in rules:
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return rules


@router.put("/classification-rules/{rule_id}", response_model=ClassificationRule)
async def update_rule(rule_id: str, rule: ClassificationRuleCreate, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": rule_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    company_name = None
    if rule.company_id:
        company = await db.companies.find_one({"id": rule.company_id, "tenant_id": tenant_id}, {"_id": 0})
        if company:
            company_name = company.get('name')
        else:
            raise HTTPException(status_code=404, detail="Empresa não encontrada")
    rule_data = rule.model_dump()
    rule_data['company_name'] = company_name
    result = await db.classification_rules.update_one(query, {"$set": rule_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    updated_rule = await db.classification_rules.find_one(query, {"_id": 0})
    if isinstance(updated_rule.get('created_at'), str):
        updated_rule['created_at'] = datetime.fromisoformat(updated_rule['created_at'])
    return updated_rule


@router.delete("/classification-rules/{rule_id}")
async def delete_rule(rule_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": rule_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.classification_rules.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    return {"message": "Regra excluída com sucesso"}


# Classification History
@router.get("/classification-history")
async def get_classification_history(company_id: Optional[str] = None, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if company_id:
        query["company_id"] = company_id
    history = await db.classification_history.find(query, {"_id": 0}).sort("usage_count", -1).to_list(1000)
    return history


@router.delete("/classification-history/{history_id}")
async def delete_classification_history(history_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": history_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.classification_history.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return {"message": "Registro removido do histórico de aprendizado"}


@router.delete("/classification-history/company/{company_id}")
async def clear_company_history(company_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"company_id": company_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.classification_history.delete_many(query)
    return {"message": f"{result.deleted_count} registros removidos"}
