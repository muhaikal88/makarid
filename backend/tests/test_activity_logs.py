"""
Test Activity Log Feature for Company Admin Dashboard
Tests the GET /api/logs/me endpoint and activity logging on various admin actions.

Test credentials:
- Company Admin: admin@lucky.com / Admin@2026! (company: PT. LUCKY PERDANA MULTIMEDIA)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials for Lucky company admin
COMPANY_ADMIN_EMAIL = "admin@lucky.com"
COMPANY_ADMIN_PASSWORD = "Admin@2026!"
COMPANY_NAME = "PT. LUCKY PERDANA MULTIMEDIA"


class TestActivityLogEndpoint:
    """Test GET /api/logs/me endpoint with various filters and pagination"""
    
    session = requests.Session()
    
    @classmethod
    def setup_class(cls):
        """Login as company admin before running tests"""
        # Step 1: Unified login
        login_response = cls.session.post(
            f"{BASE_URL}/api/auth/unified-login",
            json={"email": COMPANY_ADMIN_EMAIL, "password": COMPANY_ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        login_data = login_response.json()
        assert "access_list" in login_data, "No access_list in login response"
        assert len(login_data["access_list"]) > 0, "Empty access_list"
        
        # Find PT. LUCKY PERDANA MULTIMEDIA company
        company_access = None
        for access in login_data["access_list"]:
            if COMPANY_NAME in access["company_name"]:
                company_access = access
                break
        
        assert company_access is not None, f"Company '{COMPANY_NAME}' not found in access_list"
        
        # Step 2: Select company to get session cookie
        select_response = cls.session.post(
            f"{BASE_URL}/api/auth/select-company",
            json={
                "company_id": company_access["company_id"],
                "role": company_access["role"],
                "user_table": company_access["user_table"],
                "user_id": company_access["user_id"]
            }
        )
        assert select_response.status_code == 200, f"Company selection failed: {select_response.text}"
        
        session_data = select_response.json()
        cls.company_id = session_data["company_id"]
        cls.user_name = session_data["name"]
        print(f"✓ Logged in as {cls.user_name} to {session_data['company_name']}")
    
    def test_01_logs_endpoint_returns_correct_format(self):
        """Test that /api/logs/me returns {logs, total, skip, limit} format"""
        response = self.session.get(f"{BASE_URL}/api/logs/me")
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        
        data = response.json()
        
        # Verify response format
        assert "logs" in data, "Missing 'logs' in response"
        assert "total" in data, "Missing 'total' in response"
        assert "skip" in data, "Missing 'skip' in response"
        assert "limit" in data, "Missing 'limit' in response"
        
        assert isinstance(data["logs"], list), "'logs' should be a list"
        assert isinstance(data["total"], int), "'total' should be an integer"
        assert isinstance(data["skip"], int), "'skip' should be an integer"
        assert isinstance(data["limit"], int), "'limit' should be an integer"
        
        print(f"✓ Response format correct: {data['total']} logs found")
    
    def test_02_logs_have_correct_fields(self):
        """Test that each log entry has required fields"""
        response = self.session.get(f"{BASE_URL}/api/logs/me")
        assert response.status_code == 200
        
        data = response.json()
        
        if len(data["logs"]) > 0:
            log = data["logs"][0]
            required_fields = ["id", "user_id", "user_name", "user_email", "user_role", 
                            "action", "resource_type", "description", "timestamp"]
            
            for field in required_fields:
                assert field in log, f"Missing field '{field}' in log entry"
            
            print(f"✓ Log entry has all required fields: {list(log.keys())}")
        else:
            print("⚠ No logs found yet - will be created by subsequent tests")
    
    def test_03_pagination_default_limit_50(self):
        """Test that default limit is 50"""
        response = self.session.get(f"{BASE_URL}/api/logs/me")
        assert response.status_code == 200
        
        data = response.json()
        assert data["limit"] == 50, f"Default limit should be 50, got {data['limit']}"
        assert data["skip"] == 0, f"Default skip should be 0, got {data['skip']}"
        
        print(f"✓ Pagination defaults correct: skip={data['skip']}, limit={data['limit']}")
    
    def test_04_pagination_with_custom_skip_limit(self):
        """Test pagination with custom skip and limit"""
        response = self.session.get(f"{BASE_URL}/api/logs/me?skip=5&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["skip"] == 5, f"Skip should be 5, got {data['skip']}"
        assert data["limit"] == 10, f"Limit should be 10, got {data['limit']}"
        
        print(f"✓ Custom pagination working: skip={data['skip']}, limit={data['limit']}")
    
    def test_05_action_filter(self):
        """Test filtering by action type"""
        response = self.session.get(f"{BASE_URL}/api/logs/me?action=login")
        assert response.status_code == 200
        
        data = response.json()
        
        # All returned logs should have action="login"
        for log in data["logs"]:
            assert log["action"] == "login", f"Expected action='login', got '{log['action']}'"
        
        print(f"✓ Action filter working: {len(data['logs'])} login logs found")
    
    def test_06_resource_type_filter(self):
        """Test filtering by resource type"""
        response = self.session.get(f"{BASE_URL}/api/logs/me?resource_type=auth")
        assert response.status_code == 200
        
        data = response.json()
        
        # All returned logs should have resource_type="auth"
        for log in data["logs"]:
            assert log["resource_type"] == "auth", f"Expected resource_type='auth', got '{log['resource_type']}'"
        
        print(f"✓ Resource type filter working: {len(data['logs'])} auth logs found")
    
    def test_07_search_filter(self):
        """Test search filter across user_name, user_email, description"""
        # Search for the logged-in admin's name
        response = self.session.get(f"{BASE_URL}/api/logs/me?search={COMPANY_ADMIN_EMAIL}")
        assert response.status_code == 200
        
        data = response.json()
        
        # Search results should contain the search term
        for log in data["logs"]:
            search_match = (
                COMPANY_ADMIN_EMAIL.lower() in log["user_email"].lower() or
                COMPANY_ADMIN_EMAIL.lower() in log["user_name"].lower() or
                COMPANY_ADMIN_EMAIL.lower() in log["description"].lower()
            )
            assert search_match, f"Search result doesn't match: {log}"
        
        print(f"✓ Search filter working: {len(data['logs'])} results for '{COMPANY_ADMIN_EMAIL}'")
    
    def test_08_date_range_filter(self):
        """Test date range filter"""
        # Filter for logs from today
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = self.session.get(f"{BASE_URL}/api/logs/me?start_date={today}")
        assert response.status_code == 200
        
        data = response.json()
        
        # All returned logs should be from today or later
        for log in data["logs"]:
            log_date = log["timestamp"][:10]  # Extract YYYY-MM-DD
            assert log_date >= today, f"Log date {log_date} is before start_date {today}"
        
        print(f"✓ Date range filter working: {len(data['logs'])} logs from {today}")
    
    def test_09_combined_filters(self):
        """Test multiple filters together"""
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = self.session.get(
            f"{BASE_URL}/api/logs/me?action=login&resource_type=auth&start_date={today}&limit=10"
        )
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify all filters applied
        assert data["limit"] == 10
        for log in data["logs"]:
            assert log["action"] == "login"
            assert log["resource_type"] == "auth"
        
        print(f"✓ Combined filters working: {len(data['logs'])} results")


class TestActivityLoggingOnActions:
    """Test that activity logs are created when admin performs actions"""
    
    session = requests.Session()
    created_job_id = None
    
    @classmethod
    def setup_class(cls):
        """Login as company admin"""
        # Unified login
        login_response = cls.session.post(
            f"{BASE_URL}/api/auth/unified-login",
            json={"email": COMPANY_ADMIN_EMAIL, "password": COMPANY_ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        
        login_data = login_response.json()
        company_access = None
        for access in login_data["access_list"]:
            if COMPANY_NAME in access["company_name"]:
                company_access = access
                break
        
        assert company_access is not None
        
        # Select company
        select_response = cls.session.post(
            f"{BASE_URL}/api/auth/select-company",
            json={
                "company_id": company_access["company_id"],
                "role": company_access["role"],
                "user_table": company_access["user_table"],
                "user_id": company_access["user_id"]
            }
        )
        assert select_response.status_code == 200
        cls.company_id = company_access["company_id"]
        print(f"✓ Logged in for action tests")
    
    def test_10_login_creates_activity_log(self):
        """Test that login action creates activity log (already logged in during setup)"""
        # The login we did in setup should have created a log
        response = self.session.get(f"{BASE_URL}/api/logs/me?action=login&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have at least 1 login log
        assert data["total"] >= 1, "No login activity logs found"
        
        # Check the latest login log
        login_log = data["logs"][0]
        assert login_log["action"] == "login"
        assert login_log["resource_type"] == "auth"
        assert "login" in login_log["description"].lower() or "sebagai" in login_log["description"].lower()
        
        print(f"✓ Login activity logged: {login_log['description']}")
    
    def test_11_job_create_logs_activity(self):
        """Test that creating a job creates activity log"""
        # Get initial log count
        logs_before = self.session.get(f"{BASE_URL}/api/logs/me?resource_type=job").json()
        initial_count = logs_before["total"]
        
        # Create a test job
        job_data = {
            "title": "TEST_Activity Log Test Job",
            "department": "IT",
            "location": "Jakarta",
            "job_type": "full_time",
            "description": "Test job for activity log verification",
            "status": "draft"
        }
        
        create_response = self.session.post(f"{BASE_URL}/api/jobs-session", json=job_data)
        assert create_response.status_code == 200, f"Job creation failed: {create_response.text}"
        
        created_job = create_response.json()
        TestActivityLoggingOnActions.created_job_id = created_job["id"]
        
        # Check activity log was created
        logs_after = self.session.get(f"{BASE_URL}/api/logs/me?resource_type=job").json()
        assert logs_after["total"] > initial_count, "No new job activity log created"
        
        # Verify the latest log is for job creation
        latest_log = logs_after["logs"][0]
        assert latest_log["action"] == "create"
        assert latest_log["resource_type"] == "job"
        assert "TEST_Activity Log Test Job" in latest_log["description"]
        
        print(f"✓ Job create activity logged: {latest_log['description']}")
    
    def test_12_job_update_logs_activity(self):
        """Test that updating a job creates activity log"""
        if not self.created_job_id:
            pytest.skip("No job created to update")
        
        # Update the job
        update_data = {"title": "TEST_Updated Activity Log Test Job", "status": "published"}
        update_response = self.session.put(
            f"{BASE_URL}/api/jobs-session/{self.created_job_id}",
            json=update_data
        )
        assert update_response.status_code == 200, f"Job update failed: {update_response.text}"
        
        # Check activity log
        logs = self.session.get(f"{BASE_URL}/api/logs/me?action=update&resource_type=job&limit=1").json()
        assert len(logs["logs"]) > 0, "No job update log found"
        
        latest_log = logs["logs"][0]
        assert latest_log["action"] == "update"
        assert latest_log["resource_id"] == self.created_job_id
        
        print(f"✓ Job update activity logged: {latest_log['description']}")
    
    def test_13_job_delete_logs_activity(self):
        """Test that deleting a job creates activity log"""
        if not self.created_job_id:
            pytest.skip("No job created to delete")
        
        # Delete the job
        delete_response = self.session.delete(f"{BASE_URL}/api/jobs-session/{self.created_job_id}")
        assert delete_response.status_code == 200, f"Job deletion failed: {delete_response.text}"
        
        # Check activity log
        logs = self.session.get(f"{BASE_URL}/api/logs/me?action=delete&resource_type=job&limit=1").json()
        assert len(logs["logs"]) > 0, "No job delete log found"
        
        latest_log = logs["logs"][0]
        assert latest_log["action"] == "delete"
        assert latest_log["resource_type"] == "job"
        
        print(f"✓ Job delete activity logged: {latest_log['description']}")
        
        # Reset created_job_id
        TestActivityLoggingOnActions.created_job_id = None


class TestUnauthorizedAccess:
    """Test that unauthenticated requests are rejected"""
    
    def test_14_logs_without_auth_returns_401(self):
        """Test that /api/logs/me requires authentication"""
        session = requests.Session()  # New session without auth
        response = session.get(f"{BASE_URL}/api/logs/me")
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print(f"✓ Unauthorized access correctly rejected with 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
