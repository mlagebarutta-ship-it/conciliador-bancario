# 🚀 GUIA DE PRODUÇÃO - Domínio Bridge
## Preparação para Deploy Multi-tenant

---

# 1. PROCESSO DE DEPLOY

## 1.1 Visão Geral da Arquitetura de Deploy

```
                    ┌─────────────────────────────────────┐
                    │         CLOUDFLARE (CDN/WAF)        │
                    │      - SSL/TLS automático           │
                    │      - DDoS protection              │
                    │      - Cache estático               │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │       LOAD BALANCER (Nginx)         │
                    └─────────────────┬───────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
┌──────────▼──────────┐   ┌──────────▼──────────┐   ┌──────────▼──────────┐
│   Frontend (React)  │   │   Backend (FastAPI) │   │   Backend (FastAPI) │
│   Container/Vercel  │   │     Container #1    │   │     Container #2    │
└─────────────────────┘   └──────────┬──────────┘   └──────────┬──────────┘
                                      │                          │
                          ┌───────────▼──────────────────────────▼───────────┐
                          │              MongoDB Atlas (Cluster)             │
                          │           - Primary + 2 Replicas                 │
                          └──────────────────────────────────────────────────┘
```

## 1.2 Opções de Hospedagem

### Opção A: Deploy Simplificado (Recomendado para início)

| Componente | Serviço | Custo Mensal Estimado |
|------------|---------|----------------------|
| Frontend | Vercel | Grátis - $20 |
| Backend | Railway / Render | $7 - $25 |
| Database | MongoDB Atlas | Grátis - $57 |
| **Total** | | **$7 - $100** |

### Opção B: Deploy Profissional (Escalável)

| Componente | Serviço | Custo Mensal Estimado |
|------------|---------|----------------------|
| Frontend | AWS S3 + CloudFront | $5 - $20 |
| Backend | AWS ECS / DigitalOcean K8s | $50 - $200 |
| Database | MongoDB Atlas M10+ | $57 - $200 |
| Monitoring | Datadog / New Relic | $25 - $100 |
| **Total** | | **$137 - $520** |

### Opção C: VPS Econômico

| Componente | Serviço | Custo Mensal Estimado |
|------------|---------|----------------------|
| VPS (Tudo junto) | DigitalOcean / Hetzner | $12 - $48 |
| Database | MongoDB Atlas M0 (Grátis) ou no VPS | $0 - $57 |
| **Total** | | **$12 - $105** |

## 1.3 Deploy Automático com GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      
      - name: Run tests
        run: |
          cd backend
          pytest tests/ -v

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Railway
        uses: railwayapp/railway-github-link@v1
        with:
          service: backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

---

# 2. INFRAESTRUTURA RECOMENDADA

## 2.1 Arquitetura de Produção Detalhada

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                       │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────────┐
│                         CLOUDFLARE (Proxy/WAF)                              │
│  • SSL/TLS termination                                                     │
│  • DDoS protection                                                         │
│  • Rate limiting                                                           │
│  • Bot management                                                          │
│  • Cache de assets estáticos                                               │
└────────────────────────────────────┬───────────────────────────────────────┘
                                     │
        ┌────────────────────────────┴────────────────────────────┐
        │                                                         │
        ▼                                                         ▼
┌───────────────────┐                                 ┌───────────────────┐
│  FRONTEND (CDN)   │                                 │  BACKEND (API)    │
│  ---------------  │                                 │  ---------------  │
│  Vercel / S3+CF   │                                 │  Railway / ECS    │
│                   │                                 │                   │
│  • React SPA      │                                 │  • FastAPI        │
│  • Assets static  │                                 │  • Auto-scaling   │
│  • Edge caching   │                                 │  • Health checks  │
└───────────────────┘                                 └─────────┬─────────┘
                                                                │
                    ┌───────────────────────────────────────────┤
                    │                                           │
                    ▼                                           ▼
        ┌───────────────────┐                       ┌───────────────────┐
        │  MONGODB ATLAS    │                       │  REDIS CACHE      │
        │  ---------------  │                       │  ---------------  │
        │  • M10 Cluster    │                       │  • Sessions       │
        │  • 3 Node Replica │                       │  • Rate limiting  │
        │  • Auto-backup    │                       │  • Cache queries  │
        │  • Point-in-time  │                       │                   │
        └───────────────────┘                       └───────────────────┘
```

## 2.2 Configuração de Ambiente de Produção

### Backend (.env.production)

```bash
# Não commitar este arquivo! Use variáveis de ambiente do serviço

# Banco de Dados
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/dominio_bridge?retryWrites=true&w=majority
DB_NAME=dominio_bridge_prod

# Segurança
JWT_SECRET=gerar_chave_segura_com_openssl_rand_hex_64
JWT_EXPIRATION_HOURS=8
ALLOWED_ORIGINS=https://seudominio.com.br,https://www.seudominio.com.br

