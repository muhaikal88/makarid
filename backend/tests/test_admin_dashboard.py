"""
Admin Dashboard Backend API Tests
Tests for Company Admin login flow and dashboard APIs (jobs, applications)
Credentials: admin@demo.co.id / admin123
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCompanyAdminAuth:
    """Test Company Admin authentication flow"""
    
    def test_unified_login(self):
        """Test POST /api/auth/unified-login"""
        response = requests.post(f"{BASE_URL}/api/auth/unified-login", json={
            "email": "admin@demo.co.id",
            "password": "admin123"
        })
        print(f"Unified login status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "access_list" in data
        assert len(data["access_list"]) > 0, "Expected at least one access item"
        assert data["user_email"] == "admin@demo.co.id"
        
        # Store access info for next test
        access = data["access_list"][0]
        assert "company_id" in access
        assert "role" in access
        assert access["role"] == "admin"
        
        return data
    
    def test_select_company(self):
        """Test POST /api/auth/select-company"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/unified-login", json={
            "email": "admin@demo.co.id",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        
        access = login_response.json()["access_list"][0]
        
        # Select company
        session = requests.Session()
        select_response = session.post(f"{BASE_URL}/api/auth/select-company", json={
            "company_id": access["company_id"],
            "role": access["role"],
            "user_table": access["user_table"],
            "user_id": access["user_id"]
        })
        
        print(f"Select company status: {select_response.status_code}")
        print(f"Response: {select_response.json()}")
        print(f"Cookies: {session.cookies.get_dict()}")
        
        assert select_response.status_code == 200, f"Expected 200, got {select_response.status_code}"
        
        data = select_response.json()
        assert "session_token" in data
        assert data["role"] == "admin"
        assert "company_name" in data
        
        return session, data
    
    def test_me_session(self):
        """Test GET /api/auth/me-session"""
        session = self._get_authenticated_session()
        
        response = session.get(f"{BASE_URL}/api/auth/me-session")
        print(f"Me session status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["role"] == "admin"
        assert "company_id" in data
        assert "company_slug" in data
    
    def _get_authenticated_session(self):
        """Helper to get authenticated session"""
        login_response = requests.post(f"{BASE_URL}/api/auth/unified-login", json={
            "email": "admin@demo.co.id",
            "password": "admin123"
        })
        access = login_response.json()["access_list"][0]
        
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/select-company", json={
            "company_id": access["company_id"],
            "role": access["role"],
            "user_table": access["user_table"],
            "user_id": access["user_id"]
        })
        return session


