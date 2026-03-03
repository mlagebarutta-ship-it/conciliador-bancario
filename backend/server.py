from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
import ofxparse
import pdfplumber
import io
import re
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    cnpj: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyCreate(BaseModel):
    cnpj: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class ChartOfAccounts(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChartOfAccountsCreate(BaseModel):
    company_id: str
    name: str
    description: Optional[str] = None

class AccountItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chart_id: str
    code: str
    description: str
    account_type: str  # ATIVO, PASSIVO, RECEITA, DESPESA
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccountItemCreate(BaseModel):
    chart_id: str
    code: str
    description: str
    account_type: str

class ClassificationRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    keyword: str
    debit_account_code: Optional[str] = None
    credit_account_code: Optional[str] = None
    description: Optional[str] = None
    priority: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ClassificationRuleCreate(BaseModel):
    keyword: str
    debit_account_code: Optional[str] = None
    credit_account_code: Optional[str] = None
    description: Optional[str] = None
    priority: int = 0

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    statement_id: str
    date: str
    description: str
    document: Optional[str] = None
    amount: float
    transaction_type: str  # C or D
    debit_account: Optional[str] = None
    credit_account: Optional[str] = None
    status: str  # CLASSIFICADO or CLASSIFICAR MANUALMENTE
    notes: Optional[str] = None

class TransactionCreate(BaseModel):
    date: str
    description: str
    document: Optional[str] = None
    amount: float
    transaction_type: str

class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    document: Optional[str] = None
    amount: Optional[float] = None
    debit_account: Optional[str] = None
    credit_account: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class BankStatement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    chart_id: str
    filename: str
    bank_name: str
    period: str  # MM/YYYY
    total_transactions: int
    classified_count: int
    manual_count: int
    total_inflows: float
    total_outflows: float
    balance: float
    status: str  # PROCESSING, COMPLETED, ERROR
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed_at: Optional[datetime] = None

class BankStatementCreate(BaseModel):
    company_id: str
    chart_id: str
    bank_name: str
    period: str

class ProcessingResult(BaseModel):
    statement: BankStatement
    transactions: List[Transaction]

# ============= HELPER FUNCTIONS =============

def clean_cnpj(cnpj: str) -> str:
    """Remove caracteres especiais do CNPJ"""
    return re.sub(r'[^0-9]', '', cnpj)

def parse_pdf_statement(file_content: bytes) -> List[Dict[str, Any]]:
    """Parse PDF bank statement"""
    try:
        transactions = []
        
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            full_text = ""
            for page in pdf.pages:
                full_text += page.extract_text() + "\n"
            
            # Padrões comuns em extratos bancários brasileiros
            # Formato: DD/MM/YYYY ou DD/MM  Descrição  Valor
            lines = full_text.split('\n')
            
            for line in lines:
                # Tentar encontrar data no formato DD/MM/YYYY ou DD/MM
                date_match = re.search(r'(\d{2}/\d{2}/\d{4}|\d{2}/\d{2})', line)
                if not date_match:
                    continue
                
                date_str = date_match.group(1)
                # Se só tem DD/MM, adicionar ano atual
                if len(date_str) == 5:
                    date_str += "/2026"
                
                # Extrair valor (formato brasileiro: 1.234,56 ou -1.234,56)
                value_match = re.search(r'([+-]?\s*\d{1,3}(?:\.\d{3})*,\d{2})', line)
                if not value_match:
                    continue
                
                value_str = value_match.group(1).replace('.', '').replace(',', '.').replace(' ', '')
                try:
                    amount = float(value_str)
                except:
                    continue
                
                # Extrair descrição (texto entre data e valor)
                date_end = date_match.end()
                value_start = value_match.start()
                description = line[date_end:value_start].strip()
                
                # Limpar descrição
                description = re.sub(r'\s+', ' ', description)
                
                if description and amount != 0:
                    transactions.append({
                        'date': date_str,
                        'description': description,
                        'amount': amount,
                        'transaction_type': 'C' if amount > 0 else 'D'
                    })
        
        if not transactions:
            raise HTTPException(status_code=400, detail="Não foi possível extrair transações do PDF. Verifique se o formato é compatível.")
        
        return transactions
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar PDF: {str(e)}")

def parse_excel_statement(file_content: bytes) -> List[Dict[str, Any]]:
    """Parse Excel bank statement"""
    try:
        df = pd.read_excel(io.BytesIO(file_content))
        
        # Remove linhas vazias e cabeçalhos duplicados
        df = df.dropna(how='all')
        
        # Detectar colunas de data, descrição e valor
        transactions = []
        
        for _, row in df.iterrows():
            row_dict = row.to_dict()
            
            # Tentar encontrar data
            date_val = None
            for col in row_dict:
                val = row_dict[col]
                if pd.notna(val):
                    try:
                        if isinstance(val, datetime):
                            date_val = val.strftime('%d/%m/%Y')
                            break
                        elif isinstance(val, str) and '/' in val:
                            parts = val.split('/')
                            if len(parts) == 3:
                                date_val = val
                                break
                    except:
                        pass
            
            if not date_val:
                continue
            
            # Buscar descrição (normalmente texto longo)
            description = ""
            for col in row_dict:
                val = row_dict[col]
                if pd.notna(val) and isinstance(val, str) and len(val) > 10:
                    if val != date_val:
                        description = val
                        break
            
            # Buscar valor (número)
            amount = 0
            for col in row_dict:
                val = row_dict[col]
                if pd.notna(val):
                    try:
                        if isinstance(val, (int, float)):
                            if val != 0:
                                amount = float(val)
                                break
                        elif isinstance(val, str):
                            val_clean = val.replace('R$', '').replace('.', '').replace(',', '.').strip()
                            if val_clean.replace('-', '').replace('+', '').replace('.', '').isdigit():
                                amount = float(val_clean)
                                break
                    except:
                        pass
            
            if description and amount != 0:
                transactions.append({
                    'date': date_val,
                    'description': description.strip(),
                    'amount': amount,
                    'transaction_type': 'C' if amount > 0 else 'D'
                })
        
        return transactions
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar Excel: {str(e)}")

def parse_ofx_statement(file_content: bytes) -> List[Dict[str, Any]]:
    """Parse OFX bank statement"""
    try:
        ofx = ofxparse.OfxParser.parse(io.BytesIO(file_content))
        transactions = []
        
        for account in ofx.accounts:
            for trans in account.statement.transactions:
                amount = float(trans.amount)
                transactions.append({
                    'date': trans.date.strftime('%d/%m/%Y'),
                    'description': trans.memo or trans.payee or 'Sem descrição',
                    'document': trans.id or None,
                    'amount': amount,
                    'transaction_type': 'C' if amount > 0 else 'D'
                })
        
        return transactions
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar OFX: {str(e)}")

async def classify_transaction(description: str, amount: float, trans_type: str, chart_id: str) -> Dict[str, Optional[str]]:
    """Classificar transação baseado em regras"""
    # Buscar regras de classificação
    rules = await db.classification_rules.find({}, {"_id": 0}).sort("priority", -1).to_list(100)
    
    # Buscar contas do plano
    accounts = {}
    account_items = await db.account_items.find({"chart_id": chart_id}, {"_id": 0}).to_list(1000)
    for item in account_items:
        accounts[item['code']] = item
    
    description_upper = description.upper()
    
    # Regras padrão
    default_rules = [
        {'keyword': 'PIX RECEBIDO', 'debit': 'BANCO', 'credit': 'RECEITA'},
        {'keyword': 'PIX ENVIADO', 'debit': 'DESPESA', 'credit': 'BANCO'},
        {'keyword': 'PIX TRANSF', 'debit': 'DESPESA', 'credit': 'BANCO'},
        {'keyword': 'SISPAG', 'debit': 'PESSOAL', 'credit': 'BANCO'},
        {'keyword': 'FOLHA', 'debit': 'PESSOAL', 'credit': 'BANCO'},
        {'keyword': 'SALARIO', 'debit': 'PESSOAL', 'credit': 'BANCO'},
        {'keyword': 'PRO LABORE', 'debit': 'PROLABORE', 'credit': 'BANCO'},
        {'keyword': 'TARIFA', 'debit': 'BANCARIAS', 'credit': 'BANCO'},
        {'keyword': 'IOF', 'debit': 'BANCARIAS', 'credit': 'BANCO'},
        {'keyword': 'DAS', 'debit': 'IMPOSTOS', 'credit': 'BANCO'},
        {'keyword': 'GPS', 'debit': 'INSS', 'credit': 'BANCO'},
        {'keyword': 'DARF', 'debit': 'IMPOSTOS', 'credit': 'BANCO'},
        {'keyword': 'ENERGIA', 'debit': 'OPERACIONAIS', 'credit': 'BANCO'},
        {'keyword': 'AGUA', 'debit': 'OPERACIONAIS', 'credit': 'BANCO'},
        {'keyword': 'TELEFONE', 'debit': 'OPERACIONAIS', 'credit': 'BANCO'},
        {'keyword': 'ALUGUEL', 'debit': 'ALUGUEL', 'credit': 'BANCO'},
    ]
    
    # Tentar aplicar regras customizadas
    for rule in rules:
        if rule['keyword'].upper() in description_upper:
            return {
                'debit_account': rule.get('debit_account_code'),
                'credit_account': rule.get('credit_account_code'),
                'status': 'CLASSIFICADO'
            }
    
    # Tentar aplicar regras padrão
    for rule in default_rules:
        if rule['keyword'] in description_upper:
            # Buscar códigos correspondentes no plano de contas
            debit_code = None
            credit_code = None
            
            for code, item in accounts.items():
                desc_upper = item['description'].upper()
                if rule['debit'] in desc_upper:
                    debit_code = code
                if rule['credit'] in desc_upper:
                    credit_code = code
            
            if debit_code and credit_code:
                return {
                    'debit_account': debit_code,
                    'credit_account': credit_code,
                    'status': 'CLASSIFICADO'
                }
    
    return {
        'debit_account': None,
        'credit_account': None,
        'status': 'CLASSIFICAR MANUALMENTE'
    }

# ============= ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "API Agente Contábil - Sistema Domínio"}

# Companies
@api_router.post("/companies", response_model=Company)
async def create_company(company: CompanyCreate):
    company_obj = Company(**company.model_dump())
    doc = company_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['cnpj'] = clean_cnpj(doc['cnpj'])
    await db.companies.insert_one(doc)
    return company_obj

@api_router.get("/companies", response_model=List[Company])
async def get_companies():
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    for c in companies:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return companies

@api_router.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    if isinstance(company.get('created_at'), str):
        company['created_at'] = datetime.fromisoformat(company['created_at'])
    return company

@api_router.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, company: CompanyCreate):
    update_data = company.model_dump()
    update_data['cnpj'] = clean_cnpj(update_data['cnpj'])
    result = await db.companies.update_one({"id": company_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return await get_company(company_id)

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str):
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return {"message": "Empresa excluída com sucesso"}

# Chart of Accounts
@api_router.post("/chart-of-accounts", response_model=ChartOfAccounts)
async def create_chart(chart: ChartOfAccountsCreate):
    chart_obj = ChartOfAccounts(**chart.model_dump())
    doc = chart_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.chart_of_accounts.insert_one(doc)
    return chart_obj

@api_router.get("/chart-of-accounts", response_model=List[ChartOfAccounts])
async def get_charts(company_id: Optional[str] = None):
    query = {"company_id": company_id} if company_id else {}
    charts = await db.chart_of_accounts.find(query, {"_id": 0}).to_list(1000)
    for c in charts:
        if isinstance(c.get('created_at'), str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return charts

@api_router.delete("/chart-of-accounts/{chart_id}")
async def delete_chart(chart_id: str):
    result = await db.chart_of_accounts.delete_one({"id": chart_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plano de contas não encontrado")
    await db.account_items.delete_many({"chart_id": chart_id})
    return {"message": "Plano de contas excluído com sucesso"}

# Account Items
@api_router.post("/account-items", response_model=AccountItem)
async def create_account_item(item: AccountItemCreate):
    item_obj = AccountItem(**item.model_dump())
    doc = item_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.account_items.insert_one(doc)
    return item_obj

@api_router.get("/account-items", response_model=List[AccountItem])
async def get_account_items(chart_id: Optional[str] = None):
    query = {"chart_id": chart_id} if chart_id else {}
    items = await db.account_items.find(query, {"_id": 0}).to_list(1000)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return items

@api_router.delete("/account-items/{item_id}")
async def delete_account_item(item_id: str):
    result = await db.account_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return {"message": "Conta excluída com sucesso"}

# Classification Rules
@api_router.post("/classification-rules", response_model=ClassificationRule)
async def create_rule(rule: ClassificationRuleCreate):
    rule_obj = ClassificationRule(**rule.model_dump())
    doc = rule_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.classification_rules.insert_one(doc)
    return rule_obj

@api_router.get("/classification-rules", response_model=List[ClassificationRule])
async def get_rules():
    rules = await db.classification_rules.find({}, {"_id": 0}).to_list(1000)
    for r in rules:
        if isinstance(r.get('created_at'), str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return rules

@api_router.delete("/classification-rules/{rule_id}")
async def delete_rule(rule_id: str):
    result = await db.classification_rules.delete_one({"id": rule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Regra não encontrada")
    return {"message": "Regra excluída com sucesso"}

# Bank Statements - Upload and Process
@api_router.post("/bank-statements/upload")
async def upload_statement(
    file: UploadFile = File(...),
    company_id: str = Query(...),
    chart_id: str = Query(...),
    bank_name: str = Query(...),
    period: str = Query(...)
):
    # Ler arquivo
    content = await file.read()
    
    # Detectar tipo e parsear
    transactions = []
    if file.filename.endswith('.ofx'):
        transactions = parse_ofx_statement(content)
    elif file.filename.endswith(('.xlsx', '.xls')):
        transactions = parse_excel_statement(content)
    else:
        raise HTTPException(status_code=400, detail="Formato não suportado. Use OFX ou Excel")
    
    # Criar statement
    statement_id = str(uuid.uuid4())
    
    # Classificar transações
    classified_transactions = []
    for trans in transactions:
        classification = await classify_transaction(
            trans['description'],
            trans['amount'],
            trans['transaction_type'],
            chart_id
        )
        
        trans_obj = Transaction(
            id=str(uuid.uuid4()),
            statement_id=statement_id,
            date=trans['date'],
            description=trans['description'],
            document=trans.get('document'),
            amount=abs(trans['amount']),
            transaction_type=trans['transaction_type'],
            debit_account=classification['debit_account'],
            credit_account=classification['credit_account'],
            status=classification['status']
        )
        classified_transactions.append(trans_obj)
    
    # Calcular estatísticas
    total_inflows = sum(t.amount for t in classified_transactions if t.transaction_type == 'C')
    total_outflows = sum(t.amount for t in classified_transactions if t.transaction_type == 'D')
    classified_count = sum(1 for t in classified_transactions if t.status == 'CLASSIFICADO')
    manual_count = len(classified_transactions) - classified_count
    
    # Criar statement
    statement = BankStatement(
        id=statement_id,
        company_id=company_id,
        chart_id=chart_id,
        filename=file.filename,
        bank_name=bank_name,
        period=period,
        total_transactions=len(classified_transactions),
        classified_count=classified_count,
        manual_count=manual_count,
        total_inflows=total_inflows,
        total_outflows=total_outflows,
        balance=total_inflows - total_outflows,
        status='COMPLETED',
        processed_at=datetime.now(timezone.utc)
    )
    
    # Salvar no banco
    statement_doc = statement.model_dump()
    statement_doc['created_at'] = statement_doc['created_at'].isoformat()
    statement_doc['processed_at'] = statement_doc['processed_at'].isoformat()
    await db.bank_statements.insert_one(statement_doc)
    
    for trans in classified_transactions:
        await db.transactions.insert_one(trans.model_dump())
    
    return {
        "statement": statement,
        "transactions": classified_transactions
    }

@api_router.get("/bank-statements", response_model=List[BankStatement])
async def get_statements(company_id: Optional[str] = None):
    query = {"company_id": company_id} if company_id else {}
    statements = await db.bank_statements.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for s in statements:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
        if isinstance(s.get('processed_at'), str):
            s['processed_at'] = datetime.fromisoformat(s['processed_at'])
    return statements

@api_router.get("/bank-statements/{statement_id}", response_model=BankStatement)
async def get_statement(statement_id: str):
    statement = await db.bank_statements.find_one({"id": statement_id}, {"_id": 0})
    if not statement:
        raise HTTPException(status_code=404, detail="Extrato não encontrado")
    if isinstance(statement.get('created_at'), str):
        statement['created_at'] = datetime.fromisoformat(statement['created_at'])
    if isinstance(statement.get('processed_at'), str):
        statement['processed_at'] = datetime.fromisoformat(statement['processed_at'])
    return statement

@api_router.get("/bank-statements/{statement_id}/transactions", response_model=List[Transaction])
async def get_transactions(statement_id: str):
    transactions = await db.transactions.find({"statement_id": statement_id}, {"_id": 0}).to_list(1000)
    return transactions

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, update: TransactionUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    result = await db.transactions.update_one({"id": transaction_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    trans = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    return trans

@api_router.get("/bank-statements/{statement_id}/export")
async def export_statement(statement_id: str):
    # Buscar statement e transações
    statement = await db.bank_statements.find_one({"id": statement_id}, {"_id": 0})
    if not statement:
        raise HTTPException(status_code=404, detail="Extrato não encontrado")
    
    transactions = await db.transactions.find({"statement_id": statement_id}, {"_id": 0}).to_list(1000)
    
    # Buscar empresa
    company = await db.companies.find_one({"id": statement['company_id']}, {"_id": 0})
    
    # Criar workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Lançamentos"
    
    # Cabeçalhos
    headers = ['Data', 'Histórico', 'Documento', 'Valor', 'Tipo', 'Conta Débito', 'Conta Crédito', 'Status', 'Observação']
    ws.append(headers)
    
    # Estilizar cabeçalho
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF")
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center')
    
    # Adicionar dados
    for trans in transactions:
        valor = trans['amount'] if trans['transaction_type'] == 'C' else -trans['amount']
        ws.append([
            trans['date'],
            trans['description'],
            trans.get('document', ''),
            valor,
            trans['transaction_type'],
            trans.get('debit_account', ''),
            trans.get('credit_account', ''),
            trans['status'],
            trans.get('notes', '')
        ])
    
    # Ajustar largura das colunas
    ws.column_dimensions['A'].width = 12
    ws.column_dimensions['B'].width = 50
    ws.column_dimensions['C'].width = 15
    ws.column_dimensions['D'].width = 15
    ws.column_dimensions['E'].width = 8
    ws.column_dimensions['F'].width = 15
    ws.column_dimensions['G'].width = 15
    ws.column_dimensions['H'].width = 25
    ws.column_dimensions['I'].width = 30
    
    # Salvar arquivo
    cnpj_clean = clean_cnpj(company['cnpj'])
    filename = f"{cnpj_clean}_{statement['bank_name'].upper()}_{statement['period'].replace('/', '')}_{statement_id[:8]}_LANCAMENTOS.xlsx"
    filepath = f"/tmp/{filename}"
    wb.save(filepath)
    
    return FileResponse(filepath, filename=filename, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@api_router.delete("/bank-statements/{statement_id}")
async def delete_statement(statement_id: str):
    result = await db.bank_statements.delete_one({"id": statement_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Extrato não encontrado")
    await db.transactions.delete_many({"statement_id": statement_id})
    return {"message": "Extrato excluído com sucesso"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()