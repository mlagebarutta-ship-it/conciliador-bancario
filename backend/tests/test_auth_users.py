"""
Backend tests for Authentication and User Management APIs
Tests: Login, JWT token, User CRUD, Company linking, Activity logs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@dominio.com"
ADMIN_PASSWORD = "admin123"
COLABORADOR_EMAIL = "joao@contabilidade.com"
COLABORADOR_PASSWORD = "joao123"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_admin_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["perfil"] == "administrador"
        assert len(data["token"]) > 0
    
    def test_login_invalid_email(self):
        """Test login with invalid email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@email.com",
            "senha": "anypassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_login_invalid_password(self):
        """Test login with invalid password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "senha": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_get_me_with_valid_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get user info
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["perfil"] == "administrador"
        assert "id" in data
        assert "nome" in data
    
    def test_get_me_without_token(self):
        """Test /auth/me endpoint without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]


class TestUserManagement:
    """User CRUD tests - Admin only"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture
    def auth_headers(self, admin_token):
        """Get headers with admin token"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_list_users_as_admin(self, auth_headers):
        """Test listing users as admin"""
        response = requests.get(f"{BASE_URL}/api/usuarios", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # Should have at least the admin user
        assert len(data) >= 1
        
        # Check user structure
        for user in data:
            assert "id" in user
            assert "nome" in user
            assert "email" in user
            assert "perfil" in user
            assert "status" in user
            # Password should not be returned
            assert "senha" not in user
    
    def test_list_users_without_auth(self):
        """Test listing users without authentication"""
        response = requests.get(f"{BASE_URL}/api/usuarios")
        assert response.status_code in [401, 403]
    
    def test_create_user_and_verify(self, auth_headers):
        """Test creating a new user and verify persistence"""
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "nome": f"TEST_User_{unique_id}",
            "email": f"test_{unique_id}@teste.com",
            "senha": "teste123",
            "perfil": "colaborador"
        }
        
        # Create user
        create_response = requests.post(
            f"{BASE_URL}/api/usuarios",
            json=user_data,
            headers=auth_headers
        )
        assert create_response.status_code == 200
        
        created_user = create_response.json()
        assert created_user["nome"] == user_data["nome"]
        assert created_user["email"] == user_data["email"]
        assert created_user["perfil"] == user_data["perfil"]
        assert created_user["status"] == "ativo"
        assert "id" in created_user
        
        user_id = created_user["id"]
        
        # Verify user was persisted by fetching it
        get_response = requests.get(
            f"{BASE_URL}/api/usuarios/{user_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        
        fetched_user = get_response.json()
        assert fetched_user["nome"] == user_data["nome"]
        assert fetched_user["email"] == user_data["email"]
        
        # Cleanup - delete test user
        requests.delete(f"{BASE_URL}/api/usuarios/{user_id}", headers=auth_headers)
    
    def test_create_user_duplicate_email(self, auth_headers):
        """Test creating user with duplicate email"""
        # Try to create user with admin email
        response = requests.post(
            f"{BASE_URL}/api/usuarios",
            json={
                "nome": "Duplicate User",
                "email": ADMIN_EMAIL,
                "senha": "teste123",
                "perfil": "colaborador"
            },
            headers=auth_headers
        )
        assert response.status_code == 400
        assert "já cadastrado" in response.json()["detail"].lower()
    
    def test_update_user(self, auth_headers):
        """Test updating a user"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create user first
        create_response = requests.post(
            f"{BASE_URL}/api/usuarios",
            json={
                "nome": f"TEST_Update_{unique_id}",
                "email": f"update_{unique_id}@teste.com",
                "senha": "teste123",
                "perfil": "colaborador"
            },
            headers=auth_headers
        )
        user_id = create_response.json()["id"]
        
        # Update user
        update_response = requests.put(
            f"{BASE_URL}/api/usuarios/{user_id}",
            json={"nome": f"TEST_Updated_{unique_id}", "status": "inativo"},
            headers=auth_headers
        )
        assert update_response.status_code == 200
        
        updated_user = update_response.json()
        assert updated_user["nome"] == f"TEST_Updated_{unique_id}"
        assert updated_user["status"] == "inativo"
        
        # Verify persistence
        get_response = requests.get(
            f"{BASE_URL}/api/usuarios/{user_id}",
            headers=auth_headers
        )
        assert get_response.json()["nome"] == f"TEST_Updated_{unique_id}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/usuarios/{user_id}", headers=auth_headers)
    
    def test_toggle_user_status(self, auth_headers):
        """Test activating/deactivating user"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create user
        create_response = requests.post(
            f"{BASE_URL}/api/usuarios",
            json={
                "nome": f"TEST_Status_{unique_id}",
                "email": f"status_{unique_id}@teste.com",
                "senha": "teste123",
                "perfil": "colaborador"
            },
            headers=auth_headers
        )
        user_id = create_response.json()["id"]
        
        # Deactivate user
        response = requests.put(
            f"{BASE_URL}/api/usuarios/{user_id}",
            json={"status": "inativo"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "inativo"
        
        # Reactivate user
        response = requests.put(
            f"{BASE_URL}/api/usuarios/{user_id}",
            json={"status": "ativo"},
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ativo"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/usuarios/{user_id}", headers=auth_headers)
    
    def test_delete_user(self, auth_headers):
        """Test deleting a user"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create user
        create_response = requests.post(
            f"{BASE_URL}/api/usuarios",
            json={
                "nome": f"TEST_Delete_{unique_id}",
                "email": f"delete_{unique_id}@teste.com",
                "senha": "teste123",
                "perfil": "colaborador"
            },
            headers=auth_headers
        )
        user_id = create_response.json()["id"]
        
        # Delete user
        delete_response = requests.delete(
            f"{BASE_URL}/api/usuarios/{user_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200
        
        # Verify user no longer exists
        get_response = requests.get(
            f"{BASE_URL}/api/usuarios/{user_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404


class TestUserCompanyLink:
    """Tests for linking companies to users"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture
    def auth_headers(self, admin_token):
        """Get headers with admin token"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    @pytest.fixture
    def test_user(self, auth_headers):
        """Create a test user for company linking tests"""
        unique_id = str(uuid.uuid4())[:8]
        response = requests.post(
            f"{BASE_URL}/api/usuarios",
            json={
                "nome": f"TEST_Link_{unique_id}",
                "email": f"link_{unique_id}@teste.com",
                "senha": "teste123",
                "perfil": "colaborador"
            },
            headers=auth_headers
        )
        user = response.json()
        yield user
        # Cleanup
        requests.delete(f"{BASE_URL}/api/usuarios/{user['id']}", headers=auth_headers)
    
    def test_get_user_companies_empty(self, auth_headers, test_user):
        """Test getting companies for user with no links"""
        response = requests.get(
            f"{BASE_URL}/api/usuarios/{test_user['id']}/empresas",
            headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json() == []
    
    def test_link_company_to_user(self, auth_headers, test_user):
        """Test linking a company to a user"""
        # First get a company
        companies_response = requests.get(
            f"{BASE_URL}/api/companies",
            headers=auth_headers
        )
        
        if companies_response.status_code != 200 or len(companies_response.json()) == 0:
            pytest.skip("No companies available for testing")
        
        company = companies_response.json()[0]
        
        # Link company to user
        link_response = requests.post(
            f"{BASE_URL}/api/usuarios/{test_user['id']}/empresas?empresa_id={company['id']}",
            headers=auth_headers
        )
        assert link_response.status_code == 200
        
        # Verify link
        user_companies = requests.get(
            f"{BASE_URL}/api/usuarios/{test_user['id']}/empresas",
            headers=auth_headers
        )
        assert user_companies.status_code == 200
        
        linked_ids = [c['id'] for c in user_companies.json()]
        assert company['id'] in linked_ids
    
    def test_unlink_company_from_user(self, auth_headers, test_user):
        """Test unlinking a company from a user"""
        # Get a company
        companies_response = requests.get(
            f"{BASE_URL}/api/companies",
            headers=auth_headers
        )
        
        if companies_response.status_code != 200 or len(companies_response.json()) == 0:
            pytest.skip("No companies available for testing")
        
        company = companies_response.json()[0]
        
        # Link company first
        requests.post(
            f"{BASE_URL}/api/usuarios/{test_user['id']}/empresas?empresa_id={company['id']}",
            headers=auth_headers
        )
        
        # Unlink company
        unlink_response = requests.delete(
            f"{BASE_URL}/api/usuarios/{test_user['id']}/empresas/{company['id']}",
            headers=auth_headers
        )
        assert unlink_response.status_code == 200
        
        # Verify unlink
        user_companies = requests.get(
            f"{BASE_URL}/api/usuarios/{test_user['id']}/empresas",
            headers=auth_headers
        )
        linked_ids = [c['id'] for c in user_companies.json()]
        assert company['id'] not in linked_ids


class TestActivityLogs:
    """Tests for activity logs"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture
    def auth_headers(self, admin_token):
        """Get headers with admin token"""
        return {"Authorization": f"Bearer {admin_token}"}
    
    def test_get_activity_logs(self, auth_headers):
        """Test getting activity logs"""
        response = requests.get(
            f"{BASE_URL}/api/activity-logs",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Check log structure if there are logs
        if len(data) > 0:
            log = data[0]
            assert "usuario_id" in log
            assert "usuario_nome" in log
            assert "acao" in log
            assert "data_hora" in log
    
    def test_get_activity_logs_with_limit(self, auth_headers):
        """Test getting activity logs with limit"""
        response = requests.get(
            f"{BASE_URL}/api/activity-logs?limit=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) <= 10
    
    def test_activity_logs_without_auth(self):
        """Test getting activity logs without authentication"""
        response = requests.get(f"{BASE_URL}/api/activity-logs")
        assert response.status_code in [401, 403]
    
    def test_login_creates_activity_log(self, auth_headers):
        """Test that login creates an activity log entry"""
        # Get logs before login
        before_response = requests.get(
            f"{BASE_URL}/api/activity-logs?limit=50",
            headers=auth_headers
        )
        before_logs = before_response.json()
        
        # Perform a login
        requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_PASSWORD
        })
        
        # Get logs after login
        after_response = requests.get(
            f"{BASE_URL}/api/activity-logs?limit=50",
            headers=auth_headers
        )
        after_logs = after_response.json()
        
        # Should have at least one more log
        assert len(after_logs) >= len(before_logs)
        
        # Check if login log exists
        login_logs = [l for l in after_logs if "Login" in l.get("acao", "")]
        assert len(login_logs) > 0


class TestRoleBasedAccess:
    """Tests for role-based access control"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "senha": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture
    def colaborador_token(self, admin_token):
        """Get or create colaborador token"""
        # Try to login as colaborador
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": COLABORADOR_EMAIL,
            "senha": COLABORADOR_PASSWORD
        })
        
        if response.status_code == 200:
            return response.json()["token"]
        
        # If colaborador doesn't exist, create one
        unique_id = str(uuid.uuid4())[:8]
        create_response = requests.post(
            f"{BASE_URL}/api/usuarios",
            json={
                "nome": f"TEST_Colaborador_{unique_id}",
                "email": f"colab_{unique_id}@teste.com",
                "senha": "colab123",
                "perfil": "colaborador"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        if create_response.status_code == 200:
            # Login with new colaborador
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": f"colab_{unique_id}@teste.com",
                "senha": "colab123"
            })
            if login_response.status_code == 200:
                return login_response.json()["token"]
        
        pytest.skip("Could not create colaborador for testing")
    
    def test_colaborador_cannot_list_users(self, colaborador_token):
        """Test that colaborador cannot access user list"""
        response = requests.get(
            f"{BASE_URL}/api/usuarios",
            headers={"Authorization": f"Bearer {colaborador_token}"}
        )
        assert response.status_code == 403
    
    def test_colaborador_cannot_create_user(self, colaborador_token):
        """Test that colaborador cannot create users"""
        response = requests.post(
            f"{BASE_URL}/api/usuarios",
            json={
                "nome": "Unauthorized User",
                "email": "unauthorized@teste.com",
                "senha": "teste123",
                "perfil": "colaborador"
            },
            headers={"Authorization": f"Bearer {colaborador_token}"}
        )
        assert response.status_code == 403
    
    def test_colaborador_cannot_access_activity_logs(self, colaborador_token):
        """Test that colaborador cannot access activity logs"""
        response = requests.get(
            f"{BASE_URL}/api/activity-logs",
            headers={"Authorization": f"Bearer {colaborador_token}"}
        )
        assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
