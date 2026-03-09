# 📋 DOCUMENTAÇÃO TÉCNICA E FUNCIONAL
## Sistema de Conciliação Contábil - Domínio Bridge

---

## 1. VISÃO GERAL DO SISTEMA

### 1.1 Objetivo
O **Domínio Bridge** é um sistema web desenvolvido para **escritórios de contabilidade brasileiros** que utilizam o software **Domínio da Thomson Reuters**. O sistema automatiza o processamento de extratos bancários, convertendo arquivos de múltiplos formatos (OFX, Excel, PDF, CSV) em lançamentos contábeis prontos para importação no sistema Domínio.

### 1.2 Problema Resolvido
- Elimina o trabalho manual de digitação de extratos bancários
- Padroniza a classificação contábil através de aprendizado inteligente
- Organiza o controle de competências mensais por empresa
- Centraliza a gestão de múltiplas empresas clientes

### 1.3 Público-Alvo
- Escritórios de contabilidade
- Contadores autônomos
- Departamentos contábeis de empresas

---

## 2. LISTA COMPLETA DE FUNCIONALIDADES

| # | Módulo | Funcionalidade | Status |
|---|--------|----------------|--------|
| 1 | Dashboard | Painel operacional com KPIs | ✅ Ativo |
| 2 | Empresas | CRUD de empresas clientes | ✅ Ativo |
| 3 | Plano de Contas | Gestão de planos e contas contábeis | ✅ Ativo |
| 4 | Processamento | Upload e processamento de extratos | ✅ Ativo |
| 5 | Histórico | Listagem agrupada por empresa | ✅ Ativo |
| 6 | Detalhes | Visualização e edição de lançamentos | ✅ Ativo |
| 7 | Edição em Massa | Classificação múltipla simultânea | ✅ Ativo |
| 8 | Classificação Inteligente | Aprendizado automático | ✅ Ativo |
| 9 | Processamentos Contábeis | Controle de competências mensais | ✅ Ativo |
| 10 | Regras de Classificação | Regras automáticas por palavra-chave | ✅ Ativo |
| 11 | Exportação XLSX | Download formatado para Domínio | ✅ Ativo |
| 12 | Conversor OFX | Conversão interativa de arquivos | ⏸️ Standby |

---

## 3. DESCRIÇÃO DAS FUNCIONALIDADES

### 3.1 Dashboard Operacional
Painel de controle com visão geral do escritório contábil:
- Empresas em dia vs atrasadas
- Quantidade de classificações pendentes
- Ranking de empresas mais atrasadas
- Alertas de competências não processadas

### 3.2 Gestão de Empresas
Cadastro completo de empresas clientes:
- CNPJ, razão social, endereço, contato
- Vinculação automática com extratos e planos de contas

### 3.3 Plano de Contas
Gerenciamento de estruturas contábeis:
- Criação de múltiplos planos por empresa
- Cadastro de contas (código, descrição, tipo)
- Tipos: ATIVO, PASSIVO, RECEITA, DESPESA

### 3.4 Processamento de Extratos
Motor principal do sistema:
- **Formatos suportados:** OFX, XLSX, XLS (incluindo BIFF5/Excel 95), CSV, PDF
- **Parser inteligente:** Detecta automaticamente colunas de data, descrição, valor
- **Formato Santander:** Parser especializado para layout específico
- **Valores:** Suporta formato brasileiro (1.234,56) e americano (1,234.56)

### 3.5 Classificação Inteligente
Sistema de aprendizado baseado em histórico:
- Memoriza classificações manuais por empresa
- Aplica automaticamente em transações similares (>60% similaridade)
- Aumenta precisão com o uso contínuo

### 3.6 Edição em Massa
Produtividade na classificação:
- Seleção múltipla de lançamentos
- Aplicação de conta débito/crédito em lote
- Filtros por status (classificado/pendente)

### 3.7 Processamentos Contábeis
Controle de competências mensais:
- Estrutura hierárquica: Empresa > Ano > Mês
- Status: Não iniciado, Em processamento, Aguardando documentos, Concluído, Arquivado
- Atribuição de responsável
- Arquivamento automático de períodos antigos

### 3.8 Exportação para Domínio
Geração de arquivo XLSX formatado:
- Colunas padronizadas: Data, Histórico, Débito, Crédito, Valor
- Formatação visual para conferência
- Download direto pelo navegador

---

