import re


def clean_cnpj(cnpj: str) -> str:
    return re.sub(r'[^0-9]', '', cnpj)


def parse_brazilian_number(value_str: str) -> float:
    if not value_str:
        return 0.0
    value_str = str(value_str).strip()
    if any(x in value_str.lower() for x in ['entradas', 'saídas', 'saidas', 'créditos', 'creditos', 'débitos', 'debitos', 'saldo', 'total']):
        return 0.0
    is_negative = False
    if value_str.startswith('(') and value_str.endswith(')'):
        is_negative = True
        value_str = value_str[1:-1]
    elif value_str.startswith('-'):
        is_negative = True
        value_str = value_str[1:]
    elif value_str.endswith('-'):
        is_negative = True
        value_str = value_str[:-1]
    elif value_str.endswith('+'):
        value_str = value_str[:-1]
    value_str = value_str.replace('R$', '').replace(' ', '').strip()
    if ',' in value_str and '.' in value_str:
        if value_str.rfind(',') > value_str.rfind('.'):
            value_str = value_str.replace('.', '').replace(',', '.')
        else:
            value_str = value_str.replace(',', '')
    elif ',' in value_str:
        value_str = value_str.replace(',', '.')
    try:
        result = float(value_str)
        return -result if is_negative else result
    except Exception:
        return 0.0
