import pandas as pd
from datetime import datetime

# Criar dados de exemplo
data = {
    'Data': ['01/01/2026', '02/01/2026', '03/01/2026', '05/01/2026', '10/01/2026', 
             '12/01/2026', '15/01/2026', '18/01/2026', '20/01/2026', '25/01/2026'],
    'Histórico': [
        'PIX RECEBIDO DE CLIENTE SILVA',
        'PIX TRANSF FORNECEDOR ABC LTDA',
        'TARIFA BANCARIA MENSAL',
        'SISPAG FOLHA PAGAMENTO JANEIRO',
        'PIX RECEBIDO PAGAMENTO SERVICO',
        'ENERGIA ELETRICA COPEL',
        'DAS SIMPLES NACIONAL 01/2026',
        'ALUGUEL COMERCIAL JANEIRO',
        'TELEFONE VIVO EMPRESARIAL',
        'PIX RECEBIDO VENDA PRODUTO'
    ],
    'Valor': [1500.00, -500.00, -15.50, -3000.00, 2500.00, -350.00, -450.00, -1200.00, -180.00, 1800.00]
}

df = pd.DataFrame(data)
df.to_excel('/app/EXTRATO_EXEMPLO_NUBANK_012026.xlsx', index=False, engine='openpyxl')
print("✅ Arquivo de exemplo criado: /app/EXTRATO_EXEMPLO_NUBANK_012026.xlsx")
