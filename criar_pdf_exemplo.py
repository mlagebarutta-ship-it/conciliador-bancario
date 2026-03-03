from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT

# Criar PDF
pdf_file = "/app/EXTRATO_NUBANK_JANEIRO_2026.pdf"
doc = SimpleDocTemplate(pdf_file, pagesize=A4)
elements = []

styles = getSampleStyleSheet()

# Título
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=16,
    textColor=colors.HexColor('#820AD1'),
    spaceAfter=30,
    alignment=TA_CENTER
)
elements.append(Paragraph("EXTRATO BANCÁRIO", title_style))

# Informações da conta
info_style = ParagraphStyle('Info', parent=styles['Normal'], fontSize=10, spaceAfter=20)
elements.append(Paragraph("NUBANK PAGAMENTOS S.A.", info_style))
elements.append(Paragraph("Agência: 0001  |  Conta: 123456-7", info_style))
elements.append(Paragraph("Período: 01/01/2026 a 31/01/2026", info_style))
elements.append(Spacer(1, 0.5*cm))

# Criar tabela de transações
data = [
    ['Data', 'Histórico', 'Valor'],
    ['01/01/2026', 'PIX RECEBIDO DE CLIENTE SILVA', '1.500,00'],
    ['02/01/2026', 'PIX TRANSF FORNECEDOR ABC LTDA', '-500,00'],
    ['03/01/2026', 'TARIFA BANCARIA MENSAL', '-15,50'],
    ['05/01/2026', 'SISPAG FOLHA PAGAMENTO JANEIRO', '-3.000,00'],
    ['10/01/2026', 'PIX RECEBIDO PAGAMENTO SERVICO', '2.500,00'],
    ['12/01/2026', 'ENERGIA ELETRICA COPEL', '-350,00'],
    ['15/01/2026', 'DAS SIMPLES NACIONAL 01/2026', '-450,00'],
    ['18/01/2026', 'ALUGUEL COMERCIAL JANEIRO', '-1.200,00'],
    ['20/01/2026', 'TELEFONE VIVO EMPRESARIAL', '-180,00'],
    ['25/01/2026', 'PIX RECEBIDO VENDA PRODUTO', '1.800,00'],
]

# Estilo da tabela
table = Table(data, colWidths=[3*cm, 10*cm, 3*cm])
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#820AD1')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('TOPPADDING', (0, 1), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
]))

elements.append(table)
elements.append(Spacer(1, 1*cm))

# Resumo
resumo_style = ParagraphStyle('Resumo', parent=styles['Normal'], fontSize=10, alignment=TA_RIGHT)
elements.append(Paragraph("<b>SALDO ANTERIOR:</b> R$ 5.000,00", resumo_style))
elements.append(Paragraph("<b>TOTAL CRÉDITOS:</b> R$ 5.800,00", resumo_style))
elements.append(Paragraph("<b>TOTAL DÉBITOS:</b> R$ 5.695,50", resumo_style))
elements.append(Paragraph("<b>SALDO FINAL:</b> R$ 5.104,50", resumo_style))

# Gerar PDF
doc.build(elements)
print("✅ PDF de exemplo criado: /app/EXTRATO_NUBANK_JANEIRO_2026.pdf")