# Ambiente
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
```

### Frontend (.env.production)

```bash
REACT_APP_BACKEND_URL=https://api.seudominio.com.br
REACT_APP_ENVIRONMENT=production
```

## 2.3 Comparativo de Provedores

### Para Backend (FastAPI)

| Provedor | Prós | Contras | Preço |
|----------|------|---------|-------|
| **Railway** | Setup fácil, auto-deploy | Menos controle | $5-50/mês |
| **Render** | Grátis tier, simples | Cold starts no grátis | $0-25/mês |
| **DigitalOcean App** | Bom custo-benefício | Config manual | $12-50/mês |
| **AWS ECS** | Escalável, profissional | Complexo | $50-200/mês |
| **Google Cloud Run** | Pay-per-use, escalável | Curva de aprendizado | $10-100/mês |

### Para Frontend (React)

| Provedor | Prós | Contras | Preço |
|----------|------|---------|-------|
| **Vercel** | Melhor DX, edge functions | Vendor lock-in | Grátis-$20/mês |
| **Netlify** | Similar Vercel | Builds mais lentos | Grátis-$19/mês |
| **AWS S3+CloudFront** | Controle total | Config manual | $5-20/mês |
| **Cloudflare Pages** | Rápido, grátis | Menos features | Grátis |

### Para Banco de Dados (MongoDB)

| Provedor | Prós | Contras | Preço |
|----------|------|---------|-------|
| **MongoDB Atlas** | Oficial, confiável | Pode ficar caro | Grátis-$200+/mês |
| **DigitalOcean Managed** | Bom preço | Menos features | $15-100/mês |
| **Self-hosted** | Controle total | Manutenção manual | Custo do VPS |

---

# 3. CONFIGURAÇÃO DE DOMÍNIO

## 3.1 Registrando e Configurando o Domínio

### Passo 1: Registrar o Domínio
Registradores recomendados:
- **Registro.br** (domínios .com.br) - ~R$ 40/ano
- **Cloudflare Registrar** (.com) - Preço de custo
- **Namecheap** - Bom custo-benefício

### Passo 2: Estrutura de DNS Recomendada

```
dominiobridge.com.br
├── @ (root)           → Frontend (Vercel/Netlify)
├── www                → CNAME para @
├── api                → Backend (Railway/Render)
└── admin              → Painel administrativo (opcional)
```

### Passo 3: Configuração DNS no Cloudflare

```
# Registros DNS

# Frontend (Vercel)
Tipo: CNAME
Nome: @
Conteúdo: cname.vercel-dns.com
Proxy: Ativado (laranja)

Tipo: CNAME
Nome: www
Conteúdo: cname.vercel-dns.com
Proxy: Ativado

# Backend (Railway)
Tipo: CNAME
Nome: api
Conteúdo: seu-app.up.railway.app
Proxy: Ativado

# Email (se necessário)
Tipo: MX
Nome: @
Conteúdo: mx1.zoho.com
Prioridade: 10
```

## 3.2 Configuração SSL/HTTPS

### Usando Cloudflare (Recomendado)

1. **Modo SSL**: Full (strict)
2. **Always Use HTTPS**: Ativado
3. **Automatic HTTPS Rewrites**: Ativado
4. **HSTS**: Ativado (após testar)

```
Configurações Cloudflare SSL/TLS:
├── Modo: Full (strict)
├── Edge Certificates: Universal (grátis)
├── Always Use HTTPS: ON
├── Automatic HTTPS Rewrites: ON
├── Minimum TLS Version: 1.2
└── TLS 1.3: ON
```

### Configuração de Headers de Segurança (Cloudflare Workers ou Backend)

```python
# No FastAPI (middleware)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
```

---

# 4. BANCO DE DADOS

## 4.1 Migração para MongoDB Atlas

### Passo 1: Criar Cluster no MongoDB Atlas

1. Acesse [cloud.mongodb.com](https://cloud.mongodb.com)
2. Crie uma conta ou faça login
3. Crie um novo projeto: "DominioBridge-Production"
4. Crie um cluster:
   - **Tier**: M10 (produção) ou M0 (desenvolvimento)
   - **Provider**: AWS ou GCP
   - **Region**: São Paulo (sa-east-1)

### Passo 2: Exportar Dados Locais

```bash
# Exportar do MongoDB local
mongodump --uri="mongodb://localhost:27017/test_database" --out=/backup/local

# Ou usando script Python
python3 << 'EOF'
from pymongo import MongoClient
import json
from bson import json_util

# Conectar ao local
local = MongoClient("mongodb://localhost:27017")
local_db = local["test_database"]

# Exportar cada collection
for collection_name in local_db.list_collection_names():
    docs = list(local_db[collection_name].find())
    with open(f"/backup/{collection_name}.json", "w") as f:
        json.dump(docs, f, default=json_util.default)
    print(f"Exported {collection_name}: {len(docs)} documents")
EOF
```

### Passo 3: Importar para MongoDB Atlas

```bash
# Importar para Atlas
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/dominio_bridge_prod" /backup/local

# Ou via mongoimport
mongoimport --uri="mongodb+srv://user:pass@cluster.mongodb.net/dominio_bridge_prod" \
    --collection=companies --file=/backup/companies.json --jsonArray
```

## 4.2 Configuração de Backups

### Backups Automáticos no Atlas

```
Configuração Recomendada:
├── Continuous Backup: Ativado
├── Snapshot Frequency: A cada 6 horas
├── Retention: 7 dias (snapshots), 30 dias (daily)
├── Point-in-Time Recovery: Últimas 24 horas
└── Backup Region: Diferente da primária
```

### Script de Backup Manual (Emergência)

```bash
#!/bin/bash
# backup.sh - Executar via cron diariamente

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb/$DATE"
ATLAS_URI="mongodb+srv://user:pass@cluster.mongodb.net"

# Criar backup
mongodump --uri="$ATLAS_URI/dominio_bridge_prod" --out="$BACKUP_DIR"

# Comprimir
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

# Upload para S3 (opcional)
aws s3 cp "$BACKUP_DIR.tar.gz" "s3://seu-bucket/backups/mongodb/"

# Limpar backups antigos (manter últimos 30 dias)
find /backups/mongodb -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

## 4.3 Índices para Performance

