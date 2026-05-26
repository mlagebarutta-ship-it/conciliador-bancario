from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class Tenant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    cnpj: Optional[str] = None
    email: str
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    plano: str = "basico"
    status: str = "ativo"
    max_usuarios: int = 5
    max_empresas: int = 20
    data_criacao: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data_atualizacao: Optional[datetime] = None


class TenantCreate(BaseModel):
    nome: str
    cnpj: Optional[str] = None
    email: str
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    plano: str = "basico"


class TenantUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    plano: Optional[str] = None
    status: Optional[str] = None
    max_usuarios: Optional[int] = None
    max_empresas: Optional[int] = None
