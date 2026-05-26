import io
import re
import os
import logging
import subprocess
import tempfile
from typing import List, Dict, Any
from datetime import datetime

import pandas as pd
import pdfplumber
import ofxparse
from fastapi import HTTPException

from utils.helpers import parse_brazilian_number

logger = logging.getLogger(__name__)


def convert_legacy_excel_with_ssconvert(file_content: bytes) -> bytes:
    with tempfile.NamedTemporaryFile(suffix='.xls', delete=False) as input_file:
        input_file.write(file_content)
        input_path = input_file.name
    output_path = input_path.replace('.xls', '_converted.xlsx')
    try:
        result = subprocess.run(
            ['ssconvert', input_path, output_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and os.path.exists(output_path):
            with open(output_path, 'rb') as f:
                return f.read()
        else:
            logger.warning(f"ssconvert falhou: {result.stderr}")
            return None
    except Exception as e:
        logger.warning(f"Erro ao usar ssconvert: {e}")
        return None
    finally:
        try:
            os.unlink(input_path)
            if os.path.exists(output_path):
                os.unlink(output_path)
        except Exception:
            pass


def parse_santander_format(df: pd.DataFrame) -> List[Dict[str, Any]]:
    transactions = []
    date_col = None
    desc_col = None
    credit_col = None
    debit_col = None

    for i in range(len(df.columns)):
        col_data = df.iloc[:50, i].dropna()
        date_count = 0
        for val in col_data:
            if re.match(r'^\d{2}/\d{2}(/\d{4})?$', str(val).strip()):
                date_count += 1
        if date_count >= 3:
            date_col = i
            break

    for i in range(len(df.columns)):
        col_data = df.iloc[:50, i].dropna()
        neg_count = 0
        for val in col_data:
            val_str = str(val).strip()
            if val_str.endswith('-') and re.search(r'\d', val_str):
                neg_count += 1
        if neg_count >= 5:
            debit_col = i
            break

    for i in range(len(df.columns)):
        if i == debit_col or i == date_col:
            continue
        col_data = df.iloc[:50, i].dropna()
        num_count = 0
        for val in col_data:
            if isinstance(val, (int, float)) and val > 0:
                num_count += 1
        if num_count >= 5:
            credit_col = i
            break

    if date_col is not None:
        for i in [date_col + 1, date_col + 2, date_col - 1]:
            if 0 <= i < len(df.columns) and i != credit_col and i != debit_col:
                col_data = df.iloc[:30, i].dropna()
                text_count = 0
                for val in col_data:
                    if isinstance(val, str) and len(val) > 5 and not re.match(r'^[\d.,\-+\s]+$', val):
                        text_count += 1
                if text_count >= 3:
                    desc_col = i
                    break

    logger.info(f"Santander Parser - date_col: {date_col}, desc_col: {desc_col}, credit_col: {credit_col}, debit_col: {debit_col}")

    last_date = None
    for idx, row in df.iterrows():
        date_val = None
        if date_col is not None:
            raw_date = row.iloc[date_col]
            if pd.notna(raw_date):
                date_str = str(raw_date).strip()
                date_match = re.match(r'^(\d{2}/\d{2})(/\d{4})?$', date_str)
                if date_match:
                    date_val = date_match.group(1)
                    if date_match.group(2):
                        date_val += date_match.group(2)
                    else:
                        date_val += "/2025"
                    last_date = date_val

        if date_val is None and last_date is not None:
            date_val = last_date
        if date_val is None:
            continue

        description = ""
        if desc_col is not None and pd.notna(row.iloc[desc_col]):
            description = str(row.iloc[desc_col]).strip()

        if not description:
            continue
        if 'saldo' in description.lower():
            continue
        if any(x in description.lower() for x in ['total', 'entradas', 'saídas', 'créditos', 'débitos', 'siglas', 'notas', 'bolsa']):
            continue

        amount = 0
        trans_type = None

        if credit_col is not None and pd.notna(row.iloc[credit_col]):
            credit_val = row.iloc[credit_col]
            if isinstance(credit_val, (int, float)) and credit_val > 0:
                amount = float(credit_val)
                trans_type = 'C'
            elif isinstance(credit_val, str):
                credit_str = str(credit_val).strip()
                if credit_str and not any(x in credit_str.lower() for x in ['entrada', 'crédito', 'credito', 'r$']):
                    parsed = parse_brazilian_number(credit_str)
                    if parsed > 0:
                        amount = parsed
                        trans_type = 'C'

        if trans_type is None and debit_col is not None and pd.notna(row.iloc[debit_col]):
            debit_str = str(row.iloc[debit_col]).strip()
            if debit_str and not any(x in debit_str.lower() for x in ['saída', 'saida', 'débito', 'debito', 'r$']):
                if debit_str.endswith('-') or re.search(r'\d', debit_str):
                    debit_val = parse_brazilian_number(debit_str)
                    if debit_val != 0:
                        amount = abs(debit_val)
                        trans_type = 'D'

        if description and amount > 0 and trans_type:
            transactions.append({
                'date': date_val,
                'description': description,
                'amount': amount,
                'transaction_type': trans_type
            })

    if not transactions:
        raise HTTPException(status_code=400, detail="Não foi possível extrair transações do arquivo Santander.")

    credits = len([t for t in transactions if t['transaction_type'] == 'C'])
    debits = len([t for t in transactions if t['transaction_type'] == 'D'])
    logger.info(f"Santander Parser: {len(transactions)} transações extraídas ({credits} créditos, {debits} débitos)")
    return transactions


def parse_pdf_statement(file_content: bytes) -> List[Dict[str, Any]]:
    try:
        transactions = []
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    header = [str(h).upper() if h else '' for h in table[0]]
                    date_col = desc_col = value_col = debit_col = credit_col = type_col = None
                    for i, h in enumerate(header):
                        if any(x in h for x in ['DATA', 'DATE', 'DT']):
                            date_col = i
                        elif any(x in h for x in ['DESCRIÇÃO', 'DESCRICAO', 'HISTÓRICO', 'HISTORICO', 'LANÇAMENTO', 'LANCAMENTO', 'MEMO']):
                            desc_col = i
                        elif any(x in h for x in ['DÉBITO', 'DEBITO', 'SAÍDA', 'SAIDA', 'DÉB', 'DEB']):
                            debit_col = i
                        elif any(x in h for x in ['CRÉDITO', 'CREDITO', 'ENTRADA', 'CRÉD', 'CRED']):
                            credit_col = i
                        elif any(x in h for x in ['VALOR', 'VALUE', 'QUANTIA', 'MONTANTE']):
                            value_col = i
                        elif any(x in h for x in ['TIPO', 'TYPE', 'D/C', 'C/D']):
                            type_col = i

                    for row in table[1:]:
                        if not row or all(not cell for cell in row):
                            continue
                        date_val = None
                        if date_col is not None and date_col < len(row) and row[date_col]:
                            date_str = str(row[date_col]).strip()
                            date_match = re.search(r'(\d{2}/\d{2}/\d{4}|\d{2}/\d{2})', date_str)
                            if date_match:
                                date_val = date_match.group(1)
                                if len(date_val) == 5:
                                    date_val += "/2026"
                        if not date_val:
                            continue

                        description = ""
                        if desc_col is not None and desc_col < len(row) and row[desc_col]:
                            description = str(row[desc_col]).strip()

                        amount = 0
                        trans_type = None
                        if debit_col is not None and credit_col is not None:
                            debit_val = row[debit_col] if debit_col < len(row) else None
                            credit_val = row[credit_col] if credit_col < len(row) else None
                            if debit_val and str(debit_val).strip():
                                amount = parse_brazilian_number(str(debit_val))
                                if amount != 0:
                                    amount = abs(amount)
                                    trans_type = 'D'
                            if credit_val and str(credit_val).strip() and trans_type is None:
                                amount = parse_brazilian_number(str(credit_val))
                                if amount != 0:
                                    amount = abs(amount)
                                    trans_type = 'C'
                        elif value_col is not None and value_col < len(row) and row[value_col]:
                            amount = parse_brazilian_number(str(row[value_col]))
                            if type_col is not None and type_col < len(row) and row[type_col]:
                                type_str = str(row[type_col]).upper().strip()
                                if 'D' in type_str or 'DÉB' in type_str or 'SAÍ' in type_str:
                                    trans_type = 'D'
                                    amount = abs(amount)
                                elif 'C' in type_str or 'CRÉ' in type_str or 'ENT' in type_str:
                                    trans_type = 'C'
                                    amount = abs(amount)
                            if trans_type is None:
                                trans_type = 'C' if amount > 0 else 'D'
                                amount = abs(amount)

                        if description and amount != 0 and trans_type:
                            transactions.append({
                                'date': date_val,
                                'description': description,
                                'amount': amount,
                                'transaction_type': trans_type
                            })

            if not transactions:
                full_text = ""
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        full_text += text + "\n"
                lines = full_text.split('\n')
                for line in lines:
                    date_match = re.search(r'(\d{2}/\d{2}/\d{4}|\d{2}/\d{2})', line)
                    if not date_match:
                        continue
                    date_str = date_match.group(1)
                    if len(date_str) == 5:
                        date_str += "/2025"
                    value_matches = re.findall(r'([+-]?\s*\d{1,3}(?:\.\d{3})*,\d{2}-?|\(\d{1,3}(?:\.\d{3})*,\d{2}\))', line)
                    if not value_matches:
                        continue
                    value_str = value_matches[-1]
                    is_negative = value_str.startswith('(') or value_str.startswith('-') or value_str.endswith('-')
                    value_str = value_str.replace('(', '').replace(')', '').replace('.', '').replace(',', '.').replace(' ', '').replace('-', '').replace('+', '')
                    try:
                        amount = float(value_str)
                        if is_negative:
                            amount = -amount
                    except Exception:
                        continue
                    date_end = date_match.end()
                    value_start = line.find(value_matches[-1])
                    description = line[date_end:value_start].strip() if value_start > date_end else ""
                    description = re.sub(r'\s+', ' ', description)
                    if any(x in description.lower() for x in ['saldo', 'total', 'anterior', 'entradas', 'saídas']):
                        continue
                    line_upper = line.upper()
                    trans_type = None
                    if any(x in line_upper for x in ['DÉBITO', 'DEBITO', 'DÉB', 'DEB', 'SAÍDA', 'SAIDA', 'PAGAMENTO', 'TRANSF ENV', 'PIX ENV']):
                        trans_type = 'D'
                        amount = abs(amount)
                    elif any(x in line_upper for x in ['CRÉDITO', 'CREDITO', 'CRÉD', 'CRED', 'ENTRADA', 'RECEBIDO', 'TRANSF REC', 'PIX REC']):
                        trans_type = 'C'
                        amount = abs(amount)
                    else:
                        trans_type = 'C' if amount > 0 else 'D'
                        amount = abs(amount)
                    if description and amount != 0:
                        transactions.append({
                            'date': date_str,
                            'description': description,
                            'amount': amount,
                            'transaction_type': trans_type
                        })

        if not transactions:
            raise HTTPException(status_code=400, detail="Não foi possível extrair transações do PDF. Verifique se o formato é compatível.")
        return transactions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar PDF: {str(e)}")


def parse_excel_statement(file_content: bytes) -> List[Dict[str, Any]]:
    try:
        transactions = []
        df = None
        try:
            df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
        except Exception as e1:
            logger.debug(f"openpyxl falhou: {e1}")
            try:
                df = pd.read_excel(io.BytesIO(file_content), engine='xlrd')
            except Exception as e2:
                logger.debug(f"xlrd falhou: {e2}")
                logger.info("Tentando converter arquivo Excel legado com ssconvert...")
                converted_content = convert_legacy_excel_with_ssconvert(file_content)
                if converted_content:
                    try:
                        df = pd.read_excel(io.BytesIO(converted_content), engine='openpyxl')
                        logger.info("Arquivo Excel legado convertido com sucesso!")
                    except Exception as e3:
                        logger.warning(f"Falha ao ler arquivo convertido: {e3}")

        if df is None or df.empty:
            for encoding in ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']:
                try:
                    df = pd.read_csv(io.BytesIO(file_content), encoding=encoding, sep=None, engine='python')
                    if not df.empty:
                        break
                except Exception:
                    continue

        if df is None or df.empty:
            raise HTTPException(status_code=400, detail="Não foi possível ler o arquivo. Verifique o formato. Para arquivos Excel muito antigos (Excel 5.0/95), tente salvar em formato mais recente.")

        df = df.dropna(how='all')

        unnamed_cols = [col for col in df.columns if 'Unnamed' in str(col) or 'unnamed' in str(col).lower()]
        if len(unnamed_cols) > 10:
            logger.info("Detectado formato Santander - processando com parser especializado")
            return parse_santander_format(df)

        df.columns = [str(col).strip().upper() for col in df.columns]
        col_mapping = {'date': None, 'description': None, 'value': None, 'debit': None, 'credit': None, 'type': None}

        for col in df.columns:
            col_lower = col.lower()
            if any(x in col_lower for x in ['data', 'date', 'dt', 'dia']):
                col_mapping['date'] = col
            elif any(x in col_lower for x in ['descrição', 'descricao', 'histórico', 'historico', 'memo', 'lançamento', 'lancamento', 'descriç']):
                col_mapping['description'] = col
            elif any(x in col_lower for x in ['débito', 'debito', 'déb', 'deb', 'saída', 'saida']):
                col_mapping['debit'] = col
            elif any(x in col_lower for x in ['crédito', 'credito', 'créd', 'cred', 'entrada']):
                col_mapping['credit'] = col
            elif any(x in col_lower for x in ['valor', 'value', 'quantia', 'montante', 'vlr']):
                col_mapping['value'] = col
            elif any(x in col_lower for x in ['tipo', 'type', 'd/c', 'c/d', 'natureza']):
                col_mapping['type'] = col

        if not col_mapping['date']:
            for col in df.columns:
                sample = df[col].dropna().head(5)
                for val in sample:
                    if isinstance(val, datetime):
                        col_mapping['date'] = col
                        break
                    if isinstance(val, str) and re.search(r'\d{2}/\d{2}', str(val)):
                        col_mapping['date'] = col
                        break
                if col_mapping['date']:
                    break

        if not col_mapping['description']:
            for col in df.columns:
                if col == col_mapping['date']:
                    continue
                sample = df[col].dropna().head(5)
                if all(isinstance(v, str) and len(str(v)) > 5 for v in sample):
                    col_mapping['description'] = col
                    break

        for _, row in df.iterrows():
            date_val = None
            if col_mapping['date'] and pd.notna(row.get(col_mapping['date'])):
                raw_date = row[col_mapping['date']]
                if isinstance(raw_date, datetime):
                    date_val = raw_date.strftime('%d/%m/%Y')
                elif isinstance(raw_date, str):
                    date_match = re.search(r'(\d{2}/\d{2}/\d{4}|\d{2}/\d{2})', str(raw_date))
                    if date_match:
                        date_val = date_match.group(1)
                        if len(date_val) == 5:
                            date_val += "/2026"
            if not date_val:
                continue

            description = ""
            if col_mapping['description'] and pd.notna(row.get(col_mapping['description'])):
                description = str(row[col_mapping['description']]).strip()
            if not description:
                for col in df.columns:
                    val = row.get(col)
                    if pd.notna(val) and isinstance(val, str) and len(str(val)) > 10:
                        if val != date_val:
                            description = str(val).strip()
                            break

            amount = 0
            trans_type = None

            if col_mapping['debit'] is not None or col_mapping['credit'] is not None:
                debit_val = row.get(col_mapping['debit']) if col_mapping['debit'] else None
                credit_val = row.get(col_mapping['credit']) if col_mapping['credit'] else None
                if pd.notna(debit_val):
                    parsed = parse_brazilian_number(str(debit_val))
                    if parsed != 0:
                        amount = abs(parsed)
                        trans_type = 'D'
                if trans_type is None and pd.notna(credit_val):
                    parsed = parse_brazilian_number(str(credit_val))
                    if parsed != 0:
                        amount = abs(parsed)
                        trans_type = 'C'

            if trans_type is None and col_mapping['value']:
                val = row.get(col_mapping['value'])
                if pd.notna(val):
                    amount = parse_brazilian_number(str(val))
                    if col_mapping['type'] and pd.notna(row.get(col_mapping['type'])):
                        type_str = str(row[col_mapping['type']]).upper().strip()
                        if any(x in type_str for x in ['D', 'DÉB', 'DEB', 'SAÍ', 'SAI']):
                            trans_type = 'D'
                            amount = abs(amount)
                        elif any(x in type_str for x in ['C', 'CRÉ', 'CRE', 'ENT']):
                            trans_type = 'C'
                            amount = abs(amount)
                    if trans_type is None:
                        trans_type = 'C' if amount > 0 else 'D'
                        amount = abs(amount)

            if trans_type is None:
                for col in df.columns:
                    if col in [col_mapping['date'], col_mapping['description']]:
                        continue
                    val = row.get(col)
                    if pd.notna(val):
                        try:
                            if isinstance(val, (int, float)) and val != 0:
                                amount = float(val)
                                trans_type = 'C' if amount > 0 else 'D'
                                amount = abs(amount)
                                break
                            elif isinstance(val, str):
                                parsed = parse_brazilian_number(val)
                                if parsed != 0:
                                    amount = parsed
                                    trans_type = 'C' if amount > 0 else 'D'
                                    amount = abs(amount)
                                    break
                        except Exception:
                            pass

            if description and amount != 0 and trans_type:
                transactions.append({
                    'date': date_val,
                    'description': description,
                    'amount': amount,
                    'transaction_type': trans_type
                })

        if not transactions:
            raise HTTPException(status_code=400, detail="Não foi possível extrair transações do arquivo. Verifique se o formato está correto.")
        return transactions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")


def parse_ofx_statement(file_content: bytes) -> List[Dict[str, Any]]:
    encodings_to_try = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'windows-1252', 'ascii']
    last_error = None

    for encoding in encodings_to_try:
        try:
            decoded_content = file_content.decode(encoding)
            utf8_content = decoded_content.encode('utf-8')
            ofx = ofxparse.OfxParser.parse(io.BytesIO(utf8_content))
            transactions = []
            for account in ofx.accounts:
                for trans in account.statement.transactions:
                    amount = float(trans.amount)
                    transactions.append({
                        'date': trans.date.strftime('%d/%m/%Y'),
                        'description': trans.memo or trans.payee or 'Sem descrição',
                        'document': trans.id or None,
                        'amount': amount,
                        'transaction_type': 'C' if amount > 0 else 'D'
                    })
            logger.info(f"OFX parseado com sucesso usando encoding: {encoding}")
            return transactions
        except UnicodeDecodeError as e:
            last_error = e
            continue
        except Exception as e:
            last_error = e
            continue

    try:
        ofx = ofxparse.OfxParser.parse(io.BytesIO(file_content))
        transactions = []
        for account in ofx.accounts:
            for trans in account.statement.transactions:
                amount = float(trans.amount)
                desc = trans.memo or trans.payee or 'Sem descrição'
                if isinstance(desc, bytes):
                    desc = desc.decode('latin-1', errors='replace')
                transactions.append({
                    'date': trans.date.strftime('%d/%m/%Y'),
                    'description': desc,
                    'document': trans.id or None,
                    'amount': amount,
                    'transaction_type': 'C' if amount > 0 else 'D'
                })
        return transactions
    except Exception as e:
        logger.error(f"Todos os métodos de parsing OFX falharam: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erro ao processar OFX. O arquivo pode estar corrompido ou em formato não suportado. Detalhes: {str(last_error or e)}")


def extract_transactions_from_excel(file_content: bytes, file_name: str) -> List[Dict]:
    transactions = []
    df = None
    try:
        if file_name.lower().endswith('.csv'):
            for encoding in ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']:
                try:
                    df = pd.read_csv(io.BytesIO(file_content), encoding=encoding, sep=None, engine='python')
                    if not df.empty:
                        break
                except Exception:
                    continue
        else:
            try:
                df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
            except Exception as e1:
                logger.debug(f"openpyxl falhou: {e1}")
                try:
                    df = pd.read_excel(io.BytesIO(file_content), engine='xlrd')
                except Exception as e2:
                    logger.debug(f"xlrd falhou: {e2}")
                    logger.info("Tentando converter arquivo Excel legado com ssconvert...")
                    converted_content = convert_legacy_excel_with_ssconvert(file_content)
                    if converted_content:
                        try:
                            df = pd.read_excel(io.BytesIO(converted_content), engine='openpyxl')
                            logger.info("Arquivo Excel legado convertido com sucesso!")
                        except Exception as e3:
                            logger.warning(f"Falha ao ler arquivo convertido: {e3}")
    except Exception as e:
        logger.error(f"Erro ao ler arquivo: {e}")
        return []

    if df is None or df.empty:
        return []

    df = df.dropna(how='all')
    col_indices = {'date': None, 'description': None, 'value': None, 'debit': None, 'credit': None}
    col_names = [str(col).strip().upper() for col in df.columns]

    for i, col_name in enumerate(col_names):
        col_lower = col_name.lower()
        if any(x in col_lower for x in ['data', 'date', 'dt', 'dia']):
            col_indices['date'] = i
        elif any(x in col_lower for x in ['descrição', 'descricao', 'histórico', 'historico', 'memo', 'lançamento', 'lancamento']):
            col_indices['description'] = i
        elif any(x in col_lower for x in ['débito', 'debito', 'déb', 'deb', 'saída', 'saida']):
            col_indices['debit'] = i
        elif any(x in col_lower for x in ['crédito', 'credito', 'créd', 'cred', 'entrada']):
            col_indices['credit'] = i
        elif any(x in col_lower for x in ['valor', 'value', 'quantia', 'montante', 'vlr']):
            col_indices['value'] = i

    if col_indices['date'] is None:
        for i in range(len(df.columns)):
            sample = df.iloc[:20, i].dropna()
            date_count = 0
            for val in sample:
                if isinstance(val, datetime):
                    date_count += 1
                elif isinstance(val, str) and re.search(r'\d{2}/\d{2}', str(val)):
                    date_count += 1
            if date_count >= 3:
                col_indices['date'] = i
                break

    if col_indices['debit'] is None:
        for i in range(len(df.columns)):
            sample = df.iloc[:50, i].dropna()
            neg_count = sum(1 for val in sample if str(val).strip().endswith('-'))
            if neg_count >= 3:
                col_indices['debit'] = i
                break

    for idx, row in df.iterrows():
        try:
            date_val = None
            if col_indices['date'] is not None:
                raw_date = row.iloc[col_indices['date']]
                if pd.notna(raw_date):
                    if isinstance(raw_date, datetime):
                        date_val = raw_date.strftime('%d/%m/%Y')
                    elif isinstance(raw_date, str):
                        match = re.search(r'(\d{2}/\d{2}/\d{4}|\d{2}/\d{2})', str(raw_date))
                        if match:
                            date_val = match.group(1)
                            if len(date_val) == 5:
                                date_val += "/2025"
            if not date_val:
                continue

            description = ""
            if col_indices['description'] is not None and pd.notna(row.iloc[col_indices['description']]):
                description = str(row.iloc[col_indices['description']]).strip()
            if not description:
                for i in range(len(row)):
                    if i != col_indices['date'] and i != col_indices['value'] and i != col_indices['debit'] and i != col_indices['credit']:
                        val = row.iloc[i]
                        if pd.notna(val) and isinstance(val, str) and len(val) > 5:
                            description = val.strip()
                            break
            if not description:
                continue

            desc_lower = description.lower()
            if any(x in desc_lower for x in ['saldo', 'total', 'anterior', 'entradas', 'saídas']):
                continue

            value = 0
            if col_indices['debit'] is not None or col_indices['credit'] is not None:
                debit_val = 0
                credit_val = 0
                if col_indices['debit'] is not None and pd.notna(row.iloc[col_indices['debit']]):
                    debit_str = str(row.iloc[col_indices['debit']]).strip()
                    if debit_str and not any(x in debit_str.lower() for x in ['saída', 'débito', 'r$']):
                        debit_val = abs(parse_brazilian_number(debit_str))
                if col_indices['credit'] is not None and pd.notna(row.iloc[col_indices['credit']]):
                    credit_raw = row.iloc[col_indices['credit']]
                    if isinstance(credit_raw, (int, float)) and credit_raw > 0:
                        credit_val = float(credit_raw)
                    elif isinstance(credit_raw, str):
                        credit_str = str(credit_raw).strip()
                        if credit_str and not any(x in credit_str.lower() for x in ['entrada', 'crédito', 'r$']):
                            credit_val = abs(parse_brazilian_number(credit_str))
                if credit_val > 0:
                    value = credit_val
                elif debit_val > 0:
                    value = -debit_val
            elif col_indices['value'] is not None and pd.notna(row.iloc[col_indices['value']]):
                value = parse_brazilian_number(str(row.iloc[col_indices['value']]))

            if value == 0:
                continue

            transactions.append({
                'date': date_val,
                'description': description,
                'value': value,
                'type': 'CREDIT' if value > 0 else 'DEBIT'
            })
        except Exception as e:
            logger.error(f"Erro ao processar linha {idx}: {e}")
            continue

    return transactions


def extract_transactions_from_pdf(file_content: bytes) -> List[Dict]:
    transactions = []
    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    header = [str(h).upper() if h else '' for h in table[0]]
                    date_col = desc_col = value_col = debit_col = credit_col = None
                    for i, h in enumerate(header):
                        if any(x in h for x in ['DATA', 'DATE', 'DT']):
                            date_col = i
                        elif any(x in h for x in ['DESCRIÇÃO', 'DESCRICAO', 'HISTÓRICO', 'HISTORICO', 'MEMO']):
                            desc_col = i
                        elif any(x in h for x in ['DÉBITO', 'DEBITO', 'SAÍDA', 'SAIDA']):
                            debit_col = i
                        elif any(x in h for x in ['CRÉDITO', 'CREDITO', 'ENTRADA']):
                            credit_col = i
                        elif any(x in h for x in ['VALOR', 'VALUE']):
                            value_col = i
                    for row in table[1:]:
                        if not row or all(not cell for cell in row):
                            continue
                        date_val = None
                        if date_col is not None and date_col < len(row) and row[date_col]:
                            match = re.search(r'(\d{2}/\d{2}/\d{4}|\d{2}/\d{2})', str(row[date_col]))
                            if match:
                                date_val = match.group(1)
                                if len(date_val) == 5:
                                    date_val += "/2025"
                        if not date_val:
                            continue
                        description = ""
                        if desc_col is not None and desc_col < len(row) and row[desc_col]:
                            description = str(row[desc_col]).strip()
                        if not description:
                            continue
                        value = 0
                        if debit_col is not None and credit_col is not None:
                            debit_val = row[debit_col] if debit_col < len(row) else None
                            credit_val = row[credit_col] if credit_col < len(row) else None
                            if debit_val and str(debit_val).strip():
                                value = -abs(parse_brazilian_number(str(debit_val)))
                            elif credit_val and str(credit_val).strip():
                                value = abs(parse_brazilian_number(str(credit_val)))
                        elif value_col is not None and value_col < len(row) and row[value_col]:
                            value = parse_brazilian_number(str(row[value_col]))
                        if value != 0:
                            transactions.append({
                                'date': date_val,
                                'description': description,
                                'value': value,
                                'type': 'CREDIT' if value > 0 else 'DEBIT'
                            })

            if not transactions:
                full_text = ""
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        full_text += text + "\n"
                for line in full_text.split('\n'):
                    date_match = re.search(r'(\d{2}/\d{2}/\d{4}|\d{2}/\d{2})', line)
                    if not date_match:
                        continue
                    date_str = date_match.group(1)
                    if len(date_str) == 5:
                        date_str += "/2025"
                    value_matches = re.findall(r'([+-]?\s*\d{1,3}(?:\.\d{3})*,\d{2}-?)', line)
                    if not value_matches:
                        continue
                    value_str = value_matches[-1]
                    is_negative = value_str.startswith('-') or value_str.endswith('-')
                    value_str = value_str.replace('.', '').replace(',', '.').replace('-', '').replace('+', '').strip()
                    try:
                        value = float(value_str)
                        if is_negative:
                            value = -value
                    except Exception:
                        continue
                    date_end = date_match.end()
                    value_start = line.find(value_matches[-1])
                    description = line[date_end:value_start].strip() if value_start > date_end else ""
                    description = re.sub(r'\s+', ' ', description)
                    if description and value != 0:
                        transactions.append({
                            'date': date_str,
                            'description': description,
                            'value': value,
                            'type': 'CREDIT' if value > 0 else 'DEBIT'
                        })
    except Exception as e:
        logger.error(f"Erro ao processar PDF: {e}")
    return transactions


def generate_ofx_content(transactions: List[Dict], bank_name: str = "BANCO") -> str:
    import uuid
    ofx_content = """OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>{dtserver}
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKACCTFROM>
<BANKID>0000
<ACCTID>0000000000
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>
<DTSTART>{dtstart}
<DTEND>{dtend}
"""
    now = datetime.now()
    dtserver = now.strftime('%Y%m%d%H%M%S')
    dates = []
    for t in transactions:
        try:
            parts = t['date'].split('/')
            if len(parts) == 3:
                day, month, year = parts
                dates.append(datetime(int(year), int(month), int(day)))
        except Exception:
            pass
    if dates:
        dtstart = min(dates).strftime('%Y%m%d')
        dtend = max(dates).strftime('%Y%m%d')
    else:
        dtstart = dtend = now.strftime('%Y%m%d')

    ofx_content = ofx_content.format(dtserver=dtserver, dtstart=dtstart, dtend=dtend)

    for i, t in enumerate(transactions):
        try:
            parts = t['date'].split('/')
            if len(parts) == 3:
                day, month, year = parts
                dt_posted = f"{year}{month.zfill(2)}{day.zfill(2)}"
            else:
                dt_posted = now.strftime('%Y%m%d')
        except Exception:
            dt_posted = now.strftime('%Y%m%d')
        trn_type = t['type']
        trn_amt = t['value']
        fit_id = t.get('fit_id', str(uuid.uuid4())[:12])
        name = t['description'][:64]
        ofx_content += f"""<STMTTRN>
<TRNTYPE>{trn_type}
<DTPOSTED>{dt_posted}
<TRNAMT>{trn_amt:.2f}
<FITID>{fit_id}
<NAME>{name}
</STMTTRN>
"""

    ofx_content += """</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>0.00
<DTASOF>{dtasof}
</LEDGERBAL>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
""".format(dtasof=now.strftime('%Y%m%d'))
    return ofx_content
