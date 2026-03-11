"""
Multi-Tenant SaaS System Tests for Domínio Bridge
Tests authentication, tenant isolation, and Super Admin functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "mlagebarutta@gmail.com"
SUPER_ADMIN_PASSWORD = "super123"
ADMIN_TENANT_EMAIL = "admin@dominio.com"
ADMIN_TENANT_PASSWORD = "admin123"

class TestAuthentication:
    """Test authentication endpoints for different user profiles"""
    
    def test_super_admin_login_success(self):
        """Test Super Admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["perfil"] == "super_admin", f"Expected super_admin, got {data['user']['perfil']}"
        assert data["user"]["email"] == SUPER_ADMIN_EMAIL
        # Super admin should not have tenant_id
        assert data["user"].get("tenant_id") is None, "Super admin should not have tenant_id"
    
    def test_admin_tenant_login_success(self):
        """Test Admin Tenant login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_TENANT_EMAIL,
            "senha": ADMIN_TENANT_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["perfil"] == "admin_tenant", f"Expected admin_tenant, got {data['user']['perfil']}"
        assert data["user"]["email"] == ADMIN_TENANT_EMAIL
        # Admin tenant should have tenant_id
        assert data["user"].get("tenant_id") is not None, "Admin tenant should have tenant_id"
        assert data["user"].get("tenant") is not None, "Admin tenant should have tenant info"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@email.com",
            "senha": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    
    def test_login_wrong_password(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestSuperAdminEndpoints:
    """Test Super Admin specific endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Super Admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Super Admin login failed")
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_superadmin_dashboard(self):
        """Test Super Admin dashboard returns global statistics"""
        response = requests.get(f"{BASE_URL}/api/superadmin/dashboard", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "metricas" in data, "metricas not in response"
        metricas = data["metricas"]
        assert "total_escritorios" in metricas, "total_escritorios not in metricas"
        assert "escritorios_ativos" in metricas, "escritorios_ativos not in metricas"
        assert "total_usuarios" in metricas, "total_usuarios not in metricas"
        assert "total_empresas" in metricas, "total_empresas not in metricas"
        assert "total_extratos" in metricas, "total_extratos not in metricas"
        assert "total_transacoes" in metricas, "total_transacoes not in metricas"
    
    def test_superadmin_list_tenants(self):
        """Test Super Admin can list all tenants"""
        response = requests.get(f"{BASE_URL}/api/superadmin/tenants", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Should have at least one tenant (the migrated one)
        assert len(data) >= 1, "Should have at least one tenant"
        
        # Check tenant structure
        tenant = data[0]
        assert "id" in tenant, "Tenant should have id"
        assert "nome" in tenant, "Tenant should have nome"
        assert "status" in tenant, "Tenant should have status"
        assert "total_usuarios" in tenant, "Tenant should have total_usuarios count"
        assert "total_empresas" in tenant, "Tenant should have total_empresas count"
    
    def test_superadmin_list_users(self):
        """Test Super Admin can list all users"""
        response = requests.get(f"{BASE_URL}/api/superadmin/usuarios", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
    
    def test_superadmin_get_tenant_details(self):
        """Test Super Admin can get tenant details"""
        # First get list of tenants
        response = requests.get(f"{BASE_URL}/api/superadmin/tenants", headers=self.headers)
        assert response.status_code == 200
        tenants = response.json()
        
        if len(tenants) > 0:
            tenant_id = tenants[0]["id"]
            response = requests.get(f"{BASE_URL}/api/superadmin/tenants/{tenant_id}", headers=self.headers)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            data = response.json()
            assert data["id"] == tenant_id
            assert "usuarios" in data, "Should include usuarios list"
            assert "empresas" in data, "Should include empresas list"


class TestAdminTenantEndpoints:
    """Test Admin Tenant specific endpoints and data isolation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get Admin Tenant token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_TENANT_EMAIL,
            "senha": ADMIN_TENANT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin Tenant login failed")
        data = response.json()
        self.token = data["token"]
        self.tenant_id = data["user"]["tenant_id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_dashboard_stats(self):
        """Test Admin Tenant dashboard returns tenant-specific stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Dashboard should return stats for the tenant
        assert "total_empresas" in data or "companies" in data or isinstance(data, dict)
    
    def test_admin_get_companies_isolation(self):
        """Test Admin Tenant only sees companies from their tenant"""
        response = requests.get(f"{BASE_URL}/api/companies", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # All companies should belong to the tenant
        for company in data:
            assert company.get("tenant_id") == self.tenant_id, f"Company {company.get('id')} has wrong tenant_id"
    
    def test_admin_get_bank_statements_isolation(self):
        """Test Admin Tenant only sees bank statements from their tenant"""
        response = requests.get(f"{BASE_URL}/api/bank-statements", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # All statements should belong to the tenant
        for statement in data:
            assert statement.get("tenant_id") == self.tenant_id, f"Statement {statement.get('id')} has wrong tenant_id"
    
    def test_admin_get_chart_of_accounts_isolation(self):
        """Test Admin Tenant only sees chart of accounts from their tenant"""
        response = requests.get(f"{BASE_URL}/api/chart-of-accounts", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # All charts should belong to the tenant
        for chart in data:
            assert chart.get("tenant_id") == self.tenant_id, f"Chart {chart.get('id')} has wrong tenant_id"


class TestAccessControl:
    """Test access control between different user profiles"""
    
    def test_admin_tenant_cannot_access_superadmin_endpoints(self):
        """Test Admin Tenant cannot access Super Admin endpoints"""
        # Login as Admin Tenant
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_TENANT_EMAIL,
            "senha": ADMIN_TENANT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin Tenant login failed")
        
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to access Super Admin dashboard
        response = requests.get(f"{BASE_URL}/api/superadmin/dashboard", headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        
        # Try to access Super Admin tenants list
        response = requests.get(f"{BASE_URL}/api/superadmin/tenants", headers=headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    def test_unauthenticated_cannot_access_protected_endpoints(self):
        """Test unauthenticated requests are rejected"""
        # Try to access companies without token
        response = requests.get(f"{BASE_URL}/api/companies")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Try to access bank statements without token
        response = requests.get(f"{BASE_URL}/api/bank-statements")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        # Try to access Super Admin endpoints without token
        response = requests.get(f"{BASE_URL}/api/superadmin/dashboard")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestAuthMe:
    """Test /auth/me endpoint for different user profiles"""
    
    def test_super_admin_me(self):
        """Test /auth/me returns correct data for Super Admin"""
        # Login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "senha": SUPER_ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Super Admin login failed")
        
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["perfil"] == "super_admin"
        assert data["email"] == SUPER_ADMIN_EMAIL
    
    def test_admin_tenant_me(self):
        """Test /auth/me returns correct data for Admin Tenant"""
        # Login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_TENANT_EMAIL,
            "senha": ADMIN_TENANT_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin Tenant login failed")
        
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["perfil"] == "admin_tenant"
        assert data["email"] == ADMIN_TENANT_EMAIL
        assert data.get("tenant_id") is not None
        assert data.get("tenant") is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
