from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import List
from datetime import datetime, timezone
import uuid

from database import db
from models.transaction import ExtractedTransaction, ConversionPreview
from services.parsers import (
    extract_transactions_from_excel, extract_transactions_from_pdf, generate_ofx_content
)
from services.classification import classify_transaction

router = APIRouter(prefix="/api")


@router.post("/converter/preview")
async def preview_conversion(file: UploadFile = File(...)):
    file_content = await file.read()
    file_name = file.filename.lower()
    if file_name.endswith('.pdf'):
        file_type = 'PDF'
        transactions = extract_transactions_from_pdf(file_content)
    elif file_name.endswith(('.xlsx', '.xls')):
        file_type = 'Excel'
        transactions = extract_transactions_from_excel(file_content, file_name)
    elif file_name.endswith('.csv'):
        file_type = 'CSV'
        transactions = extract_transactions_from_excel(file_content, file_name)
    else:
        raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Use PDF, XLSX, XLS ou CSV.")
    if not transactions:
        raise HTTPException(status_code=400, detail="Não foi possível extrair transações do arquivo. Verifique se o formato está correto.")
    total_credits = sum(t['value'] for t in transactions if t['value'] > 0)
    total_debits = sum(abs(t['value']) for t in transactions if t['value'] < 0)
    balance = total_credits - total_debits
    extracted = [
        ExtractedTransaction(
            date=t['date'], description=t['description'],
            value=t['value'], type=t['type'], fit_id=str(uuid.uuid4())[:12]
        ) for t in transactions
    ]
    return ConversionPreview(
        file_name=file.filename, file_type=file_type,
        total_transactions=len(transactions),
        total_credits=total_credits, total_debits=total_debits,
        balance=balance, transactions=extracted
    )


@router.post("/converter/generate-ofx")
async def generate_ofx_file(transactions: List[ExtractedTransaction], bank_name: str = "BANCO"):
    trans_list = [
        {'date': t.date, 'description': t.description, 'value': t.value, 'type': t.type, 'fit_id': t.fit_id}
        for t in transactions
    ]
    ofx_content = generate_ofx_content(trans_list, bank_name)
    temp_file = f"/tmp/extrato_{uuid.uuid4()}.ofx"
    with open(temp_file, 'w', encoding='utf-8') as f:
        f.write(ofx_content)
    return FileResponse(
        temp_file, media_type='application/x-ofx',
        filename=f"extrato_convertido_{datetime.now().strftime('%Y%m%d_%H%M%S')}.ofx"
    )


@router.post("/converter/import-to-system")
async def import_converted_to_system(
    transactions: List[ExtractedTransaction],
    company_id: str, chart_id: str,
    bank_name: str = "BANCO", period: str = ""
):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    chart = await db.chart_of_accounts.find_one({"id": chart_id}, {"_id": 0})
    if not chart:
        raise HTTPException(status_code=404, detail="Plano de contas não encontrado")
    if not period:
        dates = [t.date for t in transactions]
        if dates:
            parts = dates[0].split('/')
            if len(parts) == 3:
                period = f"{parts[1]}/{parts[2]}"
            else:
                period = datetime.now().strftime('%m/%Y')
        else:
            period = datetime.now().strftime('%m/%Y')
    total_inflows = sum(t.value for t in transactions if t.value > 0)
    total_outflows = sum(abs(t.value) for t in transactions if t.value < 0)
    statement_id = str(uuid.uuid4())
    statement = {
        'id': statement_id, 'company_id': company_id, 'chart_id': chart_id,
        'bank_name': bank_name, 'period': period,
        'filename': f'convertido_ofx_{period.replace("/", "_")}.ofx',
        'total_transactions': len(transactions), 'classified_count': 0,
        'manual_count': len(transactions), 'total_inflows': total_inflows,
        'total_outflows': total_outflows, 'balance': total_inflows - total_outflows,
        'status': 'COMPLETED', 'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.bank_statements.insert_one(statement)
    created_transactions = []
    for t in transactions:
        trans_type = 'C' if t.value > 0 else 'D'
        classification = await classify_transaction(t.description, abs(t.value), trans_type, chart_id, company_id)
        trans = {
            'id': str(uuid.uuid4()), 'statement_id': statement_id,
            'date': t.date, 'description': t.description,
            'amount': abs(t.value), 'transaction_type': trans_type,
            'debit_account': classification['debit_account'],
            'credit_account': classification['credit_account'],
            'status': classification['status'],
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.transactions.insert_one(trans)
        created_transactions.append(trans)
    classified_count = len([t for t in created_transactions if t['status'] == 'CLASSIFICADO'])
    manual_count = len(transactions) - classified_count
    await db.bank_statements.update_one(
        {'id': statement_id},
        {'$set': {'classified_count': classified_count, 'manual_count': manual_count}}
    )
    return {
        'statement_id': statement_id, 'total_transactions': len(transactions),
        'classified_count': classified_count, 'manual_count': manual_count,
        'message': 'Extrato importado com sucesso para o sistema de conciliação'
    }
