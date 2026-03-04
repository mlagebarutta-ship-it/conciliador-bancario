# Domínio Bridge - Sistema de Processamento de Extratos Bancários

## Descrição do Projeto
Sistema web para contadores brasileiros que usam o software "Domínio" (Thomson Reuters). Processa extratos bancários (OFX, Excel, PDF, CSV) e converte em arquivo Excel (.xlsx) estruturado para importação no sistema Domínio.

## Stack Tecnológica
- **Frontend:** React, Tailwind CSS, Lucide React (ícones)
- **Backend:** FastAPI (Python)
- **Banco de Dados:** MongoDB
- **Processamento de Arquivos:** ofxparse (OFX), pandas/openpyxl (Excel), pdfplumber (PDF)

## Funcionalidades Implementadas ✅

### 1. Processamento de Extratos (Atualizado 04/03/2026)
- Upload de arquivos OFX, Excel (xlsx, xls), CSV e PDF
- **Parser inteligente que identifica corretamente:**
  - Valores positivos (créditos/entradas) e negativos (débitos/saídas)
  - Colunas separadas de Débito e Crédito
  - Coluna única de Valor com detecção de sinal
  - Coluna de Tipo (D/C) quando presente
  - Formato de número brasileiro (1.234,56) e americano (1,234.56)
  - **NOVO: Valores com sinal negativo no final (ex: 415,84-) - Formato Santander**
- **Parser especializado para formato Santander:**
  - Detecta automaticamente extratos do Santander
  - Processa colunas Unnamed corretamente
  - Identifica créditos (valores float) e débitos (valores com "-" no final)
- Extração de tabelas estruturadas em PDFs
- Suporte a CSV com diferentes encodings (UTF-8, Latin-1, ISO-8859-1)

### 2. Sistema de Classificação Inteligente com Aprendizado ✅ (Implementado 04/03/2026)
- **Memória de Classificações:** Quando o usuário classifica manualmente uma transação, o sistema salva no histórico (`classification_history`)
- **Aprendizado Automático:** Em novos processamentos, o sistema busca no histórico por descrições similares (>60% similaridade)
- **Aplicação Automática:** Transações similares são classificadas automaticamente com base no histórico
- **Contador de Uso:** O sistema rastreia quantas vezes cada classificação foi usada

### 3. Gestão de Entidades
- CRUD completo para Empresas (clientes)
- CRUD completo para Planos de Contas
- Importação em massa de Plano de Contas via Excel
- CRUD completo para Regras de Classificação

### 4. Exportação
- Gera arquivo XLSX com colunas na ordem: Descrição, Data, Valor, Conta Débito, Conta Crédito, Histórico
- Formatação profissional com cabeçalhos coloridos

### 5. Interface do Usuário
- Dashboard com visão geral
- Página de Histórico de Processamentos
- Página de Detalhes do Processamento (com edição inline)
- Página de Empresas
- Página de Plano de Contas
- Página de Configurações (Regras de Classificação)

## Formatos de Arquivo Suportados

### Excel/CSV
O sistema detecta automaticamente:
- **Coluna única de Valor:** Positivo = Crédito, Negativo = Débito
- **Colunas separadas:** Débito e Crédito em colunas diferentes
- **Coluna de Tipo:** D/C ou Débito/Crédito para identificar a natureza

### PDF
- Extração de tabelas estruturadas
- Detecção de padrões de extrato bancário
- Suporte a valores entre parênteses como negativos

## APIs Principais

### Classificação Inteligente
- `GET /api/classification-history` - Lista histórico de aprendizado
- `GET /api/classification-history?company_id=X` - Filtra por empresa
- `DELETE /api/classification-history/{id}` - Remove registro do histórico
- `PUT /api/transactions/{id}` - Atualiza transação E salva no histórico

### Processamento
- `POST /api/bank-statements/upload` - Processa extrato
- `GET /api/bank-statements` - Lista processamentos
- `GET /api/bank-statements/{id}` - Detalhes do processamento
- `GET /api/bank-statements/{id}/export` - Exporta XLSX

### Gestão
- `GET/POST/PUT/DELETE /api/companies` - Empresas
- `GET/POST/DELETE /api/chart-of-accounts` - Planos de Contas
- `POST /api/chart-of-accounts/{id}/import` - Importa contas em massa
- `GET/POST/PUT/DELETE /api/classification-rules` - Regras

## Próximas Tarefas (Backlog)

### P1 - Plano de Contas Dinâmico
Permitir criar novas contas contábeis durante a classificação, sem necessidade de cadastro prévio.

### P2 - Validação de Contas
Validar se as contas de débito/crédito existem no plano antes de permitir o salvamento.

### P3 - Refatoração do Backend
Separar `server.py` em módulos: models, routers, services.

## Última Atualização
**04/03/2026** - Corrigido parser de Excel/CSV/PDF para identificar corretamente débitos e créditos em múltiplos formatos de arquivo