```python
# Criar índices otimizados
async def create_indexes():
    # Usuários
    await db.usuarios.create_index("email", unique=True)
    await db.usuarios.create_index("tenant_id")
    
    # Empresas
    await db.companies.create_index("tenant_id")
    await db.companies.create_index([("tenant_id", 1), ("cnpj", 1)], unique=True)
    
    # Transações (mais importante para performance)
    await db.transactions.create_index("statement_id")
    await db.transactions.create_index([("statement_id", 1), ("date", 1)])
    await db.transactions.create_index([("tenant_id", 1), ("created_at", -1)])
    
    # Bank Statements
    await db.bank_statements.create_index("company_id")
    await db.bank_statements.create_index([("tenant_id", 1), ("created_at", -1)])
    
    # Activity Logs (TTL para limpar automaticamente após 90 dias)
    await db.activity_logs.create_index("data_hora", expireAfterSeconds=7776000)
    await db.activity_logs.create_index([("tenant_id", 1), ("data_hora", -1)])
```

---

# 5. SISTEMA MULTI-TENANT (MULTI-ESCRITÓRIO)

## 5.1 Estratégias de Multi-tenancy

### Opção A: Banco de Dados Compartilhado com Campo tenant_id (Recomendado)

```
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 dominio_bridge_prod                  │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐      │   │
│  │  │  tenants   │ │  usuarios  │ │  companies │      │   │
│  │  │ tenant_id  │ │ tenant_id  │ │ tenant_id  │      │   │
│  │  └────────────┘ └────────────┘ └────────────┘      │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐      │   │
│  │  │transactions│ │bank_state- │ │activity_   │      │   │
│  │  │ tenant_id  │ │ments       │ │logs        │      │   │
│  │  └────────────┘ │ tenant_id  │ │ tenant_id  │      │   │
│  │                 └────────────┘ └────────────┘      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Vantagens:
✅ Simples de implementar
✅ Custo menor (um único cluster)
✅ Fácil manutenção
✅ Queries cross-tenant possíveis (para admin global)

Desvantagens:
❌ Requer cuidado com isolamento de dados
❌ Índices maiores
```

### Opção B: Database por Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ escritorio_1 │ │ escritorio_2 │ │ escritorio_3 │        │
│  │  - users     │ │  - users     │ │  - users     │        │
│  │  - companies │ │  - companies │ │  - companies │        │
│  │  - ...       │ │  - ...       │ │  - ...       │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘

Vantagens:
✅ Isolamento total de dados
✅ Fácil backup/restore por tenant
✅ Performance previsível

Desvantagens:
❌ Mais complexo de gerenciar
❌ Custo maior
❌ Mais conexões necessárias
```

## 5.2 Estrutura de Collections para Multi-tenant

### Collection: tenants (Escritórios de Contabilidade)

```javascript
{
  "id": "uuid",
  "nome": "Escritório Contábil ABC",
  "cnpj": "12.345.678/0001-90",
  "slug": "escritorio-abc",  // Para URLs amigáveis
  "plano": "profissional",   // "basico", "profissional", "enterprise"
  "status": "ativo",         // "ativo", "suspenso", "cancelado"
  "configuracoes": {
    "max_usuarios": 10,
    "max_empresas": 50,
    "features": ["classificacao_ia", "api_integracao", "relatorios_avancados"]
  },
  "faturamento": {
    "dia_vencimento": 10,
    "forma_pagamento": "boleto",
    "valor_mensal": 199.90
  },
  "contato": {
    "email": "contato@escritorioabc.com.br",
    "telefone": "(11) 99999-9999",
    "responsavel": "João Silva"
  },
  "endereco": {
    "logradouro": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567"
  },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-03-01T00:00:00Z"
}
```

### Collection: usuarios (Atualizada para Multi-tenant)

```javascript
{
  "id": "uuid",
  "tenant_id": "uuid",       // ← NOVO: Referência ao escritório
  "nome": "Maria Santos",
  "email": "maria@escritorioabc.com.br",
  "senha": "hash_bcrypt",    // Mudar de SHA256 para bcrypt
  "perfil": "colaborador",   // "super_admin", "admin_tenant", "colaborador"
  "status": "ativo",
  "permissoes": {            // ← NOVO: Permissões granulares
    "empresas": ["criar", "editar", "visualizar"],
    "extratos": ["importar", "classificar", "exportar"],
    "usuarios": [],          // Vazio = sem acesso
    "relatorios": ["visualizar"]
  },
  "ultimo_acesso": "2025-03-10T10:30:00Z",
  "data_criacao": "2025-01-15T00:00:00Z"
}
```

### Collection: companies (Atualizada)

```javascript
{
  "id": "uuid",
  "tenant_id": "uuid",       // ← NOVO
  "cnpj": "98.765.432/0001-10",
  "razao_social": "Empresa Cliente XYZ Ltda",
  "nome_fantasia": "XYZ Comercio",
  "regime_tributario": "simples_nacional",
  "responsavel_id": "uuid",  // ← NOVO: Usuário responsável
  "status": "ativo",
  "created_at": "2025-02-01T00:00:00Z"
}
```

### Collection: usuario_empresas (Atualizada)

```javascript
{
  "id": "uuid",
  "tenant_id": "uuid",       // ← NOVO
  "usuario_id": "uuid",
  "empresa_id": "uuid",
  "permissoes": ["visualizar", "importar", "classificar", "exportar"]
}
```

## 5.3 Middleware de Isolamento de Tenant

```python
# middleware/tenant.py

from fastapi import Request, HTTPException
from functools import wraps

class TenantContext:
    """Contexto do tenant atual"""
    tenant_id: str = None
    tenant_data: dict = None

# Variável global para o contexto (usar contextvars em produção)
current_tenant = TenantContext()

