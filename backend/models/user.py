from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

PERFIL_SUPER_ADMIN = "super_admin"
PERFIL_ADMIN_TENANT = "admin_tenant"
PERFIL_ADMINISTRADOR = "administrador"
PERFIL_COLABORADOR = "colaborador"

PERFIS_ADMIN = [PERFIL_ADMIN_TENANT, PERFIL_ADMINISTRADOR, PERFIL_SUPER_ADMIN]


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    nome: str
    email: str
    senha: str
    perfil: str = PERFIL_COLABORADOR
    status: str = "ativo"
    data_criacao: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ultimo_acesso: Optional[datetime] = None


class UserCreate(BaseModel):
    nome: str
    email: str
    senha: str
    perfil: str = PERFIL_COLABORADOR
    tenant_id: Optional[str] = None


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    senha: Optional[str] = None
    perfil: Optional[str] = None
    status: Optional[str] = None
    tenant_id: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    senha: str


class UserResponse(BaseModel):
    id: str
    nome: str
    email: str
    perfil: str
    status: str
    data_criacao: str


class UserEmpresa(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    usuario_id: str
    empresa_id: str


class ActivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    tenant_nome: Optional[str] = None
    usuario_id: str
    usuario_nome: str
    acao: str
    detalhes: Optional[str] = None
    empresa_id: Optional[str] = None
    empresa_nome: Optional[str] = None
    data_hora: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
