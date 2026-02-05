import requests
import sys
import json
from datetime import datetime

class HRSystemAPITester:
    def __init__(self, base_url="https://hr-saas-mvp.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_company_id = None
        self.created_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, require_auth=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if require_auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "", 200, require_auth=False)

    def test_api_health(self):
        """Test API health endpoint"""
        return self.run_test("API Health Check", "GET", "health", 200, require_auth=False)

    def test_login(self, email="superadmin@luckycell.co.id", password="admin123"):
        """Test login and get token"""
        success, response = self.run_test(
            "Super Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password},
            require_auth=False
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   🔑 Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_me(self):
        """Test get current user info"""
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        if success:
            print(f"   👤 User: {response.get('name')} ({response.get('role')})")
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats"""
        success, response = self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)
        if success:
            print(f"   📊 Companies: {response.get('total_companies', 0)}, Users: {response.get('total_users', 0)}")
        return success

    def test_get_companies(self):
        """Test get companies list"""
        success, response = self.run_test("Get Companies", "GET", "companies", 200)
        if success:
            print(f"   🏢 Found {len(response)} companies")
        return success

    def test_create_company(self):
        """Test create company"""
        company_data = {
            "name": f"Test Company {datetime.now().strftime('%H%M%S')}",
            "domain": f"test{datetime.now().strftime('%H%M%S')}.com",
            "address": "Test Address 123",
            "phone": "+62-21-123456",
            "email": "test@testcompany.com",
            "logo_url": "https://example.com/logo.png",
            "is_active": True
        }
        success, response = self.run_test("Create Company", "POST", "companies", 200, data=company_data)
        if success and 'id' in response:
            self.created_company_id = response['id']
            print(f"   🏢 Created company ID: {self.created_company_id}")
        return success

    def test_get_company(self):
        """Test get specific company"""
        if not self.created_company_id:
            print("❌ No company ID available for testing")
            return False
        return self.run_test("Get Company", "GET", f"companies/{self.created_company_id}", 200)[0]

    def test_update_company(self):
        """Test update company"""
        if not self.created_company_id:
            print("❌ No company ID available for testing")
            return False
        
        update_data = {
            "name": "Updated Test Company",
            "address": "Updated Address 456"
        }
        return self.run_test("Update Company", "PUT", f"companies/{self.created_company_id}", 200, data=update_data)[0]

    def test_get_users(self):
        """Test get users list"""
        success, response = self.run_test("Get Users", "GET", "users", 200)
        if success:
            print(f"   👥 Found {len(response)} users")
        return success

    def test_create_user(self):
        """Test create user"""
        user_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"testuser{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "testpass123",
            "role": "admin",
            "company_id": self.created_company_id,
            "is_active": True
        }
        success, response = self.run_test("Create User", "POST", "users", 200, data=user_data)
        if success and 'id' in response:
            self.created_user_id = response['id']
            print(f"   👤 Created user ID: {self.created_user_id}")
        return success

    def test_update_user(self):
        """Test update user"""
        if not self.created_user_id:
            print("❌ No user ID available for testing")
            return False
        
        update_data = {
            "name": "Updated Test User"
        }
        return self.run_test("Update User", "PUT", f"users/{self.created_user_id}", 200, data=update_data)[0]

    def test_delete_user(self):
        """Test delete user"""
        if not self.created_user_id:
            print("❌ No user ID available for testing")
            return False
        return self.run_test("Delete User", "DELETE", f"users/{self.created_user_id}", 200)[0]

    def test_delete_company(self):
        """Test delete company"""
        if not self.created_company_id:
            print("❌ No company ID available for testing")
            return False
        return self.run_test("Delete Company", "DELETE", f"companies/{self.created_company_id}", 200)[0]

def main():
    print("🚀 Starting HR System API Tests")
    print("=" * 50)
    
    tester = HRSystemAPITester()
    
    # Test sequence
    test_results = {}
    
    # Health checks
    test_results['health_check'] = tester.test_health_check()
    test_results['api_health'] = tester.test_api_health()
    
    # Authentication
    login_success = tester.test_login()
    test_results['login'] = login_success
    
    if not login_success:
        print("\n❌ Login failed - stopping tests")
        print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
        return 1
    
    # Authenticated endpoints
    test_results['get_me'] = tester.test_get_me()
    test_results['dashboard_stats'] = tester.test_dashboard_stats()
    
    # Companies CRUD
    test_results['get_companies'] = tester.test_get_companies()
    test_results['create_company'] = tester.test_create_company()
    test_results['get_company'] = tester.test_get_company()
    test_results['update_company'] = tester.test_update_company()
    
    # Users CRUD
    test_results['get_users'] = tester.test_get_users()
    test_results['create_user'] = tester.test_create_user()
    test_results['update_user'] = tester.test_update_user()
    
    # Cleanup
    test_results['delete_user'] = tester.test_delete_user()
    test_results['delete_company'] = tester.test_delete_company()
    
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    # Show failed tests
    failed_tests = [test for test, success in test_results.items() if not success]
    if failed_tests:
        print(f"\n❌ Failed Tests: {', '.join(failed_tests)}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())