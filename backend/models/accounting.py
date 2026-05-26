from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid

PROCESSING_STATUS = {
    'NAO_INICIADO': 'Não iniciado',
    'EM_PROCESSAMENTO': 'Em processamento',
    'AGUARDANDO_DOCUMENTOS': 'Aguardando documentos',
    'CONCLUIDO': 'Concluído',
    'ARQUIVADO': 'Arquivado'
}


class AccountingProcess(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    company_id: str
    company_name: str
    year: int
    month: int
    period: str
    status: str = 'NAO_INICIADO'
    responsible: Optional[str] = None
    observations: Optional[str] = None
    statement_ids: List[str] = Field(default_factory=list)
    total_transactions: int = 0
    classified_transactions: int = 0
    pending_transactions: int = 0
    is_archived: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None


class AccountingProcessCreate(BaseModel):
    company_id: str
    year: int
    month: int
    responsible: Optional[str] = None
    observations: Optional[str] = None


class AccountingProcessUpdate(BaseModel):
    status: Optional[str] = None
    responsible: Optional[str] = None
    observations: Optional[str] = None
