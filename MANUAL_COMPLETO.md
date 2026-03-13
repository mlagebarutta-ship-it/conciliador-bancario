# 📘 DOMÍNIO BRIDGE - Manual Completo do Sistema

## Índice
1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Multi-Tenant](#2-arquitetura-multi-tenant)
3. [Perfis de Usuário](#3-perfis-de-usuário)
4. [Funcionalidades por Módulo](#4-funcionalidades-por-módulo)
5. [Fluxo de Trabalho](#5-fluxo-de-trabalho)
6. [API Endpoints](#6-api-endpoints)
7. [Requisitos de Infraestrutura](#7-requisitos-de-infraestrutura)
8. [Deploy em Produção](#8-deploy-em-produção)

---

## 1. Visão Geral

### O que é o Domínio Bridge?
O **Domínio Bridge** é uma plataforma SaaS (Software as a Service) desenvolvida para **escritórios de contabilidade brasileiros**. Sua função principal é:

1. **Importar extratos bancários** de diversos formatos (OFX, Excel, CSV, PDF)
2. **Classificar automaticamente** as transações com contas contábeis
3. **Exportar lançamentos** em formato compatível com o sistema Domínio (Thomson Reuters)

### Problema que Resolve
Contadores gastam horas classificando manualmente centenas de transações bancárias todo mês. O Domínio Bridge:
- ✅ Automatiza 70-90% das classificações através de aprendizado inteligente
- ✅ Reduz tempo de processamento de horas para minutos
- ✅ Elimina erros de digitação
- ✅ Mantém histórico e padrões de classificação

### Stack Tecnológica
```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + Tailwind CSS + Lucide Icons                     │
│  Porta: 3000                                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  FastAPI (Python 3.11+) + JWT Auth                          │
│  Porta: 8001                                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE                               │
│  MongoDB (NoSQL)                                             │
│  Porta: 27017                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Arquitetura Multi-Tenant

### O que é Multi-Tenant?
O sistema foi projetado para ser vendido como SaaS para **múltiplos escritórios de contabilidade**. Cada escritório é um "tenant" (inquilino) com dados completamente isolados.

```
┌─────────────────────────────────────────────────────────────┐
│                    PLATAFORMA SAAS                           │
│                   (Super Administrador)                      │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Escritório A   │  │  Escritório B   │  │  Escritório C   │
│  (Tenant 1)     │  │  (Tenant 2)     │  │  (Tenant 3)     │
│                 │  │                 │  │                 │
│ • 50 empresas   │  │ • 30 empresas   │  │ • 100 empresas  │
│ • 5 usuários    │  │ • 3 usuários    │  │ • 10 usuários   │
│ • Dados isolados│  │ • Dados isolados│  │ • Dados isolados│
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Isolamento de Dados
- Cada empresa, extrato, transação e configuração está vinculada a um `tenant_id`
- Um escritório **NUNCA** consegue ver dados de outro escritório
- O Super Admin pode ver estatísticas globais, mas não acessa dados operacionais

---

## 3. Perfis de Usuário

### 3.1 Super Administrador (Dono da Plataforma)
**Quem é:** Você, o dono do sistema SaaS

**Credenciais de teste:**
- Email: `mlagebarutta@gmail.com`
- Senha: `super123`

**O que pode fazer:**
| Funcionalidade | Descrição |
|----------------|-----------|
| Dashboard Global | Ver estatísticas de todos os escritórios |
| Gerenciar Escritórios | Criar, editar, suspender escritórios |
| Gerenciar Usuários Globais | Ver todos os usuários da plataforma |
| Resetar Senhas | Resetar senha de qualquer usuário |
| Migrar Dados | Executar migrações e manutenções |

**Menu do Super Admin:**
- 📊 Dashboard
- 🏢 Escritórios
- 👥 Usuários

---

### 3.2 Administrador do Escritório (Cliente)
**Quem é:** O dono/gerente do escritório de contabilidade que contratou o sistema

**Credenciais de teste:**
- Email: `admin@dominio.com`
- Senha: `admin123`

**O que pode fazer:**
| Funcionalidade | Descrição |
|----------------|-----------|
| Dashboard Operacional | Ver estatísticas do seu escritório |
| Gerenciar Empresas | CRUD de empresas clientes |
| Gerenciar Plano de Contas | Importar e configurar planos contábeis |
| Processar Extratos | Importar e classificar extratos bancários |
| Gerenciar Usuários | Criar/editar colaboradores do escritório |
| Ver Logs de Atividade | Auditoria de ações no sistema |
| Configurações | Regras de classificação automática |

**Menu do Administrador:**
- 📊 Dashboard
- 🏢 Empresas
- 📋 Plano de Contas
- ⬆️ Novo Processamento
- 📅 Processamentos
- 📜 Histórico Extratos
- **ADMINISTRAÇÃO:**
  - 👥 Gerenciar Usuários
  - 📝 Log de Atividades
  - ⚙️ Configurações

---

### 3.3 Colaborador (Funcionário)
**Quem é:** Funcionário do escritório que opera o sistema no dia-a-dia

**O que pode fazer:**
| Funcionalidade | Descrição |
|----------------|-----------|
| Dashboard | Ver estatísticas (apenas empresas atribuídas) |
| Processar Extratos | Importar e classificar extratos |
| Classificar Transações | Atribuir contas contábeis |
| Exportar Lançamentos | Gerar arquivo para Domínio |
| Ver Histórico | Consultar processamentos anteriores |

**Menu do Colaborador:**
- 📊 Dashboard
- 🏢 Empresas
- 📋 Plano de Contas
- ⬆️ Novo Processamento
- 📅 Processamentos
- 📜 Histórico Extratos

---

## 4. Funcionalidades por Módulo

### 4.1 📊 Dashboard
**Localização:** Página inicial após login

**Para Administradores do Escritório:**
```
┌──────────────────────────────────────────────────────────────┐
│                    DASHBOARD OPERACIONAL                      │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ EMPRESAS│  │ ATRASAD │  │  SEM    │  │ EXTRATOS│         │
│  │   19    │  │    4    │  │ EXTRATO │  │   16    │         │
│  │ Total   │  │ 2+2     │  │   15    │  │Processad│         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│                                                              │
│  RESUMO DE CLASSIFICAÇÃO                                     │
│  ████████████████████░░░ 93% (3.615/3.868 lançamentos)      │
│                                                              │
│  TABELA DE EMPRESAS                                          │
│  Nome | CNPJ | Último Mês | Atraso | Pendências | Status    │
└──────────────────────────────────────────────────────────────┘
```

**Métricas Exibidas:**
- Total de empresas cadastradas
- Empresas com atraso (moderado/crítico)
- Empresas sem nenhum extrato processado
- Total de extratos processados
- Taxa de classificação automática
- Lista de empresas com status

---

### 4.2 🏢 Empresas
**Localização:** Menu lateral → Empresas

**Funcionalidades:**
| Ação | Descrição |
|------|-----------|
| ➕ Nova Empresa | Cadastrar empresa cliente |
| ✏️ Editar | Alterar dados da empresa |
| 🗑️ Excluir | Remover empresa (e todos seus dados) |
| 🔍 Buscar | Filtrar por nome ou CNPJ |

**Campos da Empresa:**
- CNPJ (obrigatório, com validação)
- Razão Social (obrigatório)
- Endereço (opcional)
- Telefone (opcional)
- Email (opcional)

---

### 4.3 📋 Plano de Contas
**Localização:** Menu lateral → Plano de Contas

**O que é:** Estrutura de contas contábeis usada para classificar as transações

**Funcionalidades:**
| Ação | Descrição |
|------|-----------|
| ➕ Novo Plano | Criar plano de contas para uma empresa |
| 📤 Importar Excel | Importar plano em massa via arquivo Excel |
| ➕ Adicionar Conta | Criar conta individual |
| 🗑️ Excluir Conta | Remover conta do plano |
| 📥 Baixar Modelo | Download de planilha modelo |

**Formato do Excel para Importação:**
```
| Código | Descrição           | Classificação | Tipo    |
|--------|---------------------|---------------|---------|
| 1.1.01 | Caixa               | ATIVO         | ATIVO   |
| 1.1.02 | Banco Bradesco      | ATIVO         | ATIVO   |
| 3.1.01 | Receita de Serviços | RECEITA       | RECEITA |
| 4.1.01 | Despesa com Pessoal | DESPESA       | DESPESA |
```

---

### 4.4 ⬆️ Novo Processamento
**Localização:** Menu lateral → Novo Processamento

**Fluxo de Processamento:**

```
PASSO 1: UPLOAD              PASSO 2: CONFIGURAÇÃO
┌────────────────────┐       ┌────────────────────┐
│                    │       │ Empresa: [Select]  │
│   Arraste o        │  ──▶  │ Plano:   [Select]  │
│   arquivo aqui     │       │ Banco:   [Input]   │
│                    │       │ Período: [MM/YYYY] │
│   ou clique        │       │                    │
│                    │       │ [Processar]        │
└────────────────────┘       └────────────────────┘

PASSO 3: PROCESSANDO         PASSO 4: RESULTADO
┌────────────────────┐       ┌────────────────────┐
│                    │       │ ✅ Processado!     │
│   ⏳ Lendo         │  ──▶  │                    │
│   arquivo...       │       │ 150 transações     │
│                    │       │ 120 classificadas  │
│   Classificando... │       │ 30 pendentes       │
│                    │       │                    │
└────────────────────┘       │ [Exportar] [Editar]│
                             └────────────────────┘
```

**Formatos de Arquivo Suportados:**
| Formato | Extensão | Origem Comum |
|---------|----------|--------------|
| OFX | .ofx | Bancos (download internet banking) |
| Excel | .xlsx, .xls | Planilhas manuais |
| CSV | .csv | Exportações diversas |
| PDF | .pdf | Extratos em PDF (experimental) |

---

### 4.5 🔄 Sistema de Classificação Inteligente

**Como Funciona:**

```
TRANSAÇÃO NOVA                    HISTÓRICO DE APRENDIZADO
┌─────────────────────┐           ┌─────────────────────────┐
│ PIX JOSE SILVA      │           │ PIX JOSE SILVA          │
│ R$ 500,00 (Crédito) │  ──▶      │ Débito: 1.1.02 (Banco)  │
└─────────────────────┘           │ Crédito: 3.1.01 (Receita│
                                  │ Usado: 15 vezes         │
         │                        └─────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MOTOR DE CLASSIFICAÇÃO                     │
│                                                              │
│  1. Busca exata no histórico → 100% match                   │
│  2. Busca por similaridade → >60% match                     │
│  3. Busca por palavras-chave → Regras configuradas          │
│  4. Não encontrou → "CLASSIFICAR MANUALMENTE"               │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐
│ CLASSIFICADO AUTO   │
│ Débito: 1.1.02      │
│ Crédito: 3.1.01     │
│ Status: ✅          │
└─────────────────────┘
```

**Benefícios:**
- Quanto mais você usa, mais inteligente fica
- Aprende com CADA classificação manual
- Específico por empresa (cada empresa tem seu padrão)
- Similaridade textual (PIX JOSE = PIX JOSÉ DA SILVA)

---

### 4.6 📅 Processamentos (Controle Mensal)
**Localização:** Menu lateral → Processamentos

**O que é:** Visão de controle mensal por empresa, mostrando quais meses estão concluídos, em andamento ou pendentes.

```
EMPRESA: ABC LTDA
├── 2026
│   ├── Janeiro  ✅ Concluído (150 transações)
│   ├── Fevereiro ✅ Concluído (180 transações)
│   ├── Março    🔄 Em Processamento (30 pendentes)
│   └── Abril    ⏳ Não Iniciado
│
EMPRESA: XYZ S/A
├── 2026
│   ├── Janeiro  ✅ Concluído
│   ├── Fevereiro ⚠️ Atrasado
│   └── Março    ⏳ Não Iniciado
```

**Status Possíveis:**
- 🟢 **Concluído:** Todas as transações classificadas e exportadas
- 🟡 **Em Processamento:** Tem extratos mas ainda há pendências
- 🔴 **Atrasado:** Mês anterior ainda não concluído
- ⚪ **Não Iniciado:** Nenhum extrato importado

---

### 4.7 📜 Histórico de Extratos
**Localização:** Menu lateral → Histórico Extratos

**Funcionalidades:**
| Ação | Descrição |
|------|-----------|
| 👁️ Visualizar | Ver detalhes e transações do extrato |
| 📥 Exportar | Baixar arquivo Excel para Domínio |
| ✏️ Editar | Classificar transações pendentes |
| 🗑️ Excluir | Remover extrato e suas transações |

**Organização:**
```
Por Empresa (Accordion)
├── 📁 EMPRESA ABC LTDA
│   ├── 03/2026 - Bradesco - 150 transações
│   ├── 02/2026 - Bradesco - 180 transações
│   └── 01/2026 - Itaú - 120 transações
│
├── 📁 EMPRESA XYZ S/A
│   └── 03/2026 - Santander - 90 transações
```

---

### 4.8 👥 Gerenciar Usuários (Admin)
**Localização:** Menu lateral → Administração → Gerenciar Usuários

**Funcionalidades:**
| Ação | Descrição |
|------|-----------|
| ➕ Novo Usuário | Criar colaborador para o escritório |
| ✏️ Editar | Alterar nome, email, perfil |
| 🔑 Resetar Senha | Definir nova senha |
| 🔗 Vincular Empresas | Atribuir empresas ao colaborador |
| 🚫 Desativar | Bloquear acesso do usuário |
| 🗑️ Excluir | Remover usuário permanentemente |

**Perfis Disponíveis:**
- **Administrador:** Acesso total ao escritório
- **Colaborador:** Acesso operacional (sem admin)

---

### 4.9 📝 Log de Atividades (Admin)
**Localização:** Menu lateral → Administração → Log de Atividades

**O que registra:**
- Login/logout de usuários
- Criação/edição/exclusão de empresas
- Upload de extratos
- Classificações manuais
- Exportações de arquivos
- Alterações de usuários

**Campos do Log:**
| Campo | Descrição |
|-------|-----------|
| Usuário | Quem executou a ação |
| Ação | Tipo de atividade |
| Detalhes | Informações específicas |
| Empresa | Empresa relacionada (se aplicável) |
| Data/Hora | Timestamp da ação |

---

### 4.10 ⚙️ Configurações (Admin)
**Localização:** Menu lateral → Administração → Configurações

**Regras de Classificação Automática:**
```
┌─────────────────────────────────────────────────────────────┐
│                 REGRAS DE CLASSIFICAÇÃO                      │
├─────────────────────────────────────────────────────────────┤
│ Palavra-chave    │ Conta Débito │ Conta Crédito │ Prioridade│
├──────────────────┼──────────────┼───────────────┼───────────┤
│ PIX              │ 1.1.02       │ 3.1.01        │ Alta      │
│ TRANSFERENCIA    │ 1.1.02       │ 3.1.01        │ Média     │
│ ENERGIA          │ 4.1.05       │ 1.1.02        │ Alta      │
│ TELEFONE         │ 4.1.06       │ 1.1.02        │ Média     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Fluxo de Trabalho

### Fluxo Mensal Típico

```
INÍCIO DO MÊS
     │
     ▼
┌─────────────────┐
│ 1. DOWNLOAD     │  Cliente baixa extrato OFX do banco
│    EXTRATO      │  (internet banking)
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ 2. UPLOAD       │  Contador faz upload no sistema
│    NO SISTEMA   │  (Novo Processamento)
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ 3. CLASSIFICAÇÃO│  Sistema classifica automaticamente
│    AUTOMÁTICA   │  ~80% das transações
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ 4. CLASSIFICAÇÃO│  Contador classifica os ~20%
│    MANUAL       │  restantes (sistema aprende)
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ 5. EXPORTAÇÃO   │  Gera arquivo Excel formatado
│    EXCEL        │  para importar no Domínio
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ 6. IMPORTAÇÃO   │  Importa lançamentos no sistema
│    DOMÍNIO      │  Domínio Thomson Reuters
└─────────────────┘
     │
     ▼
   FIM ✅
```

---

## 6. API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login (retorna JWT) |
| GET | `/api/auth/me` | Dados do usuário logado |

### Empresas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/companies` | Listar empresas |
| POST | `/api/companies` | Criar empresa |
| GET | `/api/companies/{id}` | Detalhes da empresa |
| PUT | `/api/companies/{id}` | Atualizar empresa |
| DELETE | `/api/companies/{id}` | Excluir empresa |

### Plano de Contas
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/chart-of-accounts` | Listar planos |
| POST | `/api/chart-of-accounts` | Criar plano |
| DELETE | `/api/chart-of-accounts/{id}` | Excluir plano |
| POST | `/api/chart-of-accounts/{id}/import` | Importar Excel |

### Extratos Bancários
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/bank-statements/upload` | Upload de extrato |
| GET | `/api/bank-statements` | Listar extratos |
| GET | `/api/bank-statements/{id}` | Detalhes do extrato |
| GET | `/api/bank-statements/{id}/transactions` | Transações |
| GET | `/api/bank-statements/{id}/export` | Exportar Excel |
| DELETE | `/api/bank-statements/{id}` | Excluir extrato |

### Transações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| PUT | `/api/transactions/{id}` | Atualizar transação |
| PUT | `/api/transactions/bulk-update` | Atualizar em massa |

### Usuários (Admin)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/usuarios` | Listar usuários |
| POST | `/api/usuarios` | Criar usuário |
| PUT | `/api/usuarios/{id}` | Atualizar usuário |
| DELETE | `/api/usuarios/{id}` | Excluir usuário |

### Super Admin
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/superadmin/dashboard` | Estatísticas globais |
| GET | `/api/superadmin/tenants` | Listar escritórios |
| POST | `/api/superadmin/tenants` | Criar escritório |
| GET | `/api/superadmin/usuarios` | Todos os usuários |

---

## 7. Requisitos de Infraestrutura

### Mínimos para Produção
| Componente | Requisito |
|------------|-----------|
| **CPU** | 2 vCPUs |
| **RAM** | 4 GB |
| **Disco** | 20 GB SSD |
| **SO** | Ubuntu 22.04 LTS |
| **Python** | 3.11+ |
| **Node.js** | 18+ |
| **MongoDB** | 6.0+ |

### Portas Necessárias
| Porta | Serviço |
|-------|---------|
| 80 | HTTP (redirect) |
| 443 | HTTPS (frontend) |
| 8001 | Backend API |
| 27017 | MongoDB |

---

## 8. Deploy em Produção

### ⚠️ Por que NÃO usar cPanel tradicional?

O cPanel foi projetado para:
- ❌ PHP + MySQL
- ❌ Hospedagem compartilhada
- ❌ Sites estáticos

O Domínio Bridge precisa de:
- ✅ Python 3.11 com FastAPI (ASGI)
- ✅ MongoDB (NoSQL)
- ✅ Node.js para build do React
- ✅ Processos em background
- ✅ WebSockets (para tempo real)

### Opções Recomendadas

#### Opção 1: Railway.app (Mais Fácil)
```bash
# 1. Criar conta em railway.app
# 2. Conectar repositório GitHub
# 3. Railway detecta automaticamente Python/Node
# 4. Adicionar MongoDB como serviço
# 5. Configurar variáveis de ambiente
# 6. Deploy automático!
```
**Custo:** ~$5-20/mês
**Dificuldade:** ⭐ Fácil

#### Opção 2: DigitalOcean Droplet
```bash
# 1. Criar Droplet Ubuntu 22.04
# 2. Instalar Docker e Docker Compose
# 3. Clone do repositório
# 4. docker-compose up -d
# 5. Configurar Nginx como proxy reverso
# 6. Certificado SSL com Let's Encrypt
```
**Custo:** ~$12-24/mês
**Dificuldade:** ⭐⭐ Médio

#### Opção 3: VPS com CloudLinux (cPanel alternativo)
Se você PRECISA de cPanel, use um VPS com:
- CloudLinux + cPanel
- Python Selector
- Node.js Selector
- MongoDB instalado manualmente

**Custo:** ~$30-50/mês
**Dificuldade:** ⭐⭐⭐ Avançado

---

## Credenciais de Teste

### Super Admin (Dono da Plataforma)
- **Email:** mlagebarutta@gmail.com
- **Senha:** super123

### Admin do Escritório
- **Email:** admin@dominio.com
- **Senha:** admin123

---

## Suporte

Para dúvidas sobre deploy ou customizações, consulte:
- `/app/GUIA_PRODUCAO.md` - Guia técnico de deploy
- `/app/DOCUMENTACAO_TECNICA.md` - Documentação da API

---

*Documento gerado em Março/2026*
*Versão do Sistema: 2.0 (Multi-Tenant)*
