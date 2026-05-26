from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from datetime import datetime, timezone

from database import db
from auth.helpers import require_auth, get_tenant_id, get_user_allowed_company_ids

router = APIRouter(prefix="/api")


@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: Dict = Depends(require_auth)):
    tenant_id = get_tenant_id(current_user)
    now = datetime.now(timezone.utc)

    company_query = {"tenant_id": tenant_id} if tenant_id else {}
    allowed_company_ids = await get_user_allowed_company_ids(current_user)
    if allowed_company_ids is not None:
        if not allowed_company_ids:
            return {
                "summary": {
                    "total_companies": 0, "companies_up_to_date": 0,
                    "companies_behind": 0, "companies_very_behind": 0,
                    "companies_no_statement": 0, "total_statements": 0,
                    "total_transactions": 0, "classified_transactions": 0,
                    "pending_transactions": 0, "total_months_pending": 0
                },
                "most_behind_companies": [], "most_pending_companies": [],
                "companies_without_current_month": [], "all_companies_status": []
            }
        company_query["id"] = {"$in": allowed_company_ids}

    companies = await db.companies.find(company_query, {"_id": 0}).to_list(1000)
    total_companies = len(companies)

    statement_query = {"tenant_id": tenant_id} if tenant_id else {}
    if allowed_company_ids is not None:
        statement_query["company_id"] = {"$in": allowed_company_ids}
    statements = await db.bank_statements.find(statement_query, {"_id": 0}).to_list(10000)
    statement_ids = [s['id'] for s in statements]

    if statement_ids:
        pending_transactions = await db.transactions.count_documents({
            "statement_id": {"$in": statement_ids}, "status": "CLASSIFICAR MANUALMENTE"
        })
        total_transactions = await db.transactions.count_documents({"statement_id": {"$in": statement_ids}})
    else:
        pending_transactions = 0
        total_transactions = 0
    classified_transactions = total_transactions - pending_transactions

    company_status = {}
    for company in companies:
        company_id = company['id']
        company_statements = [s for s in statements if s.get('company_id') == company_id]

        if not company_statements:
            company_status[company_id] = {
                'company_name': company['name'], 'cnpj': company.get('cnpj', ''),
                'last_period': None, 'last_period_date': None,
                'months_behind': 999, 'status': 'SEM_EXTRATO', 'pending_transactions': 0
            }
        else:
            def parse_period(period_str):
                try:
                    parts = period_str.split('/')
                    if len(parts) == 2:
                        month, year = parts
                        return f"{year}{month.zfill(2)}"
                except Exception:
                    pass
                return "000000"

            sorted_statements = sorted(company_statements, key=lambda s: parse_period(s.get('period', '')), reverse=True)
            last_statement = sorted_statements[0]
            last_period = last_statement.get('period', '')
            last_period_key = parse_period(last_period)

            try:
                if len(last_period_key) == 6:
                    last_year = int(last_period_key[:4])
                    last_month = int(last_period_key[4:])
                    months_behind = (now.year - last_year) * 12 + (now.month - last_month)
                else:
                    months_behind = 999
            except Exception:
                months_behind = 999

            company_pending = 0
            for s in company_statements:
                trans_pending = await db.transactions.count_documents({
                    "statement_id": s['id'], "status": "CLASSIFICAR MANUALMENTE"
                })
                company_pending += trans_pending

            if months_behind <= 0:
                status = 'EM_DIA'
            elif months_behind <= 2:
                status = 'ATRASADA'
            else:
                status = 'MUITO_ATRASADA'

            company_status[company_id] = {
                'company_name': company['name'], 'cnpj': company.get('cnpj', ''),
                'last_period': last_period, 'last_period_date': last_period_key,
                'months_behind': months_behind, 'status': status,
                'pending_transactions': company_pending
            }

    companies_up_to_date = len([c for c in company_status.values() if c['status'] == 'EM_DIA'])
    companies_behind = len([c for c in company_status.values() if c['status'] == 'ATRASADA'])
    companies_very_behind = len([c for c in company_status.values() if c['status'] == 'MUITO_ATRASADA'])
    companies_no_statement = len([c for c in company_status.values() if c['status'] == 'SEM_EXTRATO'])
    total_months_pending = sum(c['months_behind'] for c in company_status.values() if c['months_behind'] < 999)

    most_behind = sorted(
        [c for c in company_status.values() if c['months_behind'] > 0 and c['months_behind'] < 999],
        key=lambda x: x['months_behind'], reverse=True
    )[:10]

    most_pending = sorted(
        [c for c in company_status.values() if c['pending_transactions'] > 0],
        key=lambda x: x['pending_transactions'], reverse=True
    )[:10]

    companies_without_current = [
        c for c in company_status.values() if c['months_behind'] > 0 or c['status'] == 'SEM_EXTRATO'
    ]

    company_list = sorted(
        list(company_status.values()),
        key=lambda x: (x['months_behind'] if x['months_behind'] < 999 else 9999, x['company_name'])
    )

    return {
        "summary": {
            "total_companies": total_companies,
            "companies_up_to_date": companies_up_to_date,
            "companies_behind": companies_behind,
            "companies_very_behind": companies_very_behind,
            "companies_no_statement": companies_no_statement,
            "total_statements": len(statements),
            "total_transactions": total_transactions,
            "classified_transactions": classified_transactions,
            "pending_transactions": pending_transactions,
            "total_months_pending": total_months_pending
        },
        "most_behind_companies": most_behind,
        "most_pending_companies": most_pending,
        "companies_without_current_month": companies_without_current[:10],
        "all_companies_status": company_list
    }