async def tenant_middleware(request: Request, call_next):
    """Middleware que extrai e valida o tenant do token JWT"""
    
    # Rotas públicas que não precisam de tenant
    public_routes = ["/api/auth/login", "/api/health", "/api/docs"]
    if any(request.url.path.startswith(route) for route in public_routes):
        return await call_next(request)
    
    # Extrair tenant do token JWT
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(status_code=401, detail="Token não fornecido")
    
    payload = decode_token(token)
    if not payload or "tenant_id" not in payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    # Carregar dados do tenant
    tenant = await db.tenants.find_one({"id": payload["tenant_id"]})
    if not tenant or tenant["status"] != "ativo":
        raise HTTPException(status_code=403, detail="Escritório inativo ou não encontrado")
    
    # Definir contexto
    current_tenant.tenant_id = payload["tenant_id"]
    current_tenant.tenant_data = tenant
    
    response = await call_next(request)
    
    # Limpar contexto
    current_tenant.tenant_id = None
    current_tenant.tenant_data = None
    
    return response

def with_tenant_filter(func):
    """Decorator que adiciona filtro de tenant automaticamente"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Adicionar tenant_id aos filtros
        if "query" in kwargs:
            kwargs["query"]["tenant_id"] = current_tenant.tenant_id
        return await func(*args, **kwargs)
    return wrapper

# Exemplo de uso
@with_tenant_filter
async def get_companies(query: dict = {}):
    # query já terá tenant_id adicionado automaticamente
    return await db.companies.find(query).to_list(1000)
```

## 5.4 Fluxo de Onboarding de Novo Escritório

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE CADASTRO                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. LANDING PAGE                                                │
│     - Escritório clica em "Criar Conta"                         │
│     - Preenche formulário (CNPJ, email, nome do escritório)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. VALIDAÇÃO                                                   │
│     - Verificar CNPJ válido (API ReceitaWS)                     │
│     - Verificar email não duplicado                             │
│     - Enviar email de confirmação                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. CRIAÇÃO DO TENANT                                           │
│     - Criar registro em 'tenants'                               │
│     - Criar usuário admin do escritório                         │
│     - Configurar plano trial (14 dias)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. ONBOARDING WIZARD                                           │
│     - Configurações iniciais do escritório                      │
│     - Importar plano de contas padrão                           │
│     - Cadastrar primeira empresa cliente                        │
│     - Tutorial interativo                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. SISTEMA ATIVO                                               │
│     - Dashboard personalizado                                   │
│     - Métricas de uso                                           │
│     - Alertas de fim do trial                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

# 6. SISTEMA DE AUTENTICAÇÃO

## 6.1 Migração de SHA256 para Bcrypt

```python
# utils/security.py
import bcrypt
import secrets
from datetime import datetime, timezone, timedelta
import jwt

# Configurações
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE = timedelta(hours=8)
JWT_REFRESH_TOKEN_EXPIRE = timedelta(days=30)

def hash_password(password: str) -> str:
    """Hash de senha usando bcrypt (mais seguro que SHA256)"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Verifica senha com bcrypt"""
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(data: dict) -> str:
    """Cria token JWT de acesso"""
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + JWT_ACCESS_TOKEN_EXPIRE
    payload["type"] = "access"
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(data: dict) -> str:
    """Cria token JWT de refresh (longa duração)"""
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + JWT_REFRESH_TOKEN_EXPIRE
    payload["type"] = "refresh"
    payload["jti"] = secrets.token_hex(16)  # ID único do token
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    """Decodifica e valida token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
```

## 6.2 Endpoints de Autenticação Completos

```python
# routes/auth.py
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.security import HTTPBearer

router = APIRouter(prefix="/api/auth", tags=["Autenticação"])

@router.post("/login")
async def login(credentials: LoginRequest, response: Response):
    """Login com email e senha"""
    
    # Buscar usuário
    user = await db.usuarios.find_one({"email": credentials.email.lower()})
    if not user:
        # Delay para evitar timing attacks
        await asyncio.sleep(0.5)
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Verificar senha
    if not verify_password(credentials.senha, user["senha"]):
        # Log de tentativa falha
        await log_failed_login(credentials.email)
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Verificar status
    if user["status"] != "ativo":
        raise HTTPException(status_code=403, detail="Usuário inativo")
    
    # Verificar tenant
    tenant = await db.tenants.find_one({"id": user["tenant_id"]})
    if not tenant or tenant["status"] != "ativo":
        raise HTTPException(status_code=403, detail="Escritório inativo")
    
    # Gerar tokens
    token_data = {
        "user_id": user["id"],
        "tenant_id": user["tenant_id"],
        "email": user["email"],
        "perfil": user["perfil"]
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    # Salvar refresh token no banco (para invalidação)
    await db.refresh_tokens.insert_one({
        "token_id": decode_token(refresh_token)["jti"],
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + JWT_REFRESH_TOKEN_EXPIRE
    })
    
    # Log de sucesso
    await log_activity(user["id"], user["nome"], "Login realizado", tenant_id=user["tenant_id"])
    
    # Atualizar último acesso
    await db.usuarios.update_one(
        {"id": user["id"]},
        {"$set": {"ultimo_acesso": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Setar refresh token como HTTP-only cookie (mais seguro)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # HTTPS apenas
        samesite="strict",
        max_age=30 * 24 * 60 * 60  # 30 dias
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": JWT_ACCESS_TOKEN_EXPIRE.total_seconds(),
        "user": {
            "id": user["id"],
            "nome": user["nome"],
            "email": user["email"],
            "perfil": user["perfil"],
            "tenant": {
                "id": tenant["id"],
                "nome": tenant["nome"]
            }
        }
    }

@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """Renova o access token usando refresh token"""
    
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token não encontrado")
    
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token inválido")
    
    # Verificar se token está na whitelist
    stored_token = await db.refresh_tokens.find_one({"token_id": payload["jti"]})
    if not stored_token:
        raise HTTPException(status_code=401, detail="Token revogado")
    
    # Gerar novo access token
    new_access_token = create_access_token({
        "user_id": payload["user_id"],
        "tenant_id": payload["tenant_id"],
        "email": payload["email"],
        "perfil": payload["perfil"]
    })
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(request: Request, response: Response, current_user: dict = Depends(require_auth)):
    """Logout - invalida refresh token"""
    
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            await db.refresh_tokens.delete_one({"token_id": payload.get("jti")})
        except:
            pass
    
    response.delete_cookie("refresh_token")
    
    await log_activity(current_user["id"], current_user["nome"], "Logout realizado")
    
    return {"message": "Logout realizado com sucesso"}

@router.post("/forgot-password")
async def forgot_password(email: str):
    """Solicita reset de senha"""
    
    user = await db.usuarios.find_one({"email": email.lower()})
    
    # Sempre retornar sucesso (evitar enumeração de usuários)
    if user:
        # Gerar token de reset
        reset_token = secrets.token_urlsafe(32)
        
        await db.password_resets.insert_one({
            "user_id": user["id"],
            "token": reset_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=2),
            "used": False
        })
        
        # Enviar email (implementar com SendGrid/Resend)
        # await send_reset_email(user["email"], reset_token)
    
    return {"message": "Se o email existir, você receberá instruções de reset"}
```

## 6.3 Hierarquia de Permissões

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIERARQUIA DE PERFIS                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SUPER_ADMIN (Dono do Sistema)                                  │
│  ├── Acesso a TODOS os tenants                                  │
│  ├── Criar/gerenciar tenants                                    │
│  ├── Configurações globais                                      │
│  ├── Métricas de uso do sistema                                 │
│  └── Faturamento e planos                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ADMIN_TENANT (Dono do Escritório)                              │
│  ├── Gerenciar usuários do escritório                           │
│  ├── Configurações do escritório                                │
│  ├── Todas as empresas do escritório                            │
│  ├── Relatórios e métricas                                      │
│  └── Regras de classificação                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  COLABORADOR (Funcionário do Escritório)                        │
│  ├── Apenas empresas vinculadas                                 │
│  ├── Importar extratos                                          │
│  ├── Classificar transações                                     │
│  ├── Exportar relatórios                                        │
│  └── Sem acesso a configurações                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 7. SEGURANÇA

## 7.1 Checklist de Segurança para Sistemas Financeiros

### Autenticação & Autorização
- [ ] Senhas com bcrypt (rounds >= 12)
- [ ] JWT com expiração curta (8h access, 30d refresh)
- [ ] Refresh tokens em HTTP-only cookies
- [ ] Rate limiting no login (5 tentativas / 15 min)
- [ ] Bloqueio de conta após tentativas falhas
- [ ] 2FA opcional (TOTP)

### Proteção de Dados
- [ ] HTTPS em todas as comunicações
- [ ] Headers de segurança (HSTS, CSP, X-Frame-Options)
- [ ] Sanitização de inputs
- [ ] Prepared statements (MongoDB já protege contra injection)
- [ ] Logs não contêm dados sensíveis

### Infraestrutura
- [ ] Firewall configurado
- [ ] Portas não utilizadas fechadas
- [ ] Updates automáticos de segurança
- [ ] Backups criptografados
- [ ] Secrets em variáveis de ambiente (nunca no código)

## 7.2 Implementação de Rate Limiting

```python
# middleware/rate_limit.py
from fastapi import Request, HTTPException
from collections import defaultdict
from datetime import datetime, timedelta
import asyncio

# Cache em memória (usar Redis em produção)
rate_limit_cache = defaultdict(list)

async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting por IP"""
    
    # Configurações
    RATE_LIMIT = 100  # requests
    RATE_WINDOW = 60  # segundos
    
    client_ip = request.client.host
    current_time = datetime.now()
    
    # Limpar requests antigos
    rate_limit_cache[client_ip] = [
        t for t in rate_limit_cache[client_ip]
        if current_time - t < timedelta(seconds=RATE_WINDOW)
    ]
    
    # Verificar limite
    if len(rate_limit_cache[client_ip]) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Muitas requisições. Tente novamente em alguns segundos."
        )
    
    # Registrar request
    rate_limit_cache[client_ip].append(current_time)
    
    response = await call_next(request)
    
    # Adicionar headers
    response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT)
    response.headers["X-RateLimit-Remaining"] = str(RATE_LIMIT - len(rate_limit_cache[client_ip]))
    response.headers["X-RateLimit-Reset"] = str(RATE_WINDOW)
    
    return response

