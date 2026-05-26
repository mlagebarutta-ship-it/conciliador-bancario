from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class ClassificationRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    keyword: str
    debit_account_code: Optional[str] = None
    credit_account_code: Optional[str] = None
    description: Optional[str] = None
    priority: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ClassificationRuleCreate(BaseModel):
    keyword: str
    company_id: Optional[str] = None
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
    transaction_type: str
    debit_account: Optional[str] = None
    credit_account: Optional[str] = None
    status: str
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


class BulkUpdateRequest(BaseModel):
    transaction_ids: List[str]
    update_data: dict


class ClassificationHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    company_id: str
    description_pattern: str
    transaction_type: str
    debit_account: str
    credit_account: str
    usage_count: int = 1
    last_used: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BankStatement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    company_id: str
    chart_id: str
    filename: str
    bank_name: str
    period: str
    total_transactions: int
    classified_count: int
    manual_count: int
    total_inflows: float
    total_outflows: float
    balance: float
    status: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    processed_at: Optional[datetime] = None


class BankStatementCreate(BaseModel):
    company_id: str
    chart_id: str
    bank_name: str
    period: str


class ExtractedTransaction(BaseModel):
    date: str
    description: str
    value: float
    type: str
    fit_id: str = Field(default_factory=lambda: str(uuid.uuid4())[:12])


class ConversionPreview(BaseModel):
    file_name: str
    file_type: str
    total_transactions: int
    total_credits: float
    total_debits: float
    balance: float
    transactions: List[ExtractedTransaction]
