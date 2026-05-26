import logging
from collections import defaultdict
from typing import Dict, Optional
from datetime import datetime, timezone

from database import db

logger = logging.getLogger(__name__)


def calculate_similarity(str1: str, str2: str) -> float:
    str1 = str1.upper().strip()
    str2 = str2.upper().strip()
    if str1 == str2:
        return 1.0
    if str1 in str2 or str2 in str1:
        return 0.8
    words1 = set(str1.split())
    words2 = set(str2.split())
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union) if union else 0.0


async def classify_transaction(description: str, amount: float, trans_type: str, chart_id: str, company_id: str) -> Dict[str, Optional[str]]:
    description_upper = description.upper()

    # PASSO 1: Buscar no histórico de classificações da empresa
    history_items = await db.classification_history.find(
        {"company_id": company_id}, {"_id": 0}
    ).sort("usage_count", -1).to_list(500)

    best_match = None
    best_score = 0.0
    for item in history_items:
        if item['transaction_type'] == trans_type:
            score = calculate_similarity(description, item['description_pattern'])
            if score > best_score and score >= 0.6:
                best_score = score
                best_match = item

    if best_match:
        await db.classification_history.update_one(
            {"id": best_match['id']},
            {"$inc": {"usage_count": 1}, "$set": {"last_used": datetime.now(timezone.utc)}}
        )
        return {
            'debit_account': best_match['debit_account'],
            'credit_account': best_match['credit_account'],
            'status': 'CLASSIFICADO',
            'confidence': best_score
        }

    # PASSO 2: Buscar contas do plano
    account_items = await db.account_items.find({"chart_id": chart_id}, {"_id": 0}).to_list(1000)
    accounts_by_code = {item['code']: item for item in account_items}
    accounts_by_type = defaultdict(list)
    for item in account_items:
        accounts_by_type[item['account_type']].append(item)

    # PASSO 3: Buscar regras configuradas (empresa específica + globais)
    rules = await db.classification_rules.find({
        "$or": [
            {"company_id": company_id},
            {"company_id": None},
            {"company_id": {"$exists": False}}
        ]
    }, {"_id": 0}).sort("priority", -1).to_list(100)

    rules = sorted(rules, key=lambda r: (
        0 if r.get('company_id') == company_id else 1,
        -r.get('priority', 0)
    ))

    for rule in rules:
        if rule['keyword'].upper() in description_upper:
            debit_code = rule.get('debit_account_code')
            credit_code = rule.get('credit_account_code')
            if debit_code and credit_code:
                if not account_items or (debit_code in accounts_by_code and credit_code in accounts_by_code):
                    return {
                        'debit_account': debit_code,
                        'credit_account': credit_code,
                        'status': 'CLASSIFICADO',
                        'confidence': 1.0
                    }

    # PASSO 4: Lógica automática baseada no tipo
    if account_items:
        if trans_type == 'C':
            banco_conta = None
            for conta in accounts_by_type['ATIVO']:
                if 'BANCO' in conta['description'].upper() or 'CAIXA' in conta['description'].upper():
                    banco_conta = conta['code']
                    break
            receita_conta = None
            for conta in accounts_by_type['RECEITA']:
                if 'RECEITA' in conta['description'].upper() or 'VENDA' in conta['description'].upper():
                    receita_conta = conta['code']
                    break
            if banco_conta and receita_conta:
                return {
                    'debit_account': banco_conta,
                    'credit_account': receita_conta,
                    'status': 'CLASSIFICADO',
                    'confidence': 0.7
                }
        elif trans_type == 'D':
            banco_conta = None
            for conta in accounts_by_type['ATIVO']:
                if 'BANCO' in conta['description'].upper() or 'CAIXA' in conta['description'].upper():
                    banco_conta = conta['code']
                    break
            despesa_conta = None
            if accounts_by_type['DESPESA']:
                despesa_conta = accounts_by_type['DESPESA'][0]['code']
            if despesa_conta and banco_conta:
                return {
                    'debit_account': despesa_conta,
                    'credit_account': banco_conta,
                    'status': 'CLASSIFICADO',
                    'confidence': 0.5
                }

    return {
        'debit_account': None,
        'credit_account': None,
        'status': 'CLASSIFICAR MANUALMENTE',
        'confidence': 0.0
    }