# Rate limiting específico para login
login_attempts = defaultdict(list)

async def check_login_rate_limit(email: str, ip: str):
    """Verifica rate limit específico para login"""
    
    ATTEMPTS_LIMIT = 5
    BLOCK_DURATION = 900  # 15 minutos
    
    key = f"{email}:{ip}"
    current_time = datetime.now()
    
    # Limpar tentativas antigas
    login_attempts[key] = [
        t for t in login_attempts[key]
        if current_time - t < timedelta(seconds=BLOCK_DURATION)
    ]
    
    if len(login_attempts[key]) >= ATTEMPTS_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Muitas tentativas de login. Tente novamente em {BLOCK_DURATION // 60} minutos."
        )

async def record_login_attempt(email: str, ip: str):
    """Registra tentativa de login"""
    key = f"{email}:{ip}"
    login_attempts[key].append(datetime.now())
```

## 7.3 Criptografia de Dados Sensíveis

```python
# utils/encryption.py
from cryptography.fernet import Fernet
import os
import base64

# Chave de criptografia (gerar uma vez e guardar seguro)
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # Gerar nova chave: Fernet.generate_key().decode()
    raise ValueError("ENCRYPTION_KEY não configurada")

fernet = Fernet(ENCRYPTION_KEY.encode())

def encrypt_sensitive_data(data: str) -> str:
    """Criptografa dados sensíveis (ex: tokens de API)"""
    return fernet.encrypt(data.encode()).decode()