## 4. ESTRUTURA DE MÓDULOS

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────┤
│  Pages/                                                      │
│  ├── Dashboard.js          → Painel principal               │
│  ├── Companies.js          → CRUD de empresas               │
│  ├── ChartOfAccounts.js    → Plano de contas                │
│  ├── NewProcessing.js      → Upload de extratos             │
│  ├── History.js            → Histórico agrupado             │
│  ├── StatementDetails.js   → Detalhes + edição              │
│  ├── AccountingProcesses.js → Controle mensal              │
│  ├── Settings.js           → Configurações/regras           │
│  └── OFXConverter.js       → Conversor (standby)            │
│                                                              │
│  Components/                                                 │
│  ├── SidebarLayout.js      → Menu lateral                   │
│  └── ui/                   → Componentes Shadcn/UI          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                       │
├─────────────────────────────────────────────────────────────┤
│  server.py (monolítico)                                     │
│  ├── Models (Pydantic)     → Schemas de dados               │
│  ├── Helpers               → Parsers, classificadores       │
│  ├── Routes/API            → Endpoints REST                 │
│  └── Database              → Conexão MongoDB                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                      │
├─────────────────────────────────────────────────────────────┤
│  Collections:                                                │
│  ├── companies             → Empresas cadastradas           │
│  ├── chart_of_accounts     → Planos de contas               │
│  ├── account_items         → Contas contábeis               │
│  ├── bank_statements       → Extratos processados           │
│  ├── transactions          → Lançamentos individuais        │
│  ├── classification_rules  → Regras automáticas             │
│  ├── classification_history→ Histórico de aprendizado       │
│  └── accounting_processes  → Processamentos mensais         │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. ARQUITETURA UTILIZADA

### 5.1 Padrão Arquitetural
**Monolito Modular** com separação clara entre:
- **Frontend SPA:** React com roteamento client-side
- **Backend API:** FastAPI com endpoints RESTful
- **Banco NoSQL:** MongoDB para flexibilidade de schema

### 5.2 Comunicação
```
[Browser] ←→ [React SPA] ←→ [FastAPI] ←→ [MongoDB]
              :3000           :8001        :27017
```

### 5.3 Deploy
- **Proxy reverso:** Nginx/Kubernetes Ingress
- **Rotas `/api/*`:** Direcionadas ao backend (porta 8001)
- **Rotas `/`:** Direcionadas ao frontend (porta 3000)

---

## 6. TECNOLOGIAS E FRAMEWORKS

### 6.1 Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 19.0.0 | Framework UI |
| React Router DOM | 7.5.1 | Roteamento |
| Tailwind CSS | 3.4.17 | Estilização |
| Shadcn/UI | - | Componentes |
| Axios | 1.8.4 | HTTP Client |
| Lucide React | 0.507.0 | Ícones |
| Recharts | 3.6.0 | Gráficos |
| Sonner | 2.0.3 | Notificações |

### 6.2 Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Python | 3.11 | Linguagem |
| FastAPI | 0.110.1 | Framework API |
| Pydantic | 2.12.5 | Validação |
| Motor | 3.3.1 | MongoDB Async |
| Pandas | 3.0.1 | Processamento dados |
| OpenPyXL | 3.1.5 | Excel moderno |
| xlrd | 2.0.2 | Excel legado |
| PDFPlumber | 0.11.9 | Extração PDF |
| OFXParse | 0.21 | Parser OFX |
| Gnumeric (ssconvert) | 1.12.55 | Conversão Excel antigo |

### 6.3 Banco de Dados
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| MongoDB | 6.x | Banco principal |
| PyMongo | 4.5.0 | Driver sync |
| Motor | 3.3.1 | Driver async |

---

## 7. ESTRUTURA DO BANCO DE DADOS

