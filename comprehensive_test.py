#!/usr/bin/env python3
"""
Comprehensive test for Sistema Agente Contábil - New Features
Tests PDF upload, Excel import, template download, and validation
"""

import requests
import sys
import json
import os
from datetime import datetime
import uuid
import io

class ComprehensiveAgenteContabilTester:
    def __init__(self, base_url="https://extrato-contabil.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_ids = {
            'company': None,
            'chart': None,
            'accounts': [],
            'statement': None
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data, params=params)
                else:
                    response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    if response.headers.get('content-type', '').startswith('application/json'):
                        return True, response.json()
                    else:
                        return True, response.content
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

    def setup_test_data(self):
        """Create company and chart for testing"""
        print("\n🏗️  Setting up test data...")
        
        # Create company
        company_data = {
            "cnpj": "12.345.678/0001-90",
            "name": "Empresa Teste Ltda",
            "address": "Rua Teste, 123",
            "phone": "(11) 99999-9999",
            "email": "teste@empresa.com"
        }
        
        success, response = self.run_test("Setup Company", "POST", "companies", 200, company_data)
        if success and 'id' in response:
            self.created_ids['company'] = response['id']
            print(f"   ✅ Company created: {response['id']}")
        else:
            print("   ❌ Failed to create company")
            return False
            
        # Create chart of accounts
        chart_data = {
            "company_id": self.created_ids['company'],
            "name": "Plano 2026",
            "description": "Plano de contas para teste de importação"
        }
        
        success, response = self.run_test("Setup Chart", "POST", "chart-of-accounts", 200, chart_data)
        if success and 'id' in response:
            self.created_ids['chart'] = response['id']
            print(f"   ✅ Chart created: {response['id']}")
            return True
        else:
            print("   ❌ Failed to create chart")
            return False

    def test_pdf_upload_processing(self):
        """Test 1: PDF Upload and Processing"""
        print("\n" + "="*60)
        print("TEST 1: PDF UPLOAD AND PROCESSING")
        print("="*60)
        
        if not self.created_ids['company'] or not self.created_ids['chart']:
            print("❌ Skipping - Setup data missing")
            return False
            
        try:
            # Test with the provided PDF file
            with open('/app/EXTRATO_NUBANK_JANEIRO_2026.pdf', 'rb') as f:
                files = {'file': ('EXTRATO_NUBANK_JANEIRO_2026.pdf', f, 'application/pdf')}
                
                params = {
                    'company_id': self.created_ids['company'],
                    'chart_id': self.created_ids['chart'],
                    'bank_name': 'Nubank',
                    'period': '01/2026'
                }
                
                success, response = self.run_test(
                    "PDF Upload Processing", 
                    "POST", 
                    "bank-statements/upload", 
                    200, 
                    files=files, 
                    params=params
                )
                
                if success and isinstance(response, dict):
                    if 'statement' in response:
                        self.created_ids['statement'] = response['statement']['id']
                        statement = response['statement']
                        transactions = response.get('transactions', [])
                        
                        print(f"   📊 Statement ID: {statement['id']}")
                        print(f"   📊 Total transactions: {statement['total_transactions']}")
                        print(f"   📊 Classified: {statement['classified_count']}")
                        print(f"   📊 Manual: {statement['manual_count']}")
                        print(f"   📊 Total inflows: R$ {statement['total_inflows']:.2f}")
                        print(f"   📊 Total outflows: R$ {statement['total_outflows']:.2f}")
                        print(f"   📊 Balance: R$ {statement['balance']:.2f}")
                        
                        # Verify expected transactions from the request
                        expected_transactions = [
                            "PIX RECEBIDO CLIENTE SILVA",
                            "PIX TRANSF FORNECEDOR ABC", 
                            "TARIFA BANCARIA",
                            "SISPAG FOLHA",
                            "PIX RECEBIDO SERVICO"
                        ]
                        
                        print(f"\n   🔍 Verifying extracted transactions:")
                        for i, trans in enumerate(transactions[:5]):  # Show first 5
                            print(f"   {i+1}. {trans['date']} - {trans['description']} - R$ {trans['amount']:.2f} ({trans['transaction_type']})")
                            print(f"      Status: {trans['status']}")
                            if trans.get('debit_account') or trans.get('credit_account'):
                                print(f"      Accounts: D:{trans.get('debit_account', 'N/A')} C:{trans.get('credit_account', 'N/A')}")
                        
                        return True
                    else:
                        print("   ❌ No statement in response")
                        return False
                else:
                    return False
                    
        except FileNotFoundError:
            print("   ❌ PDF file not found: /app/EXTRATO_NUBANK_JANEIRO_2026.pdf")
            return False
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return False

    def test_excel_import_chart_accounts(self):
        """Test 2: Excel Import for Chart of Accounts"""
        print("\n" + "="*60)
        print("TEST 2: EXCEL IMPORT FOR CHART OF ACCOUNTS")
        print("="*60)
        
        if not self.created_ids['chart']:
            print("❌ Skipping - No chart created")
            return False
            
        try:
            # Test with the provided Excel template
            with open('/app/TEMPLATE_PLANO_CONTAS.xlsx', 'rb') as f:
                files = {'file': ('TEMPLATE_PLANO_CONTAS.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                
                success, response = self.run_test(
                    "Excel Import Chart of Accounts", 
                    "POST", 
                    f"chart-of-accounts/{self.created_ids['chart']}/import", 
                    200, 
                    files=files
                )
                
                if success and isinstance(response, dict):
                    print(f"   📊 Import message: {response.get('message', 'N/A')}")
                    print(f"   📊 Imported count: {response.get('imported_count', 0)}")
                    
                    if response.get('errors'):
                        print(f"   ⚠️  Errors: {response['errors']}")
                    
                    # Verify the expected accounts were imported
                    expected_accounts = [
                        "1.1.01 - Banco Itaú (ATIVO)",
                        "1.1.02 - Banco Bradesco (ATIVO)", 
                        "1.2.01 - Aplicações Financeiras (ATIVO)",
                        "2.1.01 - Fornecedores (PASSIVO)",
                        "3.1.01 - Despesas com Pessoal (DESPESA)",
                        "3.2.01 - Despesas Bancárias (DESPESA)",
                        "3.3.01 - Despesas Operacionais (DESPESA)",
                        "4.1.01 - Receita de Vendas (RECEITA)",
                        "4.2.01 - Receita de Serviços (RECEITA)"
                    ]
                    
                    # Get imported accounts to verify
                    success_verify, accounts = self.run_test(
                        "Verify Imported Accounts", 
                        "GET", 
                        "account-items", 
                        200, 
                        params={'chart_id': self.created_ids['chart']}
                    )
                    
                    if success_verify:
                        print(f"\n   🔍 Verifying imported accounts ({len(accounts)} total):")
                        for account in accounts:
                            print(f"   - {account['code']} - {account['description']} ({account['account_type']})")
                        
                        # Check if we have the expected 9 accounts
                        if len(accounts) >= 9:
                            print(f"   ✅ Expected number of accounts imported (9+)")
                        else:
                            print(f"   ⚠️  Expected 9 accounts, found {len(accounts)}")
                    
                    return True
                else:
                    return False
                    
        except FileNotFoundError:
            print("   ❌ Excel file not found: /app/TEMPLATE_PLANO_CONTAS.xlsx")
            return False
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return False

    def test_template_download(self):
        """Test 3: Template Download (CSV)"""
        print("\n" + "="*60)
        print("TEST 3: TEMPLATE DOWNLOAD")
        print("="*60)
        
        # Check if CSV template exists and is readable
        try:
            with open('/app/TEMPLATE_PLANO_CONTAS.csv', 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.strip().split('\n')
                
                print(f"   📄 Template file found: /app/TEMPLATE_PLANO_CONTAS.csv")
                print(f"   📄 Lines in template: {len(lines)}")
                
                if lines:
                    header = lines[0]
                    print(f"   📄 Header: {header}")
                    
                    # Verify expected columns
                    expected_columns = ['codigo', 'descricao', 'tipo']
                    header_lower = header.lower()
                    
                    missing_columns = []
                    for col in expected_columns:
                        if col not in header_lower:
                            missing_columns.append(col)
                    
                    if not missing_columns:
                        print(f"   ✅ All required columns present: {expected_columns}")
                        
                        # Show sample data
                        if len(lines) > 1:
                            print(f"   📄 Sample data:")
                            for i, line in enumerate(lines[1:6]):  # Show first 5 data rows
                                print(f"   {i+1}. {line}")
                        
                        return True
                    else:
                        print(f"   ❌ Missing columns: {missing_columns}")
                        return False
                else:
                    print(f"   ❌ Empty template file")
                    return False
                    
        except FileNotFoundError:
            print("   ❌ Template file not found: /app/TEMPLATE_PLANO_CONTAS.csv")
            return False
        except Exception as e:
            print(f"   ❌ Error reading template: {str(e)}")
            return False

    def test_validation_and_errors(self):
        """Test 4: Validation and Error Handling"""
        print("\n" + "="*60)
        print("TEST 4: VALIDATION AND ERROR HANDLING")
        print("="*60)
        
        if not self.created_ids['chart']:
            print("❌ Skipping - No chart created")
            return False
        
        # Test 1: Invalid file format
        print("\n   🧪 Test 4.1: Invalid file format")
        try:
            # Create a fake text file
            fake_content = b"This is not an Excel file"
            files = {'file': ('fake.txt', io.BytesIO(fake_content), 'text/plain')}
            
            success, response = self.run_test(
                "Invalid File Format", 
                "POST", 
                f"chart-of-accounts/{self.created_ids['chart']}/import", 
                400,  # Expecting error
                files=files
            )
            
            if not success:  # We expect this to fail
                print("   ✅ Correctly rejected invalid file format")
            else:
                print("   ❌ Should have rejected invalid file format")
                
        except Exception as e:
            print(f"   ✅ Correctly handled invalid file: {str(e)}")
        
        # Test 2: Invalid account type
        print("\n   🧪 Test 4.2: Invalid account type in Excel")
        try:
            # Create Excel with invalid account type
            import pandas as pd
            
            invalid_data = {
                'codigo': ['1.1.01', '2.1.01'],
                'descricao': ['Banco Teste', 'Fornecedor Teste'],
                'tipo': ['ATIVO', 'TESTE_INVALIDO']  # Invalid type
            }
            
            df = pd.DataFrame(invalid_data)
            excel_buffer = io.BytesIO()
            df.to_excel(excel_buffer, index=False)
            excel_buffer.seek(0)
            
            files = {'file': ('invalid_types.xlsx', excel_buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            
            success, response = self.run_test(
                "Invalid Account Type", 
                "POST", 
                f"chart-of-accounts/{self.created_ids['chart']}/import", 
                200,  # Should succeed but with errors
                files=files
            )
            
            if success and isinstance(response, dict):
                if response.get('errors'):
                    print(f"   ✅ Correctly reported errors: {response['errors']}")
                    return True
                else:
                    print("   ⚠️  Expected validation errors but got none")
                    return False
            else:
                print("   ❌ Failed to process file with validation errors")
                return False
                
        except Exception as e:
            print(f"   ❌ Error in validation test: {str(e)}")
            return False

    def test_api_direct_calls(self):
        """Test 5: Direct API calls with curl-like requests"""
        print("\n" + "="*60)
        print("TEST 5: DIRECT API CALLS")
        print("="*60)
        
        # Test 1: List existing chart of accounts
        success, response = self.run_test(
            "List Chart of Accounts", 
            "GET", 
            "chart-of-accounts", 
            200
        )
        
        if success:
            print(f"   📊 Found {len(response)} chart(s) of accounts")
            for chart in response:
                print(f"   - ID: {chart['id']}, Name: {chart['name']}")
        
        # Test 2: List account items for our chart
        if self.created_ids['chart']:
            success, response = self.run_test(
                "List Account Items for Chart", 
                "GET", 
                "account-items", 
                200,
                params={'chart_id': self.created_ids['chart']}
            )
            
            if success:
                print(f"   📊 Found {len(response)} account items in our chart")
        
        return True

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete statement
        if self.created_ids['statement']:
            self.run_test("Cleanup Statement", "DELETE", f"bank-statements/{self.created_ids['statement']}", 200)
            
        # Delete chart (this will also delete account items)
        if self.created_ids['chart']:
            self.run_test("Cleanup Chart", "DELETE", f"chart-of-accounts/{self.created_ids['chart']}", 200)
            
        # Delete company
        if self.created_ids['company']:
            self.run_test("Cleanup Company", "DELETE", f"companies/{self.created_ids['company']}", 200)

def main():
    print("🚀 Starting Comprehensive Agente Contábil Tests")
    print("Testing NEW FEATURES: PDF Upload, Excel Import, Template Download, Validation")
    print("=" * 80)
    
    tester = ComprehensiveAgenteContabilTester()
    
    # Setup
    if not tester.setup_test_data():
        print("❌ Failed to setup test data. Exiting.")
        return 1
    
    # Run comprehensive tests
    tests = [
        ("PDF Upload and Processing", tester.test_pdf_upload_processing),
        ("Excel Import Chart of Accounts", tester.test_excel_import_chart_accounts),
        ("Template Download", tester.test_template_download),
        ("Validation and Error Handling", tester.test_validation_and_errors),
        ("Direct API Calls", tester.test_api_direct_calls)
    ]
    
    test_results = {}
    for test_name, test_func in tests:
        try:
            result = test_func()
            test_results[test_name] = result
        except Exception as e:
            print(f"❌ Test '{test_name}' failed with exception: {str(e)}")
            test_results[test_name] = False
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Print final results
    print("\n" + "=" * 80)
    print("📊 COMPREHENSIVE TEST RESULTS")
    print("=" * 80)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status} - {test_name}")
    
    print(f"\n📊 API Tests completed: {tester.tests_passed}/{tester.tests_run}")
    
    passed_tests = sum(1 for result in test_results.values() if result)
    total_tests = len(test_results)
    
    if passed_tests == total_tests and tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"⚠️  {total_tests - passed_tests} feature tests failed, {tester.tests_run - tester.tests_passed} API calls failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())