def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Descriptografa dados"""
    return fernet.decrypt(encrypted_data.encode()).decode()

# Exemplo de uso para armazenar credenciais bancárias
class BankCredentials:
    def __init__(self, bank_name: str, api_key: str, api_secret: str):
        self.bank_name = bank_name
        self.api_key_encrypted = encrypt_sensitive_data(api_key)
        self.api_secret_encrypted = encrypt_sensitive_data(api_secret)
    
    def get_credentials(self):
        return {
            "api_key": decrypt_sensitive_data(self.api_key_encrypted),
            "api_secret": decrypt_sensitive_data(self.api_secret_encrypted)
        }
```

## 7.4 Auditoria e Compliance

```python
# Para sistemas financeiros, manter registro detalhado de todas as ações

class AuditLog:
    """Log de auditoria para compliance"""
    
    @staticmethod
    async def log(
        tenant_id: str,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        old_value: dict = None,
        new_value: dict = None,
        ip_address: str = None,
        user_agent: str = None
    ):
        """Registra ação para auditoria"""
        
        log_entry = {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "user_id": user_id,
            "action": action,  # CREATE, READ, UPDATE, DELETE
            "resource_type": resource_type,  # "transaction", "company", "user"
            "resource_id": resource_id,
            "old_value": old_value,  # Estado anterior (para UPDATE/DELETE)
            "new_value": new_value,  # Novo estado (para CREATE/UPDATE)
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await db.audit_logs.insert_one(log_entry)
        
        # Para ações críticas, também enviar para sistema externo
        if action in ["DELETE", "UPDATE"] and resource_type in ["user", "company"]:
            # Enviar para Datadog/CloudWatch/etc
            pass
```

---

# 8. ESCALABILIDADE

## 8.1 Arquitetura Escalável

```
                         ┌─────────────────────────────────────────┐
                         │           LOAD BALANCER                 │
                         │    (AWS ALB / Cloudflare / Nginx)       │
                         └────────────────┬────────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
     ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
     │   Backend #1    │       │   Backend #2    │       │   Backend #N    │
     │   (Container)   │       │   (Container)   │       │   (Container)   │
     │                 │       │                 │       │                 │
     │  - Stateless    │       │  - Stateless    │       │  - Stateless    │
     │  - Auto-scale   │       │  - Auto-scale   │       │  - Auto-scale   │
     └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
              │                         │                         │
              └─────────────────────────┼─────────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
              ▼                         ▼                         ▼
     ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
     │     REDIS       │       │  MONGODB ATLAS  │       │    S3 / MINIO   │
     │    (Cache)      │       │   (Cluster)     │       │   (Arquivos)    │
     │                 │       │                 │       │                 │
     │  - Sessions     │       │  - Primary      │       │  - Extratos     │
     │  - Rate limit   │       │  - Secondary    │       │  - Exports      │
     │  - Queues       │       │  - Secondary    │       │  - Backups      │
     └─────────────────┘       └─────────────────┘       └─────────────────┘
```

## 8.2 Otimizações para Alta Carga

### Caching com Redis

```python
# cache/redis_cache.py
import redis
import json
from functools import wraps

redis_client = redis.Redis(
    host=os.environ["REDIS_HOST"],
    port=6379,
    db=0,
    decode_responses=True
)

def cache(ttl: int = 300):
    """Decorator para cache de funções"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Gerar chave única
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Tentar buscar do cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Executar função
            result = await func(*args, **kwargs)
            
            # Salvar no cache
            redis_client.setex(cache_key, ttl, json.dumps(result, default=str))
            
            return result
        return wrapper
    return decorator

# Exemplo de uso
@cache(ttl=60)  # Cache por 1 minuto
async def get_dashboard_stats(tenant_id: str):
    # Query pesada que será cacheada
    stats = await db.bank_statements.aggregate([...]).to_list(1000)
    return stats
```

### Processamento Assíncrono com Filas

```python
# Para processamento de extratos grandes, usar fila

# workers/statement_processor.py
from celery import Celery

celery_app = Celery(
    "dominio_bridge",
    broker=os.environ["REDIS_URL"],
    backend=os.environ["REDIS_URL"]
)

@celery_app.task
def process_statement_async(statement_id: str, file_content: bytes):
    """Processa extrato em background"""
    
    # Processamento pesado
    transactions = parse_statement(file_content)
    
    # Classificação
    for t in transactions:
        classify_transaction(t)
    
    # Salvar no banco
    save_transactions(statement_id, transactions)
    
    # Notificar usuário (websocket ou email)
    notify_user(statement_id, "completed")

# No endpoint
@router.post("/upload")
async def upload_statement(file: UploadFile):
    # Salvar metadados imediatamente
    statement = await create_statement_record(file.filename)
    
    # Processar em background
    process_statement_async.delay(statement.id, await file.read())
    
    return {"message": "Processamento iniciado", "statement_id": statement.id}
