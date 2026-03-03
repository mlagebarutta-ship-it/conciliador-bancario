import pandas as pd

# 1. Criar template de Plano de Contas
plano_data = {
    'codigo': ['1.1.01', '1.1.02', '1.2.01', '2.1.01', '3.1.01', '3.2.01', '3.3.01', '4.1.01', '4.2.01'],
    'descricao': [
        'Banco Itaú',
        'Banco Bradesco', 
        'Aplicações Financeiras',
        'Fornecedores',
        'Despesas com Pessoal',
        'Despesas Bancárias',
        'Despesas Operacionais',
        'Receita de Vendas',
        'Receita de Serviços'
    ],
    'tipo': ['ATIVO', 'ATIVO', 'ATIVO', 'PASSIVO', 'DESPESA', 'DESPESA', 'DESPESA', 'RECEITA', 'RECEITA']
}

df_plano = pd.DataFrame(plano_data)
df_plano.to_excel('/app/TEMPLATE_PLANO_CONTAS.xlsx', index=False, engine='openpyxl')
df_plano.to_csv('/app/TEMPLATE_PLANO_CONTAS.csv', index=False)

print("✅ Templates de Plano de Contas criados:")
print("   - /app/TEMPLATE_PLANO_CONTAS.xlsx")
print("   - /app/TEMPLATE_PLANO_CONTAS.csv")

# 2. Criar um extrato exemplo mais completo
extrato_data = {
    'Data': [
        '01/01/2026', '02/01/2026', '03/01/2026', '05/01/2026', '10/01/2026',
        '12/01/2026', '15/01/2026', '18/01/2026', '20/01/2026', '25/01/2026',
        '28/01/2026', '30/01/2026'
    ],
    'Histórico': [
        'PIX RECEBIDO DE CLIENTE SILVA E ASSOCIADOS',
        'PIX TRANSF FORNECEDOR ABC MATERIAIS LTDA',
        'TARIFA BANCARIA PACOTE MENSAL',
        'SISPAG FOLHA PAGAMENTO JANEIRO 2026',
        'PIX RECEBIDO PAGAMENTO SERVICO CONSULTORIA',
        'ENERGIA ELETRICA COPEL JANEIRO',
        'DAS SIMPLES NACIONAL COMPETENCIA 01/2026',
        'ALUGUEL COMERCIAL SALA 201 JANEIRO',
        'TELEFONE VIVO EMPRESARIAL MENSAL',
        'PIX RECEBIDO VENDA PRODUTO HARDWARE',
        'GPS INSS JANEIRO 2026',
        'PRO LABORE SOCIO GERENTE JANEIRO'
    ],
    'Valor': [
        1500.00, -500.00, -15.50, -3000.00, 2500.00, 
        -350.00, -450.00, -1200.00, -180.00, 1800.00,
        -800.00, -2500.00
    ]
}

df_extrato = pd.DataFrame(extrato_data)
df_extrato.to_excel('/app/EXTRATO_COMPLETO_NUBANK_012026.xlsx', index=False, engine='openpyxl')

print("✅ Extrato exemplo completo criado:")
print("   - /app/EXTRATO_COMPLETO_NUBANK_012026.xlsx")
print(f"   - Total de lançamentos: {len(extrato_data['Data'])}")

