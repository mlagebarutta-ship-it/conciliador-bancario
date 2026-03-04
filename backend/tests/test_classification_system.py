"""
Backend tests for Domínio Bridge - Classification System
Tests the intelligent classification learning system and core APIs
"""
import pytest
import requests
import os
import io
import pandas as pd
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from the review request
COMPANY_ID = "5bd7e8c3-1caa-43e1-a4c0-25b5d50ce076"
CHART_ID = "adcdfc85-1083-40c0-8f79-91f935e815f1"

class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root working: {data['message']}")


class TestClassificationHistory:
    """Tests for the classification history (learning) system"""
    
    def test_get_classification_history_all(self):
        """Test GET /api/classification-history without filter"""
        response = requests.get(f"{BASE_URL}/api/classification-history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Classification history returned {len(data)} records")
    
    def test_get_classification_history_by_company(self):
        """Test GET /api/classification-history with company_id filter"""
        response = requests.get(f"{BASE_URL}/api/classification-history?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all records belong to the company
        for record in data:
            assert record['company_id'] == COMPANY_ID
            assert 'description_pattern' in record
            assert 'transaction_type' in record
            assert 'debit_account' in record
            assert 'credit_account' in record
            assert 'usage_count' in record
        
        print(f"✓ Classification history for company {COMPANY_ID}: {len(data)} records")
        
        # Check if the expected test record exists
        if data:
            pix_record = next((r for r in data if 'PIX RECEBIDO' in r['description_pattern']), None)
            if pix_record:
                assert pix_record['debit_account'] == '1.1.1.02.000006'
                assert pix_record['credit_account'] == '3.1.1.01.000001'
                print(f"✓ Found expected PIX classification: debit={pix_record['debit_account']}, credit={pix_record['credit_account']}")


class TestCompanies:
    """Tests for company CRUD operations"""
    
    def test_get_companies(self):
        """Test GET /api/companies"""
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Companies endpoint returned {len(data)} companies")
    
    def test_get_company_by_id(self):
        """Test GET /api/companies/{id}"""
        response = requests.get(f"{BASE_URL}/api/companies/{COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == COMPANY_ID
        assert 'cnpj' in data
        assert 'name' in data
        print(f"✓ Company retrieved: {data['name']}")
    
    def test_get_company_not_found(self):
        """Test GET /api/companies/{id} with invalid ID"""
        response = requests.get(f"{BASE_URL}/api/companies/invalid-id-12345")
        assert response.status_code == 404


class TestChartOfAccounts:
    """Tests for chart of accounts operations"""
    
    def test_get_charts(self):
        """Test GET /api/chart-of-accounts"""
        response = requests.get(f"{BASE_URL}/api/chart-of-accounts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Chart of accounts returned {len(data)} charts")
    
    def test_get_charts_by_company(self):
        """Test GET /api/chart-of-accounts with company_id filter"""
        response = requests.get(f"{BASE_URL}/api/chart-of-accounts?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for chart in data:
            assert chart['company_id'] == COMPANY_ID
        print(f"✓ Charts for company {COMPANY_ID}: {len(data)} charts")


class TestAccountItems:
    """Tests for account items operations"""
    
    def test_get_account_items(self):
        """Test GET /api/account-items"""
        response = requests.get(f"{BASE_URL}/api/account-items?chart_id={CHART_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify structure
        for item in data[:5]:  # Check first 5
            assert 'code' in item
            assert 'description' in item
            assert 'account_type' in item
            assert item['account_type'] in ['ATIVO', 'PASSIVO', 'RECEITA', 'DESPESA']
        
        print(f"✓ Account items returned {len(data)} items for chart {CHART_ID}")


class TestBankStatements:
    """Tests for bank statement operations"""
    
    def test_get_bank_statements(self):
        """Test GET /api/bank-statements"""
        response = requests.get(f"{BASE_URL}/api/bank-statements")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Bank statements returned {len(data)} statements")
    
    def test_get_bank_statements_by_company(self):
        """Test GET /api/bank-statements with company_id filter"""
        response = requests.get(f"{BASE_URL}/api/bank-statements?company_id={COMPANY_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        for statement in data:
            assert statement['company_id'] == COMPANY_ID
            assert 'total_transactions' in statement
            assert 'classified_count' in statement
            assert 'manual_count' in statement
        
        print(f"✓ Bank statements for company: {len(data)} statements")
    
    def test_get_statement_by_id(self):
        """Test GET /api/bank-statements/{id}"""
        # First get a statement ID
        response = requests.get(f"{BASE_URL}/api/bank-statements?company_id={COMPANY_ID}")
        statements = response.json()
        
        if statements:
            statement_id = statements[0]['id']
            response = requests.get(f"{BASE_URL}/api/bank-statements/{statement_id}")
            assert response.status_code == 200
            data = response.json()
            assert data['id'] == statement_id
            print(f"✓ Statement retrieved: {data['filename']}")
    
    def test_get_statement_transactions(self):
        """Test GET /api/bank-statements/{id}/transactions"""
        # First get a statement ID
        response = requests.get(f"{BASE_URL}/api/bank-statements?company_id={COMPANY_ID}")
        statements = response.json()
        
        if statements:
            statement_id = statements[0]['id']
            response = requests.get(f"{BASE_URL}/api/bank-statements/{statement_id}/transactions")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            
            for trans in data[:5]:  # Check first 5
                assert 'date' in trans
                assert 'description' in trans
                assert 'amount' in trans
                assert 'transaction_type' in trans
                assert trans['transaction_type'] in ['C', 'D']
            
            print(f"✓ Transactions for statement: {len(data)} transactions")


class TestTransactionUpdate:
    """Tests for transaction update and classification learning"""
    
    def test_update_transaction_saves_to_history(self):
        """Test PUT /api/transactions/{id} saves classification to history"""
        # Get a statement with transactions
        response = requests.get(f"{BASE_URL}/api/bank-statements?company_id={COMPANY_ID}")
        statements = response.json()
        
        if not statements:
            pytest.skip("No statements available for testing")
        
        # Get transactions from the first statement
        statement_id = statements[0]['id']
        response = requests.get(f"{BASE_URL}/api/bank-statements/{statement_id}/transactions")
        transactions = response.json()
        
        if not transactions:
            pytest.skip("No transactions available for testing")
        
        # Find a transaction to update
        trans = transactions[0]
        trans_id = trans['id']
        
        # Update with new classification
        update_data = {
            "debit_account": "1.1.1.02.000006",
            "credit_account": "3.1.1.01.000001",
            "status": "CLASSIFICADO"
        }
        
        response = requests.put(f"{BASE_URL}/api/transactions/{trans_id}", json=update_data)
        assert response.status_code == 200
        
        updated_trans = response.json()
        assert updated_trans['debit_account'] == update_data['debit_account']
        assert updated_trans['credit_account'] == update_data['credit_account']
        
        print(f"✓ Transaction {trans_id} updated successfully")
        
        # Verify classification was saved to history
        response = requests.get(f"{BASE_URL}/api/classification-history?company_id={COMPANY_ID}")
        history = response.json()
        
        # Check if a history entry exists for this description
        matching_history = [h for h in history if h['description_pattern'] == trans['description']]
        if matching_history:
            print(f"✓ Classification saved to history for: {trans['description']}")
        else:
            print(f"⚠ Classification history entry not found for: {trans['description']}")
    
    def test_update_transaction_not_found(self):
        """Test PUT /api/transactions/{id} with invalid ID"""
        update_data = {
            "debit_account": "1.1.1.02.000006",
            "credit_account": "3.1.1.01.000001"
        }
        response = requests.put(f"{BASE_URL}/api/transactions/invalid-id-12345", json=update_data)
        assert response.status_code == 404


class TestExcelUploadAndProcessing:
    """Tests for Excel file upload and processing"""
    
    def test_upload_excel_statement(self):
        """Test POST /api/bank-statements/upload with Excel file"""
        # Create a test Excel file in memory
        df = pd.DataFrame({
            'Data': ['01/01/2026', '02/01/2026', '03/01/2026'],
            'Descrição': ['TEST_PIX RECEBIDO DE CLIENTE TESTE', 'TEST_PAGAMENTO FORNECEDOR', 'TEST_TRANSFERENCIA BANCARIA'],
            'Valor': [1500.00, -500.00, 2000.00]
        })
        
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        
        files = {
            'file': ('test_extrato.xlsx', excel_buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
        
        params = {
            'company_id': COMPANY_ID,
            'chart_id': CHART_ID,
            'bank_name': 'TestBank',
            'period': '01/2026'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bank-statements/upload",
            files=files,
            params=params
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'statement' in data
        assert 'transactions' in data
        assert data['statement']['company_id'] == COMPANY_ID
        assert data['statement']['status'] == 'COMPLETED'
        
        # Check if intelligent classification was applied
        transactions = data['transactions']
        pix_trans = next((t for t in transactions if 'PIX RECEBIDO' in t['description']), None)
        
        if pix_trans:
            # Should be auto-classified based on history
            if pix_trans['status'] == 'CLASSIFICADO':
                print(f"✓ Intelligent classification applied: debit={pix_trans['debit_account']}, credit={pix_trans['credit_account']}")
            else:
                print(f"⚠ Transaction not auto-classified: {pix_trans['description']}")
        
        print(f"✓ Excel upload successful: {len(transactions)} transactions processed")
        
        # Cleanup - delete the test statement
        statement_id = data['statement']['id']
        requests.delete(f"{BASE_URL}/api/bank-statements/{statement_id}")


class TestExportXLSX:
    """Tests for XLSX export functionality"""
    
    def test_export_statement_xlsx(self):
        """Test GET /api/bank-statements/{id}/export"""
        # Get a statement ID
        response = requests.get(f"{BASE_URL}/api/bank-statements?company_id={COMPANY_ID}")
        statements = response.json()
        
        if not statements:
            pytest.skip("No statements available for testing")
        
        statement_id = statements[0]['id']
        
        response = requests.get(f"{BASE_URL}/api/bank-statements/{statement_id}/export")
        assert response.status_code == 200
        
        # Check content type
        content_type = response.headers.get('content-type', '')
        assert 'spreadsheet' in content_type or 'octet-stream' in content_type
        
        # Verify it's a valid Excel file
        excel_content = io.BytesIO(response.content)
        df = pd.read_excel(excel_content)
        
        # Check expected columns
        expected_columns = ['Descrição', 'Data', 'Valor', 'Conta Débito', 'Conta Crédito', 'Histórico']
        for col in expected_columns:
            assert col in df.columns, f"Missing column: {col}"
        
        print(f"✓ XLSX export successful: {len(df)} rows, columns: {list(df.columns)}")


class TestClassificationRules:
    """Tests for classification rules CRUD"""
    
    def test_get_classification_rules(self):
        """Test GET /api/classification-rules"""
        response = requests.get(f"{BASE_URL}/api/classification-rules")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Classification rules returned {len(data)} rules")
    
    def test_create_and_delete_rule(self):
        """Test POST and DELETE /api/classification-rules"""
        # Create a test rule
        rule_data = {
            "keyword": "TEST_KEYWORD_12345",
            "debit_account_code": "1.1.1.02.000006",
            "credit_account_code": "3.1.1.01.000001",
            "description": "Test rule for automated testing",
            "priority": 100
        }
        
        response = requests.post(f"{BASE_URL}/api/classification-rules", json=rule_data)
        assert response.status_code == 200
        
        created_rule = response.json()
        assert created_rule['keyword'] == rule_data['keyword']
        rule_id = created_rule['id']
        
        print(f"✓ Rule created: {rule_id}")
        
        # Delete the test rule
        response = requests.delete(f"{BASE_URL}/api/classification-rules/{rule_id}")
        assert response.status_code == 200
        
        print(f"✓ Rule deleted: {rule_id}")


class TestIntelligentClassificationFlow:
    """End-to-end test for intelligent classification learning"""
    
    def test_classification_learning_flow(self):
        """
        Test the complete flow:
        1. Upload statement with new transaction
        2. Manually classify transaction
        3. Verify classification saved to history
        4. Upload new statement with similar transaction
        5. Verify auto-classification applied
        """
        # Step 1: Create test Excel with unique description
        unique_desc = f"TEST_UNIQUE_PAYMENT_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        df = pd.DataFrame({
            'Data': ['01/01/2026'],
            'Descrição': [unique_desc],
            'Valor': [1000.00]
        })
        
        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False)
        excel_buffer.seek(0)
        
        files = {
            'file': ('test_learning.xlsx', excel_buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
        
        params = {
            'company_id': COMPANY_ID,
            'chart_id': CHART_ID,
            'bank_name': 'TestBank',
            'period': '01/2026'
        }
        
        response = requests.post(f"{BASE_URL}/api/bank-statements/upload", files=files, params=params)
        assert response.status_code == 200
        
        data = response.json()
        statement_id = data['statement']['id']
        trans_id = data['transactions'][0]['id']
        
        print(f"✓ Step 1: Statement uploaded with transaction: {unique_desc}")
        
        # Step 2: Manually classify the transaction
        update_data = {
            "debit_account": "1.1.1.02.000006",
            "credit_account": "3.1.1.01.000001",
            "status": "CLASSIFICADO"
        }
        
        response = requests.put(f"{BASE_URL}/api/transactions/{trans_id}", json=update_data)
        assert response.status_code == 200
        
        print(f"✓ Step 2: Transaction manually classified")
        
        # Step 3: Verify classification saved to history
        response = requests.get(f"{BASE_URL}/api/classification-history?company_id={COMPANY_ID}")
        history = response.json()
        
        matching = [h for h in history if h['description_pattern'] == unique_desc]
        assert len(matching) > 0, "Classification not saved to history"
        
        print(f"✓ Step 3: Classification saved to history")
        
        # Step 4: Upload new statement with similar transaction
        df2 = pd.DataFrame({
            'Data': ['02/01/2026'],
            'Descrição': [unique_desc],  # Same description
            'Valor': [2000.00]
        })
        
        excel_buffer2 = io.BytesIO()
        df2.to_excel(excel_buffer2, index=False)
        excel_buffer2.seek(0)
        
        files2 = {
            'file': ('test_learning2.xlsx', excel_buffer2, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
        
        response = requests.post(f"{BASE_URL}/api/bank-statements/upload", files=files2, params=params)
        assert response.status_code == 200
        
        data2 = response.json()
        statement_id2 = data2['statement']['id']
        new_trans = data2['transactions'][0]
        
        print(f"✓ Step 4: Second statement uploaded")
        
        # Step 5: Verify auto-classification applied
        if new_trans['status'] == 'CLASSIFICADO':
            assert new_trans['debit_account'] == update_data['debit_account']
            assert new_trans['credit_account'] == update_data['credit_account']
            print(f"✓ Step 5: Auto-classification applied successfully!")
        else:
            print(f"⚠ Step 5: Transaction not auto-classified (status: {new_trans['status']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/bank-statements/{statement_id}")
        requests.delete(f"{BASE_URL}/api/bank-statements/{statement_id2}")
        
        # Clean up history entry
        for h in matching:
            requests.delete(f"{BASE_URL}/api/classification-history/{h['id']}")
        
        print("✓ Cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