class TestJobsSessionAPI:
    """Test Jobs API with session auth"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.session = self._get_authenticated_session()
    
    def _get_authenticated_session(self):
        login_response = requests.post(f"{BASE_URL}/api/auth/unified-login", json={
            "email": "admin@demo.co.id",
            "password": "admin123"
        })
        access = login_response.json()["access_list"][0]
        
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/select-company", json={
            "company_id": access["company_id"],
            "role": access["role"],
            "user_table": access["user_table"],
            "user_id": access["user_id"]
        })
        return session
    
    def test_get_jobs(self):
        """Test GET /api/jobs-session"""
        response = self.session.get(f"{BASE_URL}/api/jobs-session")
        print(f"Get jobs status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Expected list of jobs"
        print(f"Number of jobs: {len(data)}")
        
        # Validate job structure
        if len(data) > 0:
            job = data[0]
            assert "id" in job
            assert "title" in job
            assert "status" in job
    
    def test_create_job(self):
        """Test POST /api/jobs-session"""
        job_data = {
            "title": "TEST_QA Engineer",
            "department": "QA",
            "location": "Jakarta",
            "job_type": "full_time",
            "description": "Test job description for QA",
            "requirements": ["Python", "Selenium"],
            "responsibilities": ["Write tests", "Run tests"],
            "salary_min": 5000000,
            "salary_max": 10000000,
            "show_salary": True,
            "status": "draft"
        }
        
        response = self.session.post(f"{BASE_URL}/api/jobs-session", json=job_data)
        print(f"Create job status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}"
        
        data = response.json()
        assert data["title"] == job_data["title"]
        assert "id" in data
        
        # Store for cleanup
        self.created_job_id = data["id"]
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/jobs-session/{data['id']}")
    
    def test_update_job(self):
        """Test PUT /api/jobs-session/{job_id}"""
        # First create a job
        job_data = {
            "title": "TEST_Job to Update",
            "department": "Engineering",
            "location": "Bandung",
            "job_type": "contract",
            "description": "Original description",
            "status": "draft"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/jobs-session", json=job_data)
        assert create_response.status_code in [200, 201]
        job_id = create_response.json()["id"]
        
        # Update job
        update_data = {
            "title": "TEST_Updated Job Title",
            "department": "Engineering",
            "location": "Surabaya",
            "job_type": "full_time",
            "description": "Updated description",
            "status": "published"
        }
        
        update_response = self.session.put(f"{BASE_URL}/api/jobs-session/{job_id}", json=update_data)
        print(f"Update job status: {update_response.status_code}")
        print(f"Response: {update_response.json()}")
        
        assert update_response.status_code == 200
        
        updated = update_response.json()
        assert updated["title"] == update_data["title"]
        assert updated["location"] == update_data["location"]
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/jobs-session/{job_id}")
    
    def test_delete_job(self):
        """Test DELETE /api/jobs-session/{job_id}"""
        # Create job to delete
        job_data = {
            "title": "TEST_Job to Delete",
            "department": "HR",
            "location": "Medan",
            "job_type": "part_time",
            "description": "This job will be deleted",
            "status": "draft"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/jobs-session", json=job_data)
        assert create_response.status_code in [200, 201]
        job_id = create_response.json()["id"]
        
        # Delete job
        delete_response = self.session.delete(f"{BASE_URL}/api/jobs-session/{job_id}")
        print(f"Delete job status: {delete_response.status_code}")
        
        assert delete_response.status_code in [200, 204]
        
        # Verify deletion
        get_response = self.session.get(f"{BASE_URL}/api/jobs-session")
        jobs = get_response.json()
        job_ids = [j["id"] for j in jobs]
        assert job_id not in job_ids, "Job should be deleted"


class TestApplicationsSessionAPI:
    """Test Applications API with session auth"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup authenticated session"""
        self.session = self._get_authenticated_session()
    
    def _get_authenticated_session(self):
        login_response = requests.post(f"{BASE_URL}/api/auth/unified-login", json={
            "email": "admin@demo.co.id",
            "password": "admin123"
        })
        access = login_response.json()["access_list"][0]
        
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/select-company", json={
            "company_id": access["company_id"],
            "role": access["role"],
            "user_table": access["user_table"],
            "user_id": access["user_id"]
        })
        return session
    
    def test_get_applications(self):
        """Test GET /api/applications-session"""
        response = self.session.get(f"{BASE_URL}/api/applications-session")
        print(f"Get applications status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Expected list of applications"
        print(f"Number of applications: {len(data)}")
        
        # Validate application structure
        if len(data) > 0:
            app = data[0]
            assert "id" in app
            assert "applicant_name" in app
            assert "applicant_email" in app
            assert "job_title" in app
            assert "status" in app
            
            # Store app id for next tests
            self.existing_app_id = app["id"]
    
    def test_get_application_detail(self):
        """Test GET /api/applications-session/{app_id}"""
        # First get list of applications
        list_response = self.session.get(f"{BASE_URL}/api/applications-session")
        assert list_response.status_code == 200
        
        apps = list_response.json()
        if len(apps) == 0:
            pytest.skip("No applications to test detail view")
        
        app_id = apps[0]["id"]
        
        # Get detail
        response = self.session.get(f"{BASE_URL}/api/applications-session/{app_id}")
        print(f"Get application detail status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == app_id
        assert "form_data" in data
        assert "job_title" in data
    
    def test_update_application_status(self):
        """Test PUT /api/applications-session/{app_id}/status"""
        # First get list of applications
        list_response = self.session.get(f"{BASE_URL}/api/applications-session")
        assert list_response.status_code == 200
        
        apps = list_response.json()
        if len(apps) == 0:
            pytest.skip("No applications to test status update")
        
        app_id = apps[0]["id"]
        original_status = apps[0]["status"]
        
        # Update status
        new_status = "reviewed" if original_status == "pending" else "pending"
        
        response = self.session.put(f"{BASE_URL}/api/applications-session/{app_id}/status?status={new_status}")
        print(f"Update application status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200
        
        # Verify status was updated
        verify_response = self.session.get(f"{BASE_URL}/api/applications-session/{app_id}")
        assert verify_response.status_code == 200
        assert verify_response.json()["status"] == new_status
        
        # Restore original status
        self.session.put(f"{BASE_URL}/api/applications-session/{app_id}/status?status={original_status}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
