# 🧾 Agente Contábil - Sistema Domínio

Sistema especializado para processamento de extratos bancários destinado a escritórios de contabilidade brasileiros que utilizam o sistema Domínio (Thomson Reuters).

![Dashboard](https://img.shields.io/badge/Status-Pronto-success)
![React](https://img.shields.io/badge/React-19-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)
![MongoDB](https://img.shields.io/badge/MongoDB-4.5-darkgreen)

## 📋 Funcionalidades

### 1. **Gestão de Empresas**
- Cadastro completo de empresas com CNPJ, nome, endereço e contatos
- Listagem e edição de empresas cadastradas
- Vinculação de planos de contas por empresa

### 2. **Plano de Contas**
- Criação de múltiplos planos de contas por empresa
- Cadastro de contas contábeis com código reduzido, descrição e tipo (ATIVO, PASSIVO, RECEITA, DESPESA)
- Gerenciamento hierárquico de contas

### 3. **Processamento de Extratos**
- **Upload de arquivos** nos formatos: **OFX, Excel (.xlsx, .xls), CSV, PDF**
- **Workflow em 4 etapas:**
  1. Upload do Extrato
  2. Configuração (empresa, banco, período, plano de contas)
  3. Processamento automático
  4. Visualização de resultados
- **Extração inteligente de PDF:** Sistema de OCR e parsing para extrair transações de PDFs de extratos bancários

### 4. **Classificação Automática**
- Sistema inteligente de classificação baseado em palavras-chave
- Regras padrão pré-configuradas:
  - PIX RECEBIDO → Receita de Vendas
  - PIX ENVIADO → Despesas
  - SISPAG/FOLHA → Despesas com Pessoal
  - PRO LABORE → Pro-Labore
  - TARIFA/IOF → Despesas Bancárias
  - DAS → Impostos (Simples Nacional)
  - GPS → INSS
  - DARF → Impostos Federais
  - ENERGIA/ÁGUA/TELEFONE → Despesas Operacionais
  - ALUGUEL → Aluguel

### 5. **Edição Manual**
- Edição inline de transações
- Classificação manual para lançamentos não identificados
- Atualização de contas débito/crédito

### 6. **Exportação para Domínio**
- Geração de arquivo XLSX no formato específico do sistema Domínio
- Estrutura com 9 colunas: Data, Histórico, Documento, Valor, Tipo, Conta Débito, Conta Crédito, Status, Observação
- Nomenclatura: `CNPJ_BANCO_MMAAAA_LANCAMENTOS.xlsx`

### 7. **Histórico de Processamentos**
- Visualização de todos os extratos processados
- Filtro por empresa
- Download de arquivos processados
- Exclusão de processamentos

### 8. **Configurações Avançadas**
- Criação de regras de classificação customizadas
- Definição de prioridades para regras
- Visualização de regras padrão do sistema

## 🚀 Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework web assíncrono
- **Motor** - Driver assíncrono para MongoDB
- **Pydantic** - Validação de dados
- **openpyxl** - Leitura/escrita de arquivos Excel
- **ofxparse** - Parser de arquivos OFX
- **pandas** - Manipulação de dados

### Frontend
- **React 19** - Biblioteca UI
- **React Router** - Navegação
- **Tailwind CSS** - Estilização
- **Axios** - Requisições HTTP
- **Lucide React** - Ícones
- **Sonner** - Notificações toast

### Design System
- **Tema Dark Mode Fintech**
- Paleta de cores: Indigo (primário), Emerald (sucesso), Rose (erro)
- Fontes: Outfit (headings), Inter (body), JetBrains Mono (dados)

## 📁 Estrutura do Projeto

```
/app/
├── backend/
│   ├── server.py              # API principal
│   ├── requirements.txt       # Dependências Python
│   └── .env                   # Variáveis de ambiente
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── SidebarLayout.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Companies.js
│   │   │   ├── ChartOfAccounts.js
│   │   │   ├── NewProcessing.js
│   │   │   ├── History.js
│   │   │   └── Settings.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── .env
└── EXTRATO_EXEMPLO_NUBANK_012026.xlsx  # Arquivo de exemplo
```

## 📖 Como Usar

### Passo 1: Cadastrar Empresa
1. Acesse **Empresas** no menu lateral
2. Clique em "Nova Empresa"
3. Preencha CNPJ, Nome e dados opcionais
4. Salve

### Passo 2: Criar Plano de Contas
1. Acesse **Plano de Contas**
2. Clique em "Novo Plano de Contas"
3. Selecione a empresa e dê um nome
4. Adicione contas com códigos reduzidos (ex: 1.1.01, 4.1.01)

### Passo 3: Processar Extrato
1. Acesse **Novo Processamento**
2. Faça upload do arquivo (use o arquivo de exemplo fornecido)
3. Configure: empresa, plano, banco e período
4. Clique em "Processar Extrato"
5. Revise os lançamentos classificados automaticamente
6. Edite manualmente os não classificados
7. Baixe o arquivo XLSX

### Passo 4: Importar no Domínio
1. Baixe o arquivo XLSX gerado
2. Acesse o módulo de Lançamentos Contábeis no sistema Domínio
3. Importe o arquivo seguindo os procedimentos do Domínio

## 📝 Exemplo de Extrato

Um arquivo de exemplo está disponível em: `/app/EXTRATO_EXEMPLO_NUBANK_012026.xlsx`

Estrutura esperada:
| Data       | Histórico                    | Valor    |
|------------|------------------------------|----------|
| 01/01/2026 | PIX RECEBIDO DE CLIENTE     | 1500.00  |
| 02/01/2026 | PIX TRANSF FORNECEDOR       | -500.00  |
| 03/01/2026 | TARIFA BANCARIA MENSAL      | -15.50   |

## 🎨 Design

- **Dark Mode Fintech** - Tema escuro profissional
- **Cores:** Indigo (primário), Emerald (crédito), Rose (débito)
- **Componentes modernos** com hover effects e animações suaves
- **Tabelas densas** otimizadas para visualização de dados financeiros

---

**Desenvolvido com ❤️ para contadores brasileiros**
