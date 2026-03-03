import requests
import sys
import json
from datetime import datetime
import uuid

class AgenteContabilAPITester:
    def __init__(self, base_url="https://extrato-contabil.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'company': None,
            'chart': None,
            'accounts': [],
            'rules': [],
            'statement': None
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test("Root API", "GET", "", 200)
        if success and 'message' in response:
            print(f"   Message: {response['message']}")
        return success

    def test_create_company(self):
        """Test company creation"""
        company_data = {
            "cnpj": "12.345.678/0001-90",
            "name": "Empresa Teste Ltda",
            "address": "Rua Teste, 123",
            "phone": "(11) 99999-9999",
            "email": "teste@empresa.com"
        }
        
        success, response = self.run_test("Create Company", "POST", "companies", 200, company_data)
        if success and 'id' in response:
            self.created_ids['company'] = response['id']
            print(f"   Created company ID: {response['id']}")
        return success

    def test_get_companies(self):
        """Test get companies"""
        success, response = self.run_test("Get Companies", "GET", "companies", 200)
        if success:
            print(f"   Found {len(response)} companies")
            if self.created_ids['company']:
                found = any(c['id'] == self.created_ids['company'] for c in response)
                print(f"   Created company found: {found}")
        return success

    def test_create_chart_of_accounts(self):
        """Test chart of accounts creation"""
        if not self.created_ids['company']:
            print("❌ Skipping - No company created")
            return False
            
        chart_data = {
            "company_id": self.created_ids['company'],
            "name": "Plano 2026",
            "description": "Plano de contas para 2026"
        }
        
        success, response = self.run_test("Create Chart of Accounts", "POST", "chart-of-accounts", 200, chart_data)
        if success and 'id' in response:
            self.created_ids['chart'] = response['id']
            print(f"   Created chart ID: {response['id']}")
        return success

    def test_get_charts(self):
        """Test get charts of accounts"""
        success, response = self.run_test("Get Charts of Accounts", "GET", "chart-of-accounts", 200)
        if success:
            print(f"   Found {len(response)} charts")
        return success

    def test_create_account_items(self):
        """Test account items creation"""
        if not self.created_ids['chart']:
            print("❌ Skipping - No chart created")
            return False
            
        accounts = [
            {"code": "1.1.01", "description": "Banco Itaú", "account_type": "ATIVO"},
            {"code": "4.1.01", "description": "Receita de Vendas", "account_type": "RECEITA"},
            {"code": "3.1.01", "description": "Despesas Operacionais", "account_type": "DESPESA"}
        ]
        
        all_success = True
        for account in accounts:
            account_data = {
                "chart_id": self.created_ids['chart'],
                **account
            }
            
            success, response = self.run_test(f"Create Account {account['code']}", "POST", "account-items", 200, account_data)
            if success and 'id' in response:
                self.created_ids['accounts'].append(response['id'])
                print(f"   Created account ID: {response['id']}")
            else:
                all_success = False
                
        return all_success

    def test_get_account_items(self):
        """Test get account items"""
        success, response = self.run_test("Get Account Items", "GET", "account-items", 200)
        if success:
            print(f"   Found {len(response)} account items")
        return success

    def test_create_classification_rule(self):
        """Test classification rule creation"""
        rule_data = {
            "keyword": "TESTE",
            "debit_account_code": "1.1.01",
            "credit_account_code": "4.1.01",
            "description": "Regra de teste",
            "priority": 1
        }
        
        success, response = self.run_test("Create Classification Rule", "POST", "classification-rules", 200, rule_data)
        if success and 'id' in response:
            self.created_ids['rules'].append(response['id'])
            print(f"   Created rule ID: {response['id']}")
        return success

    def test_get_classification_rules(self):
        """Test get classification rules"""
        success, response = self.run_test("Get Classification Rules", "GET", "classification-rules", 200)
        if success:
            print(f"   Found {len(response)} classification rules")
        return success

    def test_bank_statement_upload(self):
        """Test bank statement upload (will create test file)"""
        if not self.created_ids['company'] or not self.created_ids['chart']:
            print("❌ Skipping - No company or chart created")
            return False
            
        # Create test Excel content (simple CSV-like data)
        test_data = """Data,Descrição,Valor
01/01/2026,PIX RECEBIDO DE CLIENTE,1500.00
02/01/2026,PIX TRANSF FORNECEDOR,-500.00
03/01/2026,TARIFA BANCARIA,-15.50
05/01/2026,SISPAG FOLHA JANEIRO,-3000.00
10/01/2026,PIX RECEBIDO PAGAMENTO,2500.00"""
        
        # Create a simple text file (the backend should handle parsing)
        files = {'file': ('extrato_teste.xlsx', test_data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        
        # Parameters need to be in URL query string
        params = {
            'company_id': self.created_ids['company'],
            'chart_id': self.created_ids['chart'],
            'bank_name': 'Nubank',
            'period': '01/2026'
        }
        
        url = f"{self.base_url}/bank-statements/upload"
        self.tests_run += 1
        print(f"\n🔍 Testing Upload Bank Statement...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, files=files, params=params)
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if 'statement' in response_data:
                        self.created_ids['statement'] = response_data['statement']['id']
                        print(f"   Created statement ID: {response_data['statement']['id']}")
                        print(f"   Total transactions: {response_data['statement']['total_transactions']}")
                        print(f"   Classified: {response_data['statement']['classified_count']}")
                        print(f"   Manual: {response_data['statement']['manual_count']}")
                    return True
                except:
                    return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    print(f"   Response: {response.text}")
                except:
                    pass
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_get_bank_statements(self):
        """Test get bank statements"""
        success, response = self.run_test("Get Bank Statements", "GET", "bank-statements", 200)
        if success:
            print(f"   Found {len(response)} bank statements")
        return success

    def test_get_transactions(self):
        """Test get transactions for statement"""
        if not self.created_ids['statement']:
            print("❌ Skipping - No statement created")
            return False
            
        success, response = self.run_test("Get Transactions", "GET", f"bank-statements/{self.created_ids['statement']}/transactions", 200)
        if success:
            print(f"   Found {len(response)} transactions")
            if response:
                print(f"   First transaction: {response[0]['description']}")
        return success

    def test_export_statement(self):
        """Test export statement to Excel"""
        if not self.created_ids['statement']:
            print("❌ Skipping - No statement created")
            return False
            
        success, _ = self.run_test("Export Statement", "GET", f"bank-statements/{self.created_ids['statement']}/export", 200)
        return success

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete statement
        if self.created_ids['statement']:
            self.run_test("Delete Statement", "DELETE", f"bank-statements/{self.created_ids['statement']}", 200)
            
        # Delete classification rules
        for rule_id in self.created_ids['rules']:
            self.run_test("Delete Rule", "DELETE", f"classification-rules/{rule_id}", 200)
            
        # Delete account items
        for account_id in self.created_ids['accounts']:
            self.run_test("Delete Account", "DELETE", f"account-items/{account_id}", 200)
            
        # Delete chart
        if self.created_ids['chart']:
            self.run_test("Delete Chart", "DELETE", f"chart-of-accounts/{self.created_ids['chart']}", 200)
            
        # Delete company
        if self.created_ids['company']:
            self.run_test("Delete Company", "DELETE", f"companies/{self.created_ids['company']}", 200)

def main():
    print("🚀 Starting Agente Contábil API Tests")
    print("=" * 50)
    
    tester = AgenteContabilAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_create_company,
        tester.test_get_companies,
        tester.test_create_chart_of_accounts,
        tester.test_get_charts,
        tester.test_create_account_items,
        tester.test_get_account_items,
        tester.test_create_classification_rule,
        tester.test_get_classification_rules,
        tester.test_bank_statement_upload,
        tester.test_get_bank_statements,
        tester.test_get_transactions,
        tester.test_export_statement
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())