```

## 8.3 Métricas de Capacidade

| Métrica | Tier Básico | Tier Profissional | Tier Enterprise |
|---------|-------------|-------------------|-----------------|
| Escritórios | 1-10 | 10-100 | 100+ |
| Usuários simultâneos | 50 | 500 | 5000+ |
| Requests/segundo | 100 | 1000 | 10000+ |
| Transações/mês | 100k | 1M | 10M+ |
| Storage | 10GB | 100GB | 1TB+ |

---

# 9. MONITORAMENTO E MANUTENÇÃO

## 9.1 Stack de Monitoramento Recomendada

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILIDADE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     LOGS        │  │    METRICS      │  │    TRACES       │ │
│  │                 │  │                 │  │                 │ │
│  │  - Application  │  │  - CPU/Memory   │  │  - Request flow │ │
│  │  - Access       │  │  - Response time│  │  - DB queries   │ │
│  │  - Error        │  │  - Error rate   │  │  - External API │ │
│  │                 │  │  - Throughput   │  │                 │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │          │
│           └────────────────────┼────────────────────┘          │
│                                │                               │
│                    ┌───────────▼───────────┐                   │
│                    │   DATADOG / GRAFANA   │                   │
│                    │   - Dashboards        │                   │
│                    │   - Alerts            │                   │
│                    │   - Reports           │                   │
│                    └───────────────────────┘                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 9.2 Configuração de Logs Estruturados

```python
# logging_config.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Formatter que gera logs em JSON (ideal para agregação)"""
    
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Adicionar campos extras se existirem
        if hasattr(record, "tenant_id"):
            log_data["tenant_id"] = record.tenant_id
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        # Adicionar exception se existir
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

# Configurar logging
def setup_logging():
    logger = logging.getLogger("dominio_bridge")
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
    
    return logger

logger = setup_logging()

# Exemplo de uso
logger.info("Extrato processado", extra={
    "tenant_id": "abc123",
    "user_id": "user456",
    "statement_id": "stmt789",
    "transaction_count": 150
})
```

## 9.3 Health Checks e Alertas

```python
# routes/health.py
from fastapi import APIRouter, HTTPException
import asyncio

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    """Health check básico"""
    return {"status": "healthy"}

@router.get("/health/detailed")
async def detailed_health_check():
    """Health check detalhado com verificação de dependências"""
    
    checks = {
        "api": "healthy",
        "database": "unknown",
        "redis": "unknown"
    }
    
    # Check MongoDB
    try:
        await asyncio.wait_for(db.command("ping"), timeout=5.0)
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
    
    # Check Redis
    try:
        redis_client.ping()
        checks["redis"] = "healthy"
    except Exception as e:
        checks["redis"] = f"unhealthy: {str(e)}"
    
    # Determinar status geral
    all_healthy = all(v == "healthy" for v in checks.values())
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }

# Endpoint para métricas (Prometheus format)
@router.get("/metrics")
async def metrics():
    """Métricas em formato Prometheus"""
    
    # Coletar métricas
    total_tenants = await db.tenants.count_documents({})
    total_users = await db.usuarios.count_documents({})
    total_transactions = await db.transactions.count_documents({})
    
    metrics_output = f"""
# HELP dominio_bridge_tenants_total Total de escritórios cadastrados
# TYPE dominio_bridge_tenants_total gauge
dominio_bridge_tenants_total {total_tenants}

# HELP dominio_bridge_users_total Total de usuários cadastrados
# TYPE dominio_bridge_users_total gauge
dominio_bridge_users_total {total_users}

# HELP dominio_bridge_transactions_total Total de transações processadas
# TYPE dominio_bridge_transactions_total counter
dominio_bridge_transactions_total {total_transactions}
"""
    
    return Response(content=metrics_output, media_type="text/plain")
```

## 9.4 Script de Backup e Recuperação

```bash
#!/bin/bash
# scripts/backup_and_restore.sh

# Configurações
ATLAS_URI="mongodb+srv://user:pass@cluster.mongodb.net"
DB_NAME="dominio_bridge_prod"
S3_BUCKET="s3://dominio-bridge-backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Função de backup
backup() {
    echo "Iniciando backup: $DATE"
    
    # Criar diretório temporário
    BACKUP_DIR="/tmp/backup_$DATE"
    mkdir -p $BACKUP_DIR
    
    # Exportar MongoDB
    mongodump --uri="$ATLAS_URI/$DB_NAME" --out="$BACKUP_DIR"
    
    # Comprimir
    tar -czf "$BACKUP_DIR.tar.gz" -C /tmp "backup_$DATE"
    
    # Upload para S3
    aws s3 cp "$BACKUP_DIR.tar.gz" "$S3_BUCKET/mongodb/$DATE.tar.gz"
    
    # Limpar
    rm -rf $BACKUP_DIR $BACKUP_DIR.tar.gz
    
    echo "Backup concluído: $S3_BUCKET/mongodb/$DATE.tar.gz"
}

# Função de restore
restore() {
    BACKUP_FILE=$1
    
    if [ -z "$BACKUP_FILE" ]; then
        echo "Uso: ./backup_and_restore.sh restore <backup_file.tar.gz>"
        exit 1
    fi
    
    echo "Iniciando restore de: $BACKUP_FILE"
    
    # Download do S3
    aws s3 cp "$S3_BUCKET/mongodb/$BACKUP_FILE" /tmp/
    
    # Descomprimir
    tar -xzf "/tmp/$BACKUP_FILE" -C /tmp
    
    # Restaurar
    RESTORE_DIR=$(tar -tzf "/tmp/$BACKUP_FILE" | head -1 | cut -f1 -d"/")
    mongorestore --uri="$ATLAS_URI" --drop "/tmp/$RESTORE_DIR"
    
    # Limpar
    rm -rf "/tmp/$BACKUP_FILE" "/tmp/$RESTORE_DIR"
    
    echo "Restore concluído!"
}

