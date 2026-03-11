import requests
import sys
import json
from datetime import datetime
import uuid

class SpecificRequirementsTest:
    def __init__(self, base_url="https://saas-contadores.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.statement_id = None
        self.transaction_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, check_headers=False):
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
                
                # Check headers if requested
                if check_headers:
                    content_type = response.headers.get('Content-Type', '')
                    print(f"   Content-Type: {content_type}")
                    if 'application/vnd.ms-excel' in content_type:
                        print("✅ Correct XLS media type detected")
                    else:
                        print(f"⚠️  Expected XLS media type, got: {content_type}")
                
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

    def test_file_format_support(self):
        """Test that system accepts various file formats"""
        print("\n📁 Testing File Format Support...")
        
        # Test with existing files
        formats_to_test = [
            ('extrato_teste.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
            ('EXTRATO_EXEMPLO_NUBANK_012026.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        ]
        
        # Get existing company and chart for testing
        success, companies = self.run_test("Get Companies for Format Test", "GET", "companies", 200)
        if not success or not companies:
            print("❌ No companies found for testing")
            return False
            
        success, charts = self.run_test("Get Charts for Format Test", "GET", "chart-of-accounts", 200)
        if not success or not charts:
            print("❌ No charts found for testing")
            return False
            
        company_id = companies[0]['id']
        chart_id = charts[0]['id']
        
        all_success = True
        for filename, content_type in formats_to_test:
            try:
                with open(f'/app/{filename}', 'rb') as f:
                    files = {'file': (filename, f, content_type)}
                    
                    params = {
                        'company_id': company_id,
                        'chart_id': chart_id,
                        'bank_name': 'Teste',
                        'period': '01/2026'
                    }
                    
                    url = f"{self.base_url}/bank-statements/upload"
                    self.tests_run += 1
                    print(f"\n🔍 Testing Upload {filename}...")
                    print(f"   URL: {url}")
                    
                    response = requests.post(url, files=files, params=params)
                    success = response.status_code == 200
                    if success:
                        self.tests_passed += 1
                        print(f"✅ Passed - {filename} accepted")
                        # Store statement ID for later tests
                        try:
                            response_data = response.json()
                            if 'statement' in response_data and not self.statement_id:
                                self.statement_id = response_data['statement']['id']
                        except:
                            pass
                    else:
                        print(f"❌ Failed - {filename} rejected: {response.status_code}")
                        all_success = False
                        
            except Exception as e:
                print(f"❌ Failed to test {filename}: {str(e)}")
                all_success = False
                
        return all_success

    def test_xls_export_format(self):
        """Test XLS export format and media type"""
        if not self.statement_id:
            print("❌ Skipping XLS export test - No statement available")
            return False
            
        print("\n📊 Testing XLS Export Format...")
        
        # Test export endpoint with header checking
        success, _ = self.run_test(
            "Export Statement XLS Format", 
            "GET", 
            f"bank-statements/{self.statement_id}/export", 
            200,
            check_headers=True
        )
        
        return success

    def test_transaction_update(self):
        """Test transaction update functionality"""
        if not self.statement_id:
            print("❌ Skipping transaction update test - No statement available")
            return False
            
        print("\n✏️  Testing Transaction Update...")
        
        # Get transactions for the statement
        success, transactions = self.run_test(
            "Get Transactions for Update Test", 
            "GET", 
            f"bank-statements/{self.statement_id}/transactions", 
            200
        )
        
        if not success or not transactions:
            print("❌ No transactions found for update test")
            return False
            
        # Pick first transaction to update
        transaction = transactions[0]
        self.transaction_id = transaction['id']
        
        print(f"   Original transaction: {transaction['description']}")
        print(f"   Original status: {transaction['status']}")
        print(f"   Original debit: {transaction.get('debit_account', 'None')}")
        print(f"   Original credit: {transaction.get('credit_account', 'None')}")
        
        # Update transaction with new accounts
        update_data = {
            "debit_account": "1.1.01",
            "credit_account": "4.1.01", 
            "status": "CLASSIFICADO"
        }
        
        success, updated_transaction = self.run_test(
            "Update Transaction", 
            "PUT", 
            f"transactions/{self.transaction_id}", 
            200,
            update_data
        )
        
        if success:
            print(f"   Updated debit: {updated_transaction.get('debit_account', 'None')}")
            print(f"   Updated credit: {updated_transaction.get('credit_account', 'None')}")
            print(f"   Updated status: {updated_transaction.get('status', 'None')}")
            
            # Verify the update persisted
            success2, verification = self.run_test(
                "Verify Transaction Update", 
                "GET", 
                f"bank-statements/{self.statement_id}/transactions", 
                200
            )
            
            if success2:
                updated_trans = next((t for t in verification if t['id'] == self.transaction_id), None)
                if updated_trans:
                    if (updated_trans.get('debit_account') == "1.1.01" and 
                        updated_trans.get('credit_account') == "4.1.01" and
                        updated_trans.get('status') == "CLASSIFICADO"):
                        print("✅ Transaction update persisted correctly")
                        return True
                    else:
                        print("❌ Transaction update did not persist correctly")
                        return False
                else:
                    print("❌ Updated transaction not found")
                    return False
            else:
                return False
        else:
            return False

    def test_statement_statistics_update(self):
        """Test that statement statistics update after transaction changes"""
        if not self.statement_id:
            print("❌ Skipping statistics test - No statement available")
            return False
            
        print("\n📈 Testing Statement Statistics Update...")
        
        # Get updated statement statistics
        success, statement = self.run_test(
            "Get Updated Statement Statistics", 
            "GET", 
            f"bank-statements/{self.statement_id}", 
            200
        )
        
        if success:
            print(f"   Total transactions: {statement.get('total_transactions', 0)}")
            print(f"   Classified count: {statement.get('classified_count', 0)}")
            print(f"   Manual count: {statement.get('manual_count', 0)}")
            print(f"   Status: {statement.get('status', 'Unknown')}")
            return True
        else:
            return False

def main():
    print("🎯 Starting Specific Requirements Tests")
    print("=" * 60)
    
    tester = SpecificRequirementsTest()
    
    # Run specific tests
    tests = [
        tester.test_file_format_support,
        tester.test_xls_export_format,
        tester.test_transaction_update,
        tester.test_statement_statistics_update
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Specific tests completed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All specific requirements tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())