# Domínio Bridge - PRD (Product Requirements Document)

## Problema Original
Sistema web para contadores processar extratos bancários e converter em lançamentos para o Sistema Domínio (Thomson Reuters). Evoluiu para SaaS multi-tenant.

## Personas
- **Super Admin (Dono da Plataforma):** Gerencia escritórios/tenants, vê métricas globais
- **Admin do Escritório:** Gerencia empresas, usuários e configurações do tenant
- **Colaborador:** Opera o sistema com acesso restrito às empresas atribuídas

## Arquitetura Multi-Tenant
- Isolamento completo de dados por tenant
- 3 níveis de acesso: super_admin, admin_tenant, colaborador
- Colaboradores só acessam empresas vinculadas via `empresas_vinculadas`

## Funcionalidades Implementadas

### Core
- [x] Upload/processamento de extratos (OFX, Excel/XLSX, CSV, PDF)
- [x] Classificação automática de transações (regras + histórico + aprendizado)
- [x] Exportação de lançamentos para Excel (formato Domínio)
- [x] Gestão de empresas e planos de contas
- [x] Conversor OFX (Excel/PDF/CSV → OFX)
- [x] Dashboard com métricas e status de empresas

### Multi-Tenant SaaS
- [x] CRUD de Escritórios (Tenants)
- [x] Gestão de Usuários por Tenant
- [x] Atribuição de Empresas a Colaboradores
- [x] Regras de Classificação Global e por Empresa
- [x] Processamentos Contábeis com agrupamento e arquivamento
- [x] Logs de Atividade por Tenant

### Refatoração
- [x] Backend refatorado de monolítico (4350 linhas) para modular (Dec 2025)

## Arquitetura Técnica

### Backend (FastAPI + MongoDB)
```
backend/
├── server.py           # Entry point (~60 linhas)
├── database.py         # MongoDB connection
├── models/             # Pydantic models
│   ├── tenant.py
│   ├── user.py
│   ├── company.py
│   ├── transaction.py
│   └── accounting.py
├── auth/
│   └── helpers.py      # JWT, auth dependencies
├── services/
│   ├── classification.py  # Classificação inteligente
│   └── parsers.py        # Parsers OFX/PDF/Excel/CSV
├── routes/
│   ├── auth.py, superadmin.py, users.py
│   ├── dashboard.py, companies.py
│   ├── chart_of_accounts.py, classification.py
│   ├── statements.py, accounting.py, converter.py
└── utils/
    └── helpers.py
```

### Frontend (React + Tailwind)
```
frontend/src/
├── pages/              # Dashboard, Settings, History, etc.
├── components/         # Sidebar, shared components
└── utils/api.js        # Axios client com interceptor JWT
```

## DB Schema (MongoDB)
- **tenants:** id, nome, cnpj, email, plano, status, max_usuarios, max_empresas
- **usuarios:** id, tenant_id, nome, email, senha, perfil, status
- **usuario_empresas:** id, tenant_id, usuario_id, empresa_id
- **companies:** id, tenant_id, cnpj, name
- **chart_of_accounts:** id, tenant_id, company_id, name
- **account_items:** id, tenant_id, chart_id, code, description, account_type
- **classification_rules:** id, tenant_id, company_id (opcional), keyword, debit/credit_account_code, priority
- **classification_history:** id, tenant_id, company_id, description_pattern, debit/credit_account, usage_count
- **bank_statements:** id, tenant_id, company_id, chart_id, filename, period, status
- **transactions:** id, statement_id, date, description, amount, transaction_type, debit/credit_account, status
- **accounting_processes:** id, tenant_id, company_id, year, month, status
- **activity_logs:** id, tenant_id, usuario_id, acao, detalhes

## Issues Conhecidos
- (P2) Arquivos `.xls` legados não processam (falta `ssconvert`/`gnumeric`)
- (P3) React hydration warnings em tabelas (HTML aninhado incorreto)

## Backlog (Priorizado)
- (P1) Recuperação de Senha (requer integração email)
- (P1) Deploy em Produção
- (P2) Validação de CNPJ nos formulários
- (P2) Timeout/expiração de sessão JWT
- (P2) Plano de Contas Dinâmico (criar contas durante classificação)
- (P3) Sistema de Planos/Pagamentos (Stripe)
- (P3) Integração Open Finance (Pluggy/Belvo)
