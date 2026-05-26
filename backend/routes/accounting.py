from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Optional
from datetime import datetime, timezone

from database import db
from models.accounting import AccountingProcess, AccountingProcessCreate, AccountingProcessUpdate
from auth.helpers import require_auth, get_tenant_id, get_user_allowed_company_ids

router = APIRouter(prefix="/api")


@router.get("/accounting-processes")
async def get_accounting_processes(
    company_id: Optional[str] = None, year: Optional[int] = None,
    month: Optional[int] = None, status: Optional[str] = None,
    responsible: Optional[str] = None, is_archived: Optional[bool] = False,
    current_user: Dict = Depends(require_auth)
):
    tenant_id = get_tenant_id(current_user)
    query = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    allowed_company_ids = await get_user_allowed_company_ids(current_user)
    if allowed_company_ids is not None:
        if not allowed_company_ids:
            return []
        if company_id:
            if company_id not in allowed_company_ids:
                raise HTTPException(status_code=403, detail="Você não tem acesso a esta empresa")
            query["company_id"] = company_id
        else:
            query["company_id"] = {"$in": allowed_company_ids}
    elif company_id:
        query["company_id"] = company_id
    if year:
        query["year"] = year
    if month:
        query["month"] = month
    if status:
        query["status"] = status
    if responsible:
        query["responsible"] = {"$regex": responsible, "$options": "i"}
    if is_archived is not None:
        query["is_archived"] = is_archived
    processes = await db.accounting_processes.find(query, {"_id": 0}).sort([
        ("year", -1), ("month", -1), ("company_name", 1)
    ]).to_list(1000)
    for p in processes:
        for date_field in ['created_at', 'updated_at', 'completed_at']:
            if isinstance(p.get(date_field), str):
                try:
                    p[date_field] = datetime.fromisoformat(p[date_field])
                except Exception:
                    pass
    return processes


@router.get("/accounting-processes/grouped")
async def get_accounting_processes_grouped(
    company_id: Optional[str] = None, is_archived: bool = False,
    current_user: Dict = Depends(require_auth)
):
    tenant_id = get_tenant_id(current_user)
    query = {"is_archived": is_archived}
    if tenant_id:
        query["tenant_id"] = tenant_id
    allowed_company_ids = await get_user_allowed_company_ids(current_user)
    if allowed_company_ids is not None:
        if not allowed_company_ids:
            return {}
        if company_id:
            if company_id not in allowed_company_ids:
                raise HTTPException(status_code=403, detail="Você não tem acesso a esta empresa")
            query["company_id"] = company_id
        else:
            query["company_id"] = {"$in": allowed_company_ids}
    elif company_id:
        query["company_id"] = company_id
    processes = await db.accounting_processes.find(query, {"_id": 0}).sort([
        ("company_name", 1), ("year", -1), ("month", -1)
    ]).to_list(10000)
    grouped = {}
    for p in processes:
        company_name = p['company_name']
        year = p['year']
        month = p['month']
        if company_name not in grouped:
            grouped[company_name] = {'company_id': p['company_id'], 'company_name': company_name, 'years': {}}
        if year not in grouped[company_name]['years']:
            grouped[company_name]['years'][year] = {'months': {}}
        grouped[company_name]['years'][year]['months'][month] = p
    return grouped


@router.get("/accounting-processes/stats")
async def get_accounting_processes_stats(current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"is_archived": False}
    if tenant_id:
        query["tenant_id"] = tenant_id
    allowed_company_ids = await get_user_allowed_company_ids(current_user)
    if allowed_company_ids is not None:
        if not allowed_company_ids:
            return {'total': 0, 'by_status': {}, 'companies_with_pending': 0, 'overdue_count': 0, 'in_progress_count': 0, 'completed_count': 0}
        query["company_id"] = {"$in": allowed_company_ids}
    all_processes = await db.accounting_processes.find(query, {"_id": 0}).to_list(10000)
    now = datetime.now(timezone.utc)
    stats = {'total': len(all_processes), 'by_status': {}, 'companies_with_pending': set(), 'overdue_count': 0, 'in_progress_count': 0, 'completed_count': 0}
    for p in all_processes:
        status = p.get('status', 'NAO_INICIADO')
        stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
        p_year = p.get('year', 0)
        p_month = p.get('month', 0)
        is_past = (p_year < now.year) or (p_year == now.year and p_month < now.month)
        if status != 'CONCLUIDO' and is_past:
            stats['overdue_count'] += 1
            stats['companies_with_pending'].add(p.get('company_name', ''))
        if status == 'EM_PROCESSAMENTO':
            stats['in_progress_count'] += 1
        elif status == 'CONCLUIDO':
            stats['completed_count'] += 1
    stats['companies_with_pending'] = len(stats['companies_with_pending'])
    return stats


@router.get("/accounting-processes/responsibles/list")
async def get_responsibles(current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"responsible": {"$ne": None, "$ne": ""}}
    if tenant_id:
        query["tenant_id"] = tenant_id
    processes = await db.accounting_processes.find(query, {"responsible": 1, "_id": 0}).to_list(10000)
    responsibles = list(set(p['responsible'] for p in processes if p.get('responsible')))
    return sorted(responsibles)


