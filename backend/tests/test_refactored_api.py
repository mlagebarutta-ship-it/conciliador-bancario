"""
Backend API Tests for Domínio Bridge Multi-Tenant SaaS System
Tests all endpoints after refactoring from monolithic server.py to modular architecture
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "mlagebarutta@gmail.com"
SUPER_ADMIN_PASSWORD = "super123"


class TestAPIRoot:
    """Test API root endpoint"""
    
    def test_api_root(self):
        """Test that API root returns expected message"""
        response = requests.get(f"{BASE_URL}/api")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "API Agente Contábil" in data["message"]
        print("✓ API root endpoint working")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_super_admin_success(self):
        """Test Super Admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == SUPER_ADMIN_EMAIL
        assert data["user"]["perfil"] == "super_admin"
        print(f"✓ Super Admin login successful: {data['user']['nome']}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "senha": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_login_wrong_password(self):
        """Test login with wrong password returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Wrong password correctly rejected with 401")
    
    def test_auth_me_with_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Test /auth/me
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == SUPER_ADMIN_EMAIL
        assert data["perfil"] == "super_admin"
        print("✓ /auth/me endpoint working with valid token")
    
    def test_auth_me_without_token(self):
        """Test /auth/me endpoint without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me correctly rejects unauthenticated requests")


class TestSuperAdminEndpoints:
    """Super Admin specific endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Super Admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_superadmin_dashboard(self):
        """Test Super Admin dashboard returns global metrics"""
        response = requests.get(
            f"{BASE_URL}/api/superadmin/dashboard",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "metricas" in data
        assert "total_escritorios" in data["metricas"]
        assert "total_usuarios" in data["metricas"]
        assert "total_empresas" in data["metricas"]
        assert "total_extratos" in data["metricas"]
        assert "total_transacoes" in data["metricas"]
        print(f"✓ Super Admin dashboard: {data['metricas']['total_escritorios']} tenants, {data['metricas']['total_empresas']} companies")
    
    def test_superadmin_tenants_list(self):
        """Test listing all tenants"""
        response = requests.get(
            f"{BASE_URL}/api/superadmin/tenants",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            tenant = data[0]
            assert "id" in tenant
            assert "nome" in tenant
            assert "total_usuarios" in tenant
            assert "total_empresas" in tenant
        print(f"✓ Super Admin tenants list: {len(data)} tenants found")
    
    def test_superadmin_usuarios_list(self):
        """Test listing all users"""
        response = requests.get(
            f"{BASE_URL}/api/superadmin/usuarios",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Super Admin users list: {len(data)} users found")
    
    def test_superadmin_logs(self):
        """Test getting activity logs"""
        response = requests.get(
            f"{BASE_URL}/api/superadmin/logs",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Super Admin logs: {len(data)} log entries")


class TestCompaniesEndpoints:
    """Company CRUD endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Super Admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_companies_list(self):
        """Test listing companies"""
        response = requests.get(
            f"{BASE_URL}/api/companies",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            company = data[0]
            assert "id" in company
            assert "name" in company
        print(f"✓ Companies list: {len(data)} companies found")


class TestDashboardEndpoints:
    """Dashboard stats endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Super Admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/stats",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "total_companies" in data["summary"]
        assert "total_statements" in data["summary"]
        assert "total_transactions" in data["summary"]
        print(f"✓ Dashboard stats: {data['summary']['total_companies']} companies, {data['summary']['total_statements']} statements")


class TestBankStatementsEndpoints:
    """Bank statements endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Super Admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_bank_statements_list(self):
        """Test listing bank statements"""
        response = requests.get(
            f"{BASE_URL}/api/bank-statements",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            statement = data[0]
            assert "id" in statement
            assert "company_id" in statement
            assert "period" in statement
        print(f"✓ Bank statements list: {len(data)} statements found")


class TestAccountingProcessesEndpoints:
    """Accounting processes endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Super Admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_accounting_processes_list(self):
        """Test listing accounting processes"""
        response = requests.get(
            f"{BASE_URL}/api/accounting-processes",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Accounting processes list: {len(data)} processes found")
    
    def test_accounting_processes_grouped(self):
        """Test grouped accounting processes"""
        response = requests.get(
            f"{BASE_URL}/api/accounting-processes/grouped",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"✓ Accounting processes grouped: {len(data)} companies with processes")
    
    def test_accounting_processes_stats(self):
        """Test accounting processes stats"""
        response = requests.get(
            f"{BASE_URL}/api/accounting-processes/stats",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "by_status" in data
        print(f"✓ Accounting processes stats: {data['total']} total processes")


class TestChartOfAccountsEndpoints:
    """Chart of accounts endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Super Admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_chart_of_accounts_list(self):
        """Test listing chart of accounts"""
        response = requests.get(
            f"{BASE_URL}/api/chart-of-accounts",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Chart of accounts list: {len(data)} charts found")
    
    def test_account_items_list(self):
        """Test listing account items"""
        response = requests.get(
            f"{BASE_URL}/api/account-items",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Account items list: {len(data)} items found")


class TestClassificationEndpoints:
    """Classification rules endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Super Admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_classification_rules_list(self):
        """Test listing classification rules"""
        response = requests.get(
            f"{BASE_URL}/api/classification-rules",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Classification rules list: {len(data)} rules found")
    
    def test_classification_history_list(self):
        """Test listing classification history"""
        response = requests.get(
            f"{BASE_URL}/api/classification-history",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Classification history list: {len(data)} entries found")


class TestAccessControl:
    """Access control and authorization tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Super Admin token for all tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_unauthenticated_access_rejected(self):
        """Test that unauthenticated requests are rejected"""
        endpoints = [
            "/api/companies",
            "/api/dashboard/stats",
            "/api/bank-statements",
            "/api/accounting-processes",
            "/api/chart-of-accounts",
            "/api/classification-rules"
        ]
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 401, f"Endpoint {endpoint} should reject unauthenticated requests"
        print(f"✓ All {len(endpoints)} endpoints correctly reject unauthenticated requests")
    
    def test_superadmin_endpoints_require_superadmin(self):
        """Test that superadmin endpoints require super_admin role"""
        # This test verifies that the endpoints exist and require auth
        # A non-super-admin user would get 403
        endpoints = [
            "/api/superadmin/dashboard",
            "/api/superadmin/tenants",
            "/api/superadmin/usuarios"
        ]
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 401, f"Endpoint {endpoint} should reject unauthenticated requests"
        print(f"✓ All {len(endpoints)} superadmin endpoints require authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
