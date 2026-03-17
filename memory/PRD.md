# Domínio Bridge - Sistema SaaS Multi-Tenant para Contadores

## Descrição do Projeto
Sistema web SaaS para escritórios de contabilidade brasileiros. Processa extratos bancários (OFX, Excel, PDF, CSV) e converte em arquivo Excel (.xlsx) estruturado para importação no sistema Domínio (Thomson Reuters).

## Stack Tecnológica
- **Frontend:** React, Tailwind CSS, Lucide React (ícones)
- **Backend:** FastAPI (Python)
- **Banco de Dados:** MongoDB
- **Autenticação:** JWT (JSON Web Tokens)
- **Arquitetura:** SaaS Multi-Tenant

## Arquitetura Multi-Tenant ✅ (Implementado 11/03/2026)

### Níveis de Acesso
1. **SUPER ADMIN:** Dono da plataforma
   - Visualiza estatísticas globais
   - Gerencia todos os escritórios (tenants)
   - Gerencia todos os usuários da plataforma
   - Acesso via menu: Dashboard, Escritórios, Usuários

2. **ADMIN DO ESCRITÓRIO:** Administrador de um tenant específico
   - Gerencia usuários, empresas e configurações do seu escritório
   - Visualiza apenas dados do seu tenant
   - Pode atribuir empresas a colaboradores
   - Acesso ao menu operacional + seção "Administração"

3. **COLABORADOR:** Operador do sistema
   - Opera o sistema (importa extratos, classifica transações)
   - **Acessa apenas empresas atribuídas a ele** ✅
   - Acesso ao menu operacional básico

### Isolamento de Dados
- Todos os modelos de dados possuem `tenant_id`
- Todos os endpoints operacionais filtram por `tenant_id` do JWT
- Impossível acessar dados de outro escritório

## Funcionalidades Implementadas

### 1. Processamento de Extratos
- Upload de arquivos OFX, Excel (xlsx, xls), CSV e PDF
- Parser inteligente com detecção automática de formato
- Suporte a arquivos Excel antigos (BIFF5/Excel 5.0/95)

### 2. Sistema de Classificação Inteligente
- Memória de classificações (histórico de aprendizado)
- Classificação automática por similaridade (>60%)
- **Regras de classificação por empresa** ✅ (Implementado 17/03/2026)
- Edição em massa de lançamentos

### 3. Gestão de Entidades
- CRUD completo para Empresas
- CRUD completo para Planos de Contas
- Importação em massa de Plano de Contas via Excel
- CRUD completo para Regras de Classificação (com suporte a empresa específica)

### 4. Sistema de Usuários e Autenticação
- Autenticação via JWT
- CRUD de usuários por tenant
- Log de atividades
- **Atribuição de empresas a colaboradores** ✅ (Implementado 17/03/2026)

### 5. Interface do Usuário
- Dashboard operacional por tenant
- Dashboard global para Super Admin
- Menu lateral dinâmico por perfil
- Histórico de processamentos (accordion por empresa)

## Funcionalidades Implementadas em 17/03/2026

### Atribuição de Empresas a Colaboradores ✅
- Admin pode vincular/desvincular empresas a colaboradores
- Colaborador vê apenas empresas vinculadas no Dashboard
- Colaborador não pode acessar dados de empresas não vinculadas
- Todos os endpoints filtram dados por empresas do colaborador:
  - GET /api/companies
  - GET /api/dashboard/stats
  - GET /api/bank-statements
  - POST /api/bank-statements/upload
  - GET /api/accounting-processes

### Regras de Classificação por Empresa ✅
- Regras podem ser GLOBAIS (todas as empresas) ou específicas de UMA empresa
- Regras de empresa têm prioridade sobre regras globais
- UI permite filtrar e criar regras por empresa
- Backend aplica regras na ordem correta durante classificação

## Credenciais de Teste
- **Super Admin:** mlagebarutta@gmail.com / super123
- **Admin Escritório:** admin@dominio.com / admin123
- **Colaborador Teste:** teste.colab@dominio.com / teste123

## Tenant Existente
- **ID:** 658832a0-8c77-40ff-8825-971f74caa3f2
- **Nome:** Escritório Padrão (Migrado)
- **Empresas:** 21
- **Usuários:** 5
- **Extratos:** 22+

## Próximas Tarefas (Backlog)

### P1 - Alta Prioridade
- ~~Atribuição de Empresas a Colaboradores~~ ✅ CONCLUÍDO
- Recuperação de Senha (requer integração de e-mail)
- Validação de CNPJ nos formulários

### P2 - Média Prioridade
- Timeout de sessão JWT
- Refatoração do Backend (separar server.py em módulos)
- Plano de contas dinâmico (criar contas durante classificação)
- Correção dos "hydration errors" do React

### P3 - Baixa Prioridade
- Sistema de Planos e Pagamentos (Stripe)
- Integração com Open Finance (Pluggy/Belvo)
- Reativar Conversor OFX
- Suporte a arquivos .xls legados (requer ssconvert)

## Endpoints Principais

### Autenticação
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`

### Super Admin
- `GET /api/superadmin/dashboard`
- `GET /api/superadmin/tenants`
- `POST /api/superadmin/tenants`
- `PUT /api/superadmin/tenants/{id}`

### Empresas
- `GET /api/companies` - Lista empresas (filtrado por colaborador)
- `POST /api/companies`
- `PUT /api/companies/{id}`
- `DELETE /api/companies/{id}`

### Usuários
- `GET /api/usuarios`
- `POST /api/usuarios`
- `PUT /api/usuarios/{id}`
- `DELETE /api/usuarios/{id}`
- `POST /api/usuarios/{id}/empresas` - Vincular empresa a usuário
- `DELETE /api/usuarios/{id}/empresas/{empresa_id}` - Desvincular empresa

### Regras de Classificação
- `GET /api/classification-rules?company_id={id}` - Lista regras (com filtro opcional por empresa)
- `POST /api/classification-rules` - Criar regra (com company_id opcional)
- `PUT /api/classification-rules/{id}`
- `DELETE /api/classification-rules/{id}`

### Extratos
- `POST /api/bank-statements/upload`
- `GET /api/bank-statements`
- `GET /api/bank-statements/{id}/transactions`

## Arquivos de Referência
- `/app/backend/server.py` - Backend principal (>4300 linhas)
- `/app/frontend/src/App.js` - Rotas do frontend
- `/app/frontend/src/components/SidebarLayout.js` - Menu dinâmico
- `/app/frontend/src/pages/superadmin/` - Páginas do Super Admin
- `/app/frontend/src/pages/Settings.js` - Configurações e regras por empresa
- `/app/frontend/src/pages/UserManagement.js` - Gerenciamento de usuários
- `/app/frontend/src/utils/api.js` - Utilitário axios com token automático

## Schema do Banco de Dados

### classification_rules
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "company_id": "uuid | null",  // null = regra global
  "company_name": "string | null",
  "keyword": "string",
  "debit_account_code": "string",
  "credit_account_code": "string",
  "description": "string",
  "priority": "int",
  "created_at": "datetime"
}
```

### usuario_empresas (Vínculo usuário-empresa)
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "usuario_id": "uuid",
  "empresa_id": "uuid"
}
```

## Última Atualização
**17/03/2026** - Implementadas duas funcionalidades principais:
1. Atribuição de Empresas a Colaboradores - Controle granular de acesso
2. Regras de Classificação por Empresa - Personalização por cliente