# Main
case $1 in
    backup)
        backup
        ;;
    restore)
        restore $2
        ;;
    *)
        echo "Uso: ./backup_and_restore.sh {backup|restore <file>}"
        exit 1
        ;;
esac
```

---

# 10. CHECKLIST FINAL DE PRODUÇÃO

## 10.1 Checklist Completo

### Infraestrutura
- [ ] Servidor de produção provisionado
- [ ] Domínio registrado e DNS configurado
- [ ] SSL/TLS configurado (HTTPS)
- [ ] Load balancer configurado (se necessário)
- [ ] CDN configurado para assets estáticos
- [ ] Firewall configurado

### Banco de Dados
- [ ] MongoDB Atlas cluster criado
- [ ] Índices otimizados criados
- [ ] Backup automático configurado
- [ ] Conexão criptografada (TLS)
- [ ] Usuário de produção com permissões mínimas
- [ ] IP whitelist configurado

### Backend
- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET único e seguro
- [ ] Bcrypt para senhas (rounds >= 12)
- [ ] Rate limiting ativo
- [ ] CORS configurado corretamente
- [ ] Logs estruturados
- [ ] Health checks funcionando

### Frontend
- [ ] Build de produção otimizado
- [ ] Variáveis de ambiente corretas
- [ ] Assets minificados
- [ ] Imagens otimizadas
- [ ] PWA configurado (opcional)

### Segurança
- [ ] Headers de segurança configurados
- [ ] Secrets em variáveis de ambiente
- [ ] Nenhuma credencial no código
- [ ] Rate limiting em endpoints sensíveis
- [ ] Validação de inputs
- [ ] Proteção CSRF (se necessário)
- [ ] Auditoria de dependências (npm audit, pip audit)

### Monitoramento
- [ ] Logs centralizados
- [ ] Alertas configurados
- [ ] Dashboard de métricas
- [ ] Health checks automatizados
- [ ] Error tracking (Sentry/Datadog)

### CI/CD
- [ ] Pipeline de deploy automático
- [ ] Testes automatizados no pipeline
- [ ] Rollback automático configurado
- [ ] Ambientes separados (staging/production)

### Documentação
- [ ] README atualizado
- [ ] Documentação de API (OpenAPI/Swagger)
- [ ] Runbook de operações
- [ ] Procedimento de disaster recovery

### Legal/Compliance
- [ ] Política de Privacidade
- [ ] Termos de Uso
- [ ] LGPD compliance
- [ ] Consentimento de cookies

### Negócio
- [ ] Planos e preços definidos
- [ ] Sistema de pagamento (Stripe/PagSeguro)
- [ ] Email transacional configurado
- [ ] Suporte ao cliente (chat/email)

---

## 10.2 Comando Final de Verificação

```bash
#!/bin/bash
# scripts/production_check.sh

echo "========================================"
echo "  VERIFICAÇÃO DE PRODUÇÃO"
echo "========================================"

# Verificar variáveis de ambiente
echo -e "\n📋 Variáveis de Ambiente:"
[ -n "$MONGO_URL" ] && echo "✅ MONGO_URL configurado" || echo "❌ MONGO_URL não configurado"
[ -n "$JWT_SECRET" ] && echo "✅ JWT_SECRET configurado" || echo "❌ JWT_SECRET não configurado"
[ -n "$REDIS_URL" ] && echo "✅ REDIS_URL configurado" || echo "⚠️ REDIS_URL não configurado (opcional)"

# Verificar conexão com banco
echo -e "\n📊 Banco de Dados:"
mongosh "$MONGO_URL" --eval "db.adminCommand('ping')" > /dev/null 2>&1 && \
    echo "✅ MongoDB conectado" || echo "❌ MongoDB não conectado"

# Verificar endpoints
echo -e "\n🌐 Endpoints:"
curl -s https://api.seudominio.com.br/api/health > /dev/null && \
    echo "✅ API respondendo" || echo "❌ API não respondendo"

curl -s https://seudominio.com.br > /dev/null && \
    echo "✅ Frontend respondendo" || echo "❌ Frontend não respondendo"

# Verificar SSL
echo -e "\n🔒 SSL/TLS:"
echo | openssl s_client -connect seudominio.com.br:443 2>/dev/null | \
    openssl x509 -noout -dates 2>/dev/null && \
    echo "✅ Certificado SSL válido" || echo "❌ Problema com SSL"

echo -e "\n========================================"
echo "  Verificação concluída!"
echo "========================================"
```

---

## 📌 RESUMO EXECUTIVO

### Custos Estimados (Mensal)

| Item | Básico | Profissional |
|------|--------|--------------|
| Hosting Backend | $7 | $50 |
| Hosting Frontend | Grátis | $20 |
| MongoDB Atlas | Grátis | $57 |
| Domínio | $3 | $3 |
| Cloudflare | Grátis | $20 |
| Monitoramento | Grátis | $25 |
| **TOTAL** | **~$10/mês** | **~$175/mês** |

### Timeline de Implementação

| Fase | Duração | Atividades |
|------|---------|------------|
| 1. Preparação | 1 semana | Multi-tenant, bcrypt, testes |
| 2. Infraestrutura | 1 semana | Atlas, hosting, CI/CD |
| 3. Domínio/SSL | 2-3 dias | DNS, certificados |
| 4. Monitoramento | 2-3 dias | Logs, alertas |
| 5. Testes | 1 semana | Load testing, segurança |
| 6. Go-live | 1 dia | Deploy, verificação |

**Total: ~4 semanas**

---

**Versão:** 1.0  
**Última Atualização:** Março/2025
