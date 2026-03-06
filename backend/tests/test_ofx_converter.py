"""
Test suite for OFX Converter module
Tests: /api/converter/preview, /api/converter/generate-ofx, /api/converter/import-to-system
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data - existing company and chart from database
TEST_COMPANY_ID = "62cd9570-d630-4707-964a-371f1c10fece"  # Empresa Teste Conversor
TEST_CHART_ID = "68d5c4aa-ea44-4d79-a4aa-2096b7ee8fef"  # Plano Conversor Teste

# CSV test file content
CSV_CONTENT = """Data,Descrição,Valor
01/12/2025,PAGAMENTO FORNECEDOR,-1500.50
05/12/2025,VENDA PRODUTO X,2500.00
10/12/2025,PAGAMENTO ALUGUEL,-3000.00
15/12/2025,RECEBIMENTO CLIENTE,4500.75
20/12/2025,TAXA BANCÁRIA,-25.00
"""

# Excel-like CSV with separate debit/credit columns
CSV_DEBIT_CREDIT = """Data,Descrição,Débito,Crédito
01/12/2025,PAGAMENTO FORNECEDOR,1500.50,
05/12/2025,VENDA PRODUTO X,,2500.00
10/12/2025,PAGAMENTO ALUGUEL,3000.00,
15/12/2025,RECEBIMENTO CLIENTE,,4500.75
20/12/2025,TAXA BANCÁRIA,25.00,
"""


class TestConverterPreview:
    """Tests for POST /api/converter/preview endpoint"""
    
    def test_preview_csv_file_success(self):
        """Test CSV file preview - should extract 5 transactions"""
        files = {'file': ('test_extrato.csv', CSV_CONTENT.encode('utf-8'), 'text/csv')}
        
        response = requests.post(f"{BASE_URL}/api/converter/preview", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Validate response structure
        assert 'file_name' in data
        assert 'file_type' in data
        assert 'total_transactions' in data
        assert 'total_credits' in data
        assert 'total_debits' in data
        assert 'balance' in data
        assert 'transactions' in data
        
        # Validate data values
        assert data['file_type'] == 'CSV'
        assert data['total_transactions'] == 5, f"Expected 5 transactions, got {data['total_transactions']}"
        
        # Validate totals (2 credits: 2500 + 4500.75 = 7000.75, 3 debits: 1500.50 + 3000 + 25 = 4525.50)
        assert data['total_credits'] == 7000.75, f"Expected 7000.75 credits, got {data['total_credits']}"
        assert data['total_debits'] == 4525.50, f"Expected 4525.50 debits, got {data['total_debits']}"
        
        # Validate transactions list
        assert len(data['transactions']) == 5
        
        # Check first transaction structure
        trans = data['transactions'][0]
        assert 'date' in trans
        assert 'description' in trans
        assert 'value' in trans
        assert 'type' in trans
        assert 'fit_id' in trans
        
        print(f"SUCCESS: Preview returned {data['total_transactions']} transactions")
        print(f"  Credits: R$ {data['total_credits']}, Debits: R$ {data['total_debits']}")
    
    def test_preview_csv_with_debit_credit_columns(self):
        """Test CSV with separate debit/credit columns"""
        files = {'file': ('extrato_colunas.csv', CSV_DEBIT_CREDIT.encode('utf-8'), 'text/csv')}
        
        response = requests.post(f"{BASE_URL}/api/converter/preview", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['total_transactions'] == 5
        
        # Verify credit/debit detection
        credits = [t for t in data['transactions'] if t['type'] == 'CREDIT']
        debits = [t for t in data['transactions'] if t['type'] == 'DEBIT']
        
        assert len(credits) == 2, f"Expected 2 credits, got {len(credits)}"
        assert len(debits) == 3, f"Expected 3 debits, got {len(debits)}"
        
        print(f"SUCCESS: Debit/Credit columns parsed correctly - {len(credits)} credits, {len(debits)} debits")
    
    def test_preview_invalid_file_format(self):
        """Test preview with unsupported file format"""
        files = {'file': ('test.txt', b'invalid content', 'text/plain')}
        
        response = requests.post(f"{BASE_URL}/api/converter/preview", files=files)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("SUCCESS: Invalid file format rejected correctly")
    
    def test_preview_empty_csv(self):
        """Test preview with empty CSV file"""
        empty_csv = "Data,Descrição,Valor\n"
        files = {'file': ('empty.csv', empty_csv.encode('utf-8'), 'text/csv')}
        
        response = requests.post(f"{BASE_URL}/api/converter/preview", files=files)
        
        assert response.status_code == 400, f"Expected 400 for empty file, got {response.status_code}"
        print("SUCCESS: Empty CSV rejected correctly")


class TestGenerateOFX:
    """Tests for POST /api/converter/generate-ofx endpoint"""
    
    def test_generate_ofx_success(self):
        """Test OFX file generation from transactions"""
        # First get preview to get transactions
        files = {'file': ('test_extrato.csv', CSV_CONTENT.encode('utf-8'), 'text/csv')}
        preview_response = requests.post(f"{BASE_URL}/api/converter/preview", files=files)
        assert preview_response.status_code == 200
        
        preview_data = preview_response.json()
        transactions = preview_data['transactions']
        
        # Generate OFX
        response = requests.post(
            f"{BASE_URL}/api/converter/generate-ofx",
            json=transactions,
            params={'bank_name': 'BANCO_TESTE'}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify response is OFX file
        content_type = response.headers.get('content-type', '')
        assert 'application/x-ofx' in content_type or 'application/octet-stream' in content_type, f"Unexpected content type: {content_type}"
        
        # Verify OFX content
        ofx_content = response.text
        assert 'OFXHEADER:100' in ofx_content, "Missing OFX header"
        assert '<OFX>' in ofx_content, "Missing OFX tag"
        assert '<STMTTRN>' in ofx_content, "Missing transaction tags"
        assert 'PAGAMENTO FORNECEDOR' in ofx_content, "Missing transaction description"
        
        print("SUCCESS: OFX file generated correctly")
        print(f"  OFX content length: {len(ofx_content)} bytes")
    
    def test_generate_ofx_with_custom_bank_name(self):
        """Test OFX generation with custom bank name"""
        transactions = [
            {"date": "01/12/2025", "description": "TEST TRANSACTION", "value": 100.00, "type": "CREDIT", "fit_id": "test123"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/converter/generate-ofx",
            json=transactions,
            params={'bank_name': 'SANTANDER'}
        )
        
        assert response.status_code == 200
        print("SUCCESS: OFX generated with custom bank name")


class TestImportToSystem:
    """Tests for POST /api/converter/import-to-system endpoint"""
    
    def test_import_to_system_success(self):
        """Test importing transactions to the reconciliation system"""
        # First get preview to get transactions
        files = {'file': ('test_extrato.csv', CSV_CONTENT.encode('utf-8'), 'text/csv')}
        preview_response = requests.post(f"{BASE_URL}/api/converter/preview", files=files)
        assert preview_response.status_code == 200
        
        preview_data = preview_response.json()
        transactions = preview_data['transactions']
        
        # Import to system
        response = requests.post(
            f"{BASE_URL}/api/converter/import-to-system",
            json=transactions,
            params={
                'company_id': TEST_COMPANY_ID,
                'chart_id': TEST_CHART_ID,
                'bank_name': 'BANCO_TESTE_IMPORT',
                'period': '12/2025'
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Validate response structure
        assert 'statement_id' in data, "Missing statement_id in response"
        assert 'total_transactions' in data, "Missing total_transactions"
        assert 'classified_count' in data, "Missing classified_count"
        assert 'manual_count' in data, "Missing manual_count"
        assert 'message' in data, "Missing message"
        
        # Validate data values
        assert data['total_transactions'] == 5, f"Expected 5 transactions, got {data['total_transactions']}"
        assert data['classified_count'] + data['manual_count'] == 5
        
        statement_id = data['statement_id']
        print(f"SUCCESS: Import created statement {statement_id}")
        print(f"  Total: {data['total_transactions']}, Classified: {data['classified_count']}, Manual: {data['manual_count']}")
        
        # Verify statement was created in database
        statement_response = requests.get(f"{BASE_URL}/api/bank-statements/{statement_id}")
        assert statement_response.status_code == 200, f"Statement not found: {statement_response.status_code}"
        
        statement = statement_response.json()
        assert statement['company_id'] == TEST_COMPANY_ID
        assert statement['chart_id'] == TEST_CHART_ID
        assert statement['bank_name'] == 'BANCO_TESTE_IMPORT'
        assert statement['period'] == '12/2025'
        assert statement['status'] == 'COMPLETED'
        
        print("SUCCESS: Statement verified in database")
        
        # Verify transactions were created
        trans_response = requests.get(f"{BASE_URL}/api/transactions", params={'statement_id': statement_id})
        assert trans_response.status_code == 200
        
        trans_list = trans_response.json()
        assert len(trans_list) == 5, f"Expected 5 transactions, got {len(trans_list)}"
        
        print("SUCCESS: All 5 transactions created in database")
        
        return statement_id
    
    def test_import_invalid_company(self):
        """Test import with invalid company ID"""
        transactions = [
            {"date": "01/12/2025", "description": "TEST", "value": 100.00, "type": "CREDIT", "fit_id": "test123"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/converter/import-to-system",
            json=transactions,
            params={
                'company_id': 'invalid-company-id',
                'chart_id': TEST_CHART_ID,
                'bank_name': 'TEST'
            }
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("SUCCESS: Invalid company ID rejected correctly")
    
    def test_import_invalid_chart(self):
        """Test import with invalid chart ID"""
        transactions = [
            {"date": "01/12/2025", "description": "TEST", "value": 100.00, "type": "CREDIT", "fit_id": "test123"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/converter/import-to-system",
            json=transactions,
            params={
                'company_id': TEST_COMPANY_ID,
                'chart_id': 'invalid-chart-id',
                'bank_name': 'TEST'
            }
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("SUCCESS: Invalid chart ID rejected correctly")
    
    def test_import_auto_period_detection(self):
        """Test import with automatic period detection from transaction dates"""
        transactions = [
            {"date": "15/01/2026", "description": "TEST AUTO PERIOD", "value": 500.00, "type": "CREDIT", "fit_id": "autoperiod1"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/converter/import-to-system",
            json=transactions,
            params={
                'company_id': TEST_COMPANY_ID,
                'chart_id': TEST_CHART_ID,
                'bank_name': 'AUTO_PERIOD_TEST'
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        statement_id = data['statement_id']
        
        # Verify period was auto-detected
        statement_response = requests.get(f"{BASE_URL}/api/bank-statements/{statement_id}")
        statement = statement_response.json()
        
        assert statement['period'] == '01/2026', f"Expected period 01/2026, got {statement['period']}"
        print(f"SUCCESS: Auto-detected period: {statement['period']}")


class TestIntegrationFlow:
    """End-to-end integration tests for the complete converter flow"""
    
    def test_complete_flow_csv_to_import(self):
        """Test complete flow: Upload CSV -> Preview -> Import to System"""
        
        # Step 1: Upload and preview
        files = {'file': ('integration_test.csv', CSV_CONTENT.encode('utf-8'), 'text/csv')}
        preview_response = requests.post(f"{BASE_URL}/api/converter/preview", files=files)
        
        assert preview_response.status_code == 200
        preview_data = preview_response.json()
        
        print(f"Step 1 - Preview: {preview_data['total_transactions']} transactions detected")
        
        # Step 2: Import to system
        import_response = requests.post(
            f"{BASE_URL}/api/converter/import-to-system",
            json=preview_data['transactions'],
            params={
                'company_id': TEST_COMPANY_ID,
                'chart_id': TEST_CHART_ID,
                'bank_name': 'INTEGRATION_TEST',
                'period': '12/2025'
            }
        )
        
        assert import_response.status_code == 200
        import_data = import_response.json()
        statement_id = import_data['statement_id']
        
        print(f"Step 2 - Import: Statement {statement_id} created")
        
        # Step 3: Verify in history
        history_response = requests.get(f"{BASE_URL}/api/bank-statements")
        assert history_response.status_code == 200
        
        statements = history_response.json()
        found = any(s['id'] == statement_id for s in statements)
        assert found, "Statement not found in history"
        
        print("Step 3 - Verification: Statement found in history")
        
        # Step 4: Verify statement details
        details_response = requests.get(f"{BASE_URL}/api/bank-statements/{statement_id}")
        assert details_response.status_code == 200
        
        details = details_response.json()
        assert details['total_transactions'] == 5
        assert details['status'] == 'COMPLETED'
        
        print("Step 4 - Details: Statement details verified")
        print("SUCCESS: Complete integration flow passed!")


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Verify test environment is ready"""
    # Check API is accessible
    response = requests.get(f"{BASE_URL}/api/")
    assert response.status_code == 200, f"API not accessible: {response.status_code}"
    
    # Check test company exists
    response = requests.get(f"{BASE_URL}/api/companies")
    companies = response.json()
    company_exists = any(c['id'] == TEST_COMPANY_ID for c in companies)
    
    if not company_exists:
        pytest.skip(f"Test company {TEST_COMPANY_ID} not found in database")
    
    # Check test chart exists
    response = requests.get(f"{BASE_URL}/api/chart-of-accounts")
    charts = response.json()
    chart_exists = any(c['id'] == TEST_CHART_ID for c in charts)
    
    if not chart_exists:
        pytest.skip(f"Test chart {TEST_CHART_ID} not found in database")
    
    print(f"Test environment ready - API: {BASE_URL}")
    yield


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
