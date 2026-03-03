import pandas as pd
import openpyxl
from datetime import datetime

# Create test data for bank statement
data = {
    'Data': ['01/01/2026', '02/01/2026', '03/01/2026', '05/01/2026', '10/01/2026'],
    'Descrição': [
        'PIX RECEBIDO DE CLIENTE',
        'PIX TRANSF FORNECEDOR', 
        'TARIFA BANCARIA',
        'SISPAG FOLHA JANEIRO',
        'PIX RECEBIDO PAGAMENTO'
    ],
    'Valor': [1500.00, -500.00, -15.50, -3000.00, 2500.00]
}

# Create DataFrame
df = pd.DataFrame(data)

# Save to Excel
df.to_excel('/app/extrato_teste.xlsx', index=False)
print("✅ Created test Excel file: /app/extrato_teste.xlsx")