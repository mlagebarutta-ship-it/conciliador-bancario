from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
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
    tenant_id: Optional[str] = None
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
    tenant_id: Optional[str] = None
    chart_id: str
    code: str
    description: str
    account_type: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AccountItemCreate(BaseModel):
    chart_id: str
    code: str
    description: str
    account_type: str