@router.post("/accounting-processes")
async def create_accounting_process(process: AccountingProcessCreate, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    company_query = {"id": process.company_id}
    if tenant_id:
        company_query["tenant_id"] = tenant_id
    company = await db.companies.find_one(company_query, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    existing_query = {"company_id": process.company_id, "year": process.year, "month": process.month, "is_archived": False}
    if tenant_id:
        existing_query["tenant_id"] = tenant_id
    existing = await db.accounting_processes.find_one(existing_query)
    if existing:
        raise HTTPException(status_code=400, detail="Já existe um processamento para este período")
    process_obj = AccountingProcess(
        tenant_id=tenant_id, company_id=process.company_id, company_name=company['name'],
        year=process.year, month=process.month, period=f"{process.month:02d}/{process.year}",
        responsible=process.responsible, observations=process.observations
    )
    doc = process_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    if doc['completed_at']:
        doc['completed_at'] = doc['completed_at'].isoformat()
    await db.accounting_processes.insert_one(doc)
    return process_obj


@router.post("/accounting-processes/bulk-create")
async def bulk_create_accounting_processes(
    company_id: str, start_year: int, start_month: int,
    end_year: int, end_month: int, responsible: Optional[str] = None,
    current_user: Dict = Depends(require_auth)
):
    tenant_id = get_tenant_id(current_user)
    company_query = {"id": company_id}
    if tenant_id:
        company_query["tenant_id"] = tenant_id
    company = await db.companies.find_one(company_query, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    created = []
    current = datetime(start_year, start_month, 1)
    end = datetime(end_year, end_month, 1)
    while current <= end:
        existing_query = {"company_id": company_id, "year": current.year, "month": current.month, "is_archived": False}
        if tenant_id:
            existing_query["tenant_id"] = tenant_id
        existing = await db.accounting_processes.find_one(existing_query)
        if not existing:
            process_obj = AccountingProcess(
                tenant_id=tenant_id, company_id=company_id, company_name=company['name'],
                year=current.year, month=current.month, period=f"{current.month:02d}/{current.year}",
                responsible=responsible
            )
            doc = process_obj.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            if doc['completed_at']:
                doc['completed_at'] = doc['completed_at'].isoformat()
            await db.accounting_processes.insert_one(doc)
            created.append({"year": current.year, "month": current.month})
        if current.month == 12:
            current = datetime(current.year + 1, 1, 1)
        else:
            current = datetime(current.year, current.month + 1, 1)
    return {"created": created, "count": len(created)}


@router.get("/accounting-processes/{process_id}")
async def get_accounting_process(process_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": process_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    process = await db.accounting_processes.find_one(query, {"_id": 0})
    if not process:
        raise HTTPException(status_code=404, detail="Processamento não encontrado")
    return process


@router.put("/accounting-processes/{process_id}")
async def update_accounting_process(process_id: str, update: AccountingProcessUpdate, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": process_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    if update_data.get('status') == 'CONCLUIDO':
        update_data['completed_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.accounting_processes.update_one(query, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Processamento não encontrado")
    return await db.accounting_processes.find_one(query, {"_id": 0})


@router.delete("/accounting-processes/{process_id}")
async def delete_accounting_process(process_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": process_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.accounting_processes.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Processamento não encontrado")
    return {"message": "Processamento excluído"}


@router.post("/accounting-processes/{process_id}/archive")
async def archive_accounting_process(process_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": process_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.accounting_processes.update_one(query, {"$set": {"is_archived": True, "updated_at": datetime.now(timezone.utc).isoformat()}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Processamento não encontrado")
    return {"message": "Processamento arquivado"}


@router.post("/accounting-processes/archive-old")
async def archive_old_processes(months_old: int = 12, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    cutoff_date = datetime.now(timezone.utc)
    cutoff_year = cutoff_date.year
    cutoff_month = cutoff_date.month - months_old
    while cutoff_month <= 0:
        cutoff_year -= 1
        cutoff_month += 12
    query = {
        "status": "CONCLUIDO", "is_archived": False,
        "$or": [
            {"year": {"$lt": cutoff_year}},
            {"$and": [{"year": cutoff_year}, {"month": {"$lt": cutoff_month}}]}
        ]
    }
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.accounting_processes.update_many(query, {"$set": {"is_archived": True, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"archived_count": result.modified_count}


@router.post("/accounting-processes/{process_id}/link-statement")
async def link_statement_to_process(process_id: str, statement_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    process_query = {"id": process_id}
    if tenant_id:
        process_query["tenant_id"] = tenant_id
    process = await db.accounting_processes.find_one(process_query, {"_id": 0})
    if not process:
        raise HTTPException(status_code=404, detail="Processamento não encontrado")
    statement_query = {"id": statement_id}
    if tenant_id:
        statement_query["tenant_id"] = tenant_id
    statement = await db.bank_statements.find_one(statement_query, {"_id": 0})
    if not statement:
        raise HTTPException(status_code=404, detail="Extrato não encontrado")
    statement_ids = process.get('statement_ids', [])
    if statement_id not in statement_ids:
        statement_ids.append(statement_id)
    total_trans = 0
    classified_trans = 0
    for sid in statement_ids:
        trans = await db.transactions.find({"statement_id": sid}, {"_id": 0}).to_list(10000)
        total_trans += len(trans)
        classified_trans += len([t for t in trans if t.get('status') == 'CLASSIFICADO'])
    await db.accounting_processes.update_one(
        process_query,
        {"$set": {
            "statement_ids": statement_ids, "total_transactions": total_trans,
            "classified_transactions": classified_trans,
            "pending_transactions": total_trans - classified_trans,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Extrato vinculado ao processamento"}
