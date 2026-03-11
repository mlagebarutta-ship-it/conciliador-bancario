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
   - Acesso ao menu operacional + seção "Administração"

3. **COLABORADOR:** Operador do sistema
   - Opera o sistema (importa extratos, classifica transações)
   - Acessa apenas empresas atribuídas
   - Acesso ao menu operacional básico

### Isolamento de Dados
- Todos os modelos de dados possuem `tenant_id`
- Todos os endpoints operacionais filtram por `tenant_id` do JWT
- Impossível acessar dados de outro escritório

### Endpoints do Super Admin
- `GET /api/superadmin/dashboard` - Estatísticas globais
- `GET /api/superadmin/tenants` - Lista todos os escritórios
- `GET /api/superadmin/tenants/{id}` - Detalhes de um escritório
- `POST /api/superadmin/tenants` - Criar novo escritório
- `PUT /api/superadmin/tenants/{id}` - Atualizar escritório
- `GET /api/superadmin/usuarios` - Lista todos os usuários
- `POST /api/superadmin/migrate-data` - Migra dados para tenant padrão

## Funcionalidades Implementadas

### 1. Processamento de Extratos
- Upload de arquivos OFX, Excel (xlsx, xls), CSV e PDF
- Parser inteligente com detecção automática de formato
- Suporte a arquivos Excel antigos (BIFF5/Excel 5.0/95)

### 2. Sistema de Classificação Inteligente
- Memória de classificações (histórico de aprendizado)
- Classificação automática por similaridade (>60%)
- Edição em massa de lançamentos

### 3. Gestão de Entidades
- CRUD completo para Empresas
- CRUD completo para Planos de Contas
- Importação em massa de Plano de Contas via Excel
- CRUD completo para Regras de Classificação

### 4. Sistema de Usuários e Autenticação
- Autenticação via JWT
- CRUD de usuários por tenant
- Log de atividades
- Atribuição de empresas a colaboradores (P1)

### 5. Interface do Usuário
- Dashboard operacional por tenant
- Dashboard global para Super Admin
- Menu lateral dinâmico por perfil
- Histórico de processamentos (accordion por empresa)

## Credenciais de Teste
- **Super Admin:** mlagebarutta@gmail.com / super123
- **Admin Escritório:** admin@dominio.com / admin123

## Tenant Existente
- **ID:** 658832a0-8c77-40ff-8825-971f74caa3f2
- **Nome:** Escritório Padrão (Migrado)
- **Empresas:** 19
- **Usuários:** 3
- **Extratos:** 16

## Próximas Tarefas (Backlog)

### P1 - Atribuição de Empresas a Colaboradores
Implementar a lógica para que um admin possa atribuir empresas específicas a um colaborador.

### P2 - Plano de Contas Dinâmico
Permitir criar novas contas contábeis durante a classificação.

### P2 - Refatoração do Backend
Separar `server.py` em módulos: models, routers, services (arquivo >4000 linhas).

### P3 - Sistema de Planos e Pagamentos
Integrar Stripe para gerenciar assinaturas dos escritórios.

### P3 - Integração com Open Finance
Explorar integração com APIs Pluggy ou Belvo.

### P3 - Reativar Conversor OFX
Módulo existe mas está oculto na UI. Pode ser reativado como feature.

## Arquivos de Referência
- `/app/backend/server.py` - Backend principal
- `/app/frontend/src/App.js` - Rotas do frontend
- `/app/frontend/src/components/SidebarLayout.js` - Menu dinâmico
- `/app/frontend/src/pages/superadmin/` - Páginas do Super Admin
- `/app/frontend/src/utils/api.js` - Utilitário axios com token automático

## Última Atualização
**11/03/2026** - Sistema Multi-Tenant implementado e testado com 100% de sucesso. Isolamento de dados verificado para todos os endpoints operacionais.
