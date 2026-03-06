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
- **Dashboard Operacional** (Reformulado 06/03/2026) - Painel de controle para escritórios contábeis
- Página de Histórico de Processamentos
- Página de Detalhes do Processamento (com edição inline e **edição em massa**)
- Página de Empresas
- Página de Plano de Contas
- Página de Configurações (Regras de Classificação)

### 6. Edição em Massa de Lançamentos ✅ (Implementado 05/03/2026)
- **Seleção múltipla:** Checkboxes ao lado de cada lançamento
- **Seleção rápida:** Botão "Selecionar Todos" no cabeçalho
- **Indicador visual:** Contador de lançamentos selecionados
- **Modal de edição:** Permite alterar em lote:
  - Conta Débito
  - Conta Crédito
  - Status (Classificado/Manual)
- **Aprendizado automático:** As classificações em massa também são salvas no histórico de aprendizado
- **Edição individual:** Mantida a opção de editar um lançamento específico pelo ícone de lápis

### 7. Conversor de Extratos para OFX ✅ (Implementado 06/03/2026)
Módulo completo para converter arquivos PDF, Excel (XLSX, XLS) e CSV para o formato OFX padronizado:

**Funcionalidades:**
- Upload de arquivos PDF, XLSX, XLS e CSV
- Preview das transações extraídas com totais de créditos e débitos
- Download do arquivo OFX gerado
- Importação direta para o sistema de conciliação

**Fluxo de Uso:**
1. Usuário faz upload de um arquivo (CSV, Excel ou PDF)
2. Sistema extrai as transações e mostra o preview
3. Usuário pode baixar o OFX ou importar diretamente para o sistema
4. Na importação, seleciona empresa, plano de contas, banco e período
5. Sistema cria o extrato e redireciona para a página de detalhes

**API Endpoints:**
- `POST /api/converter/preview` - Faz preview das transações do arquivo
- `POST /api/converter/generate-ofx` - Gera e baixa arquivo OFX
- `POST /api/converter/import-to-system` - Importa direto para conciliação

**Página:** `/conversor-ofx`

### 8. Sistema de Processamentos Contábeis Organizados ✅ (Implementado 06/03/2026)
Sistema completo para gerenciamento de processamentos contábeis mensais por empresa:

**Estrutura Hierárquica:**
- Organização por: Empresa > Ano > Mês > Processamento
- Visualização agrupada (árvore expansível) ou em lista (tabela)
- Escalável para centenas de empresas

**Campos de cada Processamento:**
- Empresa, Ano, Mês, Período (MM/YYYY)
- Status: Não iniciado, Em processamento, Aguardando documentos, Concluído, Arquivado
- Responsável
- Observações
- Extratos vinculados
- Contagem de lançamentos (total, classificados, pendentes)

**Funcionalidades:**
- Filtros inteligentes: Empresa, Ano, Mês, Status, Responsável, Busca por texto
- Criação individual ou em massa (período de meses)
- Edição de status, responsável e observações
- Arquivamento automático de processamentos antigos (12+ meses)
- Toggle para visualizar processamentos arquivados

**Dashboard de Estatísticas:**
- Empresas com pendências
- Processamentos atrasados
- Em andamento
- Concluídos

**API Endpoints:**
- `GET /api/accounting-processes` - Lista com filtros
- `GET /api/accounting-processes/grouped` - Agrupado por empresa/ano
- `GET /api/accounting-processes/stats` - Estatísticas
- `POST /api/accounting-processes` - Criar novo
- `POST /api/accounting-processes/bulk-create` - Criar em massa
- `PUT /api/accounting-processes/{id}` - Atualizar
- `POST /api/accounting-processes/{id}/archive` - Arquivar
- `POST /api/accounting-processes/archive-old` - Arquivar antigos automaticamente

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
**06/03/2026** - Implementado módulo completo "Conversor de Extratos para OFX" com suporte a PDF, Excel e CSV. O conversor permite preview das transações, download de OFX e importação direta para o sistema de conciliação.