### 7.1 Collection: `companies`
```javascript
{
  "id": "uuid",
  "cnpj": "12345678000199",
  "name": "Razão Social",
  "address": "Endereço completo",
  "phone": "(11) 99999-9999",
  "email": "contato@empresa.com",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### 7.2 Collection: `chart_of_accounts`
```javascript
{
  "id": "uuid",
  "company_id": "uuid (ref: companies)",
  "name": "Plano de Contas 2025",
  "description": "Descrição opcional",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### 7.3 Collection: `account_items`
```javascript
{
  "id": "uuid",
  "chart_id": "uuid (ref: chart_of_accounts)",
  "code": "1.1.01.001",
  "description": "Caixa Geral",
  "account_type": "ATIVO|PASSIVO|RECEITA|DESPESA",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### 7.4 Collection: `bank_statements`
```javascript
{
  "id": "uuid",
  "company_id": "uuid (ref: companies)",
  "chart_id": "uuid (ref: chart_of_accounts)",
  "filename": "extrato_01_2025.ofx",
  "bank_name": "Banco do Brasil",
  "period": "01/2025",
  "total_transactions": 150,
  "classified_count": 120,
  "manual_count": 30,
  "total_inflows": 50000.00,
  "total_outflows": 35000.00,
  "balance": 15000.00,
  "status": "COMPLETED",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### 7.5 Collection: `transactions`
```javascript
{
  "id": "uuid",
  "statement_id": "uuid (ref: bank_statements)",
  "date": "15/01/2025",
  "description": "PAG*FORNECEDOR XYZ",
  "document": "DOC123456",
  "amount": 1500.00,
  "transaction_type": "D|C",
  "debit_account": "3.1.01.001",
  "credit_account": "1.1.01.001",
  "status": "CLASSIFICADO|CLASSIFICAR MANUALMENTE",
  "notes": "Observação opcional"
}
```

### 7.6 Collection: `classification_history`
```javascript
{
  "id": "uuid",
  "company_id": "uuid (ref: companies)",
  "description_pattern": "PAG*FORNECEDOR",
  "transaction_type": "D",
  "debit_account": "3.1.01.001",
  "credit_account": "1.1.01.001",
  "usage_count": 15,
  "last_used": "2025-03-01T14:00:00Z",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### 7.7 Collection: `accounting_processes`
```javascript
{
  "id": "uuid",
  "company_id": "uuid",
  "company_name": "Razão Social",
  "year": 2025,
  "month": 1,
  "period": "01/2025",
  "status": "NAO_INICIADO|EM_PROCESSAMENTO|AGUARDANDO_DOCUMENTOS|CONCLUIDO|ARQUIVADO",
  "responsible": "João Silva",
  "observations": "Aguardando extrato do Itaú",
  "statement_ids": ["uuid1", "uuid2"],
  "total_transactions": 150,
  "classified_transactions": 120,
  "pending_transactions": 30,
  "is_archived": false,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z",
  "completed_at": null
}
```

---

## 8. FLUXO DE FUNCIONAMENTO

### 8.1 Fluxo Principal de Processamento

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   USUÁRIO    │     │   SISTEMA    │     │   RESULTADO  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Seleciona       │                    │
       │    empresa e       │                    │
       │    plano           │                    │
       ├───────────────────►│                    │
       │                    │                    │
       │ 2. Upload do       │                    │
       │    extrato         │                    │
       ├───────────────────►│                    │
       │                    │ 3. Detecta formato │
       │                    │    (OFX/XLS/PDF)   │
       │                    ├───────────────────►│
       │                    │                    │
       │                    │ 4. Extrai          │
       │                    │    transações      │
       │                    ├───────────────────►│
       │                    │                    │
       │                    │ 5. Classifica      │
       │                    │    automaticamente │
       │                    ├───────────────────►│
       │                    │                    │
       │◄───────────────────┤ 6. Retorna preview │
       │                    │                    │
       │ 7. Revisão manual  │                    │
       │    (se necessário) │                    │
       ├───────────────────►│                    │
       │                    │                    │
       │◄───────────────────┤ 8. Salva no banco  │
       │                    │                    │
       │ 9. Exporta XLSX    │                    │
       ├───────────────────►│                    │
       │                    │                    │
       │◄───────────────────┤10. Download arquivo│
       │                    │                    │
       ▼                    ▼                    ▼
```

### 8.2 Fluxo de Classificação Inteligente

```
                    ┌─────────────────┐
                    │ Nova Transação  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Busca histórico │
                    │ da empresa      │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ┌─────────────────┐          ┌─────────────────┐
     │ Encontrou match │          │ Não encontrou   │
     │ (>60% similar)  │          └────────┬────────┘
     └────────┬────────┘                   │
              │                            ▼
              │                   ┌─────────────────┐
              │                   │ Busca regras    │
              │                   │ por keyword     │
              │                   └────────┬────────┘
              │                            │
              │              ┌─────────────┴─────────────┐
              │              ▼                           ▼
              │     ┌─────────────────┐        ┌─────────────────┐
              │     │ Regra encontrada│        │ Usa lógica      │
              │     └────────┬────────┘        │ D/C automática  │
              │              │                 └────────┬────────┘
              ▼              ▼                          ▼
     ┌─────────────────────────────────────────────────────────┐
     │                  CLASSIFICADO / MANUAL                   │
     └─────────────────────────────────────────────────────────┘
```

---

## 9. INTEGRAÇÕES E APIs

### 9.1 APIs Externas
O sistema **não possui integrações externas obrigatórias**. Opera 100% offline após instalação.

### 9.2 APIs Internas (Endpoints Principais)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/` | Health check |
| GET | `/api/dashboard/stats` | Estatísticas do dashboard |
| **Empresas** |||
| GET | `/api/companies` | Listar empresas |
| POST | `/api/companies` | Criar empresa |
| PUT | `/api/companies/{id}` | Atualizar empresa |
| DELETE | `/api/companies/{id}` | Excluir empresa |
| **Plano de Contas** |||
| GET | `/api/chart-of-accounts` | Listar planos |
| POST | `/api/chart-of-accounts` | Criar plano |
| GET | `/api/chart-of-accounts/{id}/accounts` | Listar contas |
| POST | `/api/accounts` | Criar conta |
| **Extratos** |||
| GET | `/api/bank-statements` | Listar extratos |
| POST | `/api/bank-statements/upload` | Upload e processamento |
| GET | `/api/bank-statements/{id}` | Detalhes do extrato |
| GET | `/api/bank-statements/{id}/export` | Exportar XLSX |
| DELETE | `/api/bank-statements/{id}` | Excluir extrato |
| **Transações** |||
| GET | `/api/bank-statements/{id}/transactions` | Listar transações |
| PUT | `/api/transactions/{id}` | Atualizar transação |
| PUT | `/api/transactions/bulk-update` | Atualização em massa |
| **Processamentos** |||
| GET | `/api/accounting-processes` | Listar processamentos |
| POST | `/api/accounting-processes` | Criar processamento |
| PUT | `/api/accounting-processes/{id}` | Atualizar status |
| POST | `/api/accounting-processes/bulk-create` | Criação em massa |
| **Regras** |||
| GET | `/api/classification-rules` | Listar regras |
| POST | `/api/classification-rules` | Criar regra |

---

## 10. MANUAL RESUMIDO DE USO

### 10.1 Primeiro Acesso
1. Acesse o sistema pelo navegador
2. Vá em **"Empresas"** → Cadastre sua primeira empresa
3. Vá em **"Plano de Contas"** → Crie um plano para a empresa
4. Cadastre as contas contábeis (código, descrição, tipo)

### 10.2 Processando um Extrato
1. Clique em **"Novo Processamento"**
2. Selecione a **Empresa** e o **Plano de Contas**
3. Informe o **Banco** e o **Período** (MM/AAAA)
4. Faça upload do arquivo (OFX, Excel, PDF ou CSV)
5. Aguarde o processamento automático
6. Revise e classifique manualmente os lançamentos pendentes
7. Clique em **"Salvar"** para finalizar

### 10.3 Classificação Manual
1. Na tela de **Detalhes do Extrato**, localize os lançamentos com status "Manual"
2. Clique no lançamento ou use a **seleção múltipla**
3. Informe a **Conta Débito** e **Conta Crédito**
4. O sistema aprenderá e aplicará automaticamente em transações futuras similares

### 10.4 Exportação para Domínio
1. No **Histórico**, localize o extrato desejado
2. Clique no ícone de **Download (↓)**
3. O arquivo XLSX será baixado formatado para importação no Domínio

### 10.5 Controle de Competências
1. Acesse **"Processamentos"**
2. Visualize o status de cada empresa por mês
3. Atualize o status conforme o andamento (Em processamento, Concluído, etc.)
4. Atribua responsáveis para cada competência

---

## 📌 INFORMAÇÕES ADICIONAIS

### Requisitos de Sistema
- **Navegador:** Chrome, Firefox, Edge (versões recentes)
- **Servidor:** 2GB RAM mínimo, 4GB recomendado
- **Banco:** MongoDB 4.x ou superior

### Formatos de Arquivo Suportados
| Formato | Extensão | Observação |
|---------|----------|------------|
| OFX | .ofx | Formato padrão bancário |
| Excel Moderno | .xlsx | Excel 2007+ |
| Excel Antigo | .xls | Incluindo BIFF5 (Excel 95) |
| CSV | .csv | Diversos encodings |
| PDF | .pdf | Com tabelas estruturadas |

### Limitações Conhecidas
- PDFs escaneados (imagem) não são suportados
- Máximo recomendado: 5.000 transações por extrato
- Senhas em arquivos não são suportadas

---

**Versão do Documento:** 1.0  
**Última Atualização:** Março/2025  
**Sistema:** Domínio Bridge v1.0
