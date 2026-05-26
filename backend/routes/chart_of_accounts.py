from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Dict, List, Optional
from datetime import datetime
import io
import pandas as pd

from database import db
from models.company import ChartOfAccounts, ChartOfAccountsCreate, AccountItem, AccountItemCreate
from auth.helpers import require_auth, get_tenant_id

router = APIRouter(prefix="/api")


@router.post("/chart-of-accounts", response_model=ChartOfAccounts)
async def create_chart(chart: ChartOfAccountsCreate, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    chart_obj = ChartOfAccounts(**chart.model_dump(), tenant_id=tenant_id)
    doc = chart_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.chart_of_accounts.insert_one(doc)
    return chart_obj


@router.get("/chart-of-accounts", response_model=List[ChartOfAccounts])
async def get_charts(company_id: Optional[str] = None, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if company_id:
        query["company_id"] = company_id
    charts = await db.chart_of_accounts.find(query, {"_id": 0}).to_list(1000)
    for c in charts:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return charts


@router.delete("/chart-of-accounts/{chart_id}")
async def delete_chart(chart_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": chart_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.chart_of_accounts.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plano de contas não encontrado")
    await db.account_items.delete_many({"chart_id": chart_id})
    return {"message": "Plano de contas excluído com sucesso"}


@router.post("/chart-of-accounts/{chart_id}/import")
async def import_chart_accounts(chart_id: str, file: UploadFile = File(...), current_user: Dict = Depends(require_auth)):
    try:
        tenant_id = get_tenant_id(current_user)
        query = {"id": chart_id}
        if tenant_id:
            query["tenant_id"] = tenant_id
        chart = await db.chart_of_accounts.find_one(query, {"_id": 0})
        if not chart:
            raise HTTPException(status_code=404, detail="Plano de contas não encontrado")
        content = await file.read()
        df = None
        try:
            df = pd.read_excel(io.BytesIO(content), engine='openpyxl')
        except Exception:
            try:
                df = pd.read_excel(io.BytesIO(content), engine='xlrd')
            except Exception:
                raise HTTPException(status_code=400, detail="Erro ao ler arquivo. Use formato XLSX ou XLS válido")
        df.columns = df.columns.str.strip()
        column_mapping = {
            'codigo': 'Código', 'código': 'Código',
            'descricao': 'Descrição', 'descrição': 'Descrição',
            'classificacao': 'Classificação', 'classificação': 'Classificação',
            'tipo': 'Tipo'
        }
        df.columns = [column_mapping.get(col.lower(), col) for col in df.columns]
        required_columns = ['Código', 'Descrição', 'Classificação', 'Tipo']
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Arquivo deve conter as colunas: Código, Descrição, Classificação, Tipo. Faltando: {', '.join(missing_cols)}"
            )
        imported_count = 0
        errors = []
        for idx, row in df.iterrows():
            try:
                descricao = str(row['Descrição']).strip() if pd.notna(row['Descrição']) else ''
                classificacao = str(row['Classificação']).strip() if pd.notna(row['Classificação']) else ''
                tipo = str(row['Tipo']).upper().strip() if pd.notna(row['Tipo']) else ''
                if not classificacao or classificacao == 'nan':
                    errors.append(f"Linha {idx + 2}: Classificação vazia")
                    continue
                if not descricao or descricao == 'nan':
                    errors.append(f"Linha {idx + 2}: Descrição vazia")
                    continue
                if tipo not in ['ATIVO', 'PASSIVO', 'RECEITA', 'DESPESA']:
                    errors.append(f"Linha {idx + 2}: Tipo '{tipo}' inválido. Use: ATIVO, PASSIVO, RECEITA ou DESPESA")
                    continue
                codigo_conta = classificacao
                existing = await db.account_items.find_one({"chart_id": chart_id, "code": codigo_conta}, {"_id": 0})
                if existing:
                    await db.account_items.update_one(
                        {"chart_id": chart_id, "code": codigo_conta},
                        {"$set": {"description": descricao, "account_type": tipo}}
                    )
                else:
                    account = AccountItem(
                        chart_id=chart_id, code=codigo_conta,
                        description=descricao, account_type=tipo, tenant_id=tenant_id
                    )
                    doc = account.model_dump()
                    doc['created_at'] = doc['created_at'].isoformat()
                    await db.account_items.insert_one(doc)
                imported_count += 1
            except Exception as e:
                errors.append(f"Linha {idx + 2}: {str(e)}")
        return {
            "message": f"Importação concluída: {imported_count} contas processadas",
            "imported_count": imported_count,
            "errors": errors if errors else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")


@router.post("/account-items", response_model=AccountItem)
async def create_account_item(item: AccountItemCreate, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    item_obj = AccountItem(**item.model_dump(), tenant_id=tenant_id)
    doc = item_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.account_items.insert_one(doc)
    return item_obj


@router.get("/account-items", response_model=List[AccountItem])
async def get_account_items(chart_id: Optional[str] = None, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {}
    if tenant_id:
        query["tenant_id"] = tenant_id
    if chart_id:
        query["chart_id"] = chart_id
    items = await db.account_items.find(query, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items


@router.delete("/account-items/{item_id}")
async def delete_account_item(item_id: str, current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    query = {"id": item_id}
    if tenant_id:
        query["tenant_id"] = tenant_id
    result = await db.account_items.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return {"message": "Conta excluída com sucesso"}
