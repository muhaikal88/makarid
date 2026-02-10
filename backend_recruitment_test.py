import requests
import sys
import json
from datetime import datetime

class RecruitmentAPITester:
    def __init__(self, base_url="https://email-notify-fix-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.super_admin_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.luckycell_company_id = None
        self.job_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, require_auth=True, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if require_auth and token:
            headers['Authorization'] = f'Bearer {token}'

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
                    print(f"   Response: {response.text[:300]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_super_admin_login(self):
        """Test super admin login"""
        success, response = self.run_test(
            "Super Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "superadmin@luckycell.co.id", "password": "admin123"},
            require_auth=False
        )
        if success and 'token' in response:
            self.super_admin_token = response['token']
            print(f"   🔑 Super Admin Token obtained")
            return True
        return False

    def test_admin_login(self):
        """Test company admin login"""
        success, response = self.run_test(
            "Company Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@luckycell.co.id", "password": "admin123"},
            require_auth=False
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   🔑 Admin Token obtained")
            return True
        return False

    def test_public_company_profile(self, domain="luckycell.co.id"):
        """Test public company profile API"""
        success, response = self.run_test(
            f"Public Company Profile - {domain}",
            "GET",
            f"public/company/{domain}",
            200,
            require_auth=False
        )
        if success:
            print(f"   🏢 Company: {response.get('name')}")
            print(f"   📝 Vision: {response.get('vision', 'Not set')}")
            print(f"   🎯 Mission: {response.get('mission', 'Not set')}")
            self.luckycell_company_id = response.get('id')
        return success

    def test_public_careers_jobs(self, domain="luckycell.co.id"):
        """Test public careers jobs API"""
        success, response = self.run_test(
            f"Public Careers Jobs - {domain}",
            "GET",
            f"public/careers/{domain}/jobs",
            200,
            require_auth=False
        )
        if success:
            jobs = response.get('jobs', [])
            company = response.get('company', {})
            print(f"   🏢 Company: {company.get('name')}")
            print(f"   💼 Available Jobs: {len(jobs)}")
            
            # Store job IDs for later testing
            self.job_ids = [job.get('id') for job in jobs]
            
            for job in jobs[:3]:  # Show first 3 jobs
                print(f"     - {job.get('title')} ({job.get('job_type')})")
        return success

    def test_public_job_detail(self, domain="luckycell.co.id"):
        """Test public job detail API"""
        if not self.job_ids:
            print("❌ No job IDs available for testing")
            return False
        
        job_id = self.job_ids[0]  # Test first job
        success, response = self.run_test(
            f"Public Job Detail - {job_id}",
            "GET",
            f"public/careers/{domain}/jobs/{job_id}",
            200,
            require_auth=False
        )
        if success:
            job = response.get('job', {})
            form_fields = response.get('form_fields', [])
            print(f"   💼 Job: {job.get('title')}")
            print(f"   📝 Description: {job.get('description', '')[:100]}...")
            print(f"   📋 Form Fields: {len(form_fields)} fields")
            
            for field in form_fields[:3]:  # Show first 3 fields
                print(f"     - {field.get('field_label')} ({field.get('field_type')})")
        return success

    def test_admin_jobs_list(self):
        """Test admin jobs list API"""
        if not self.admin_token:
            print("❌ Admin token not available")
            return False
            
        success, response = self.run_test(
            "Admin Jobs List",
            "GET",
            "jobs",
            200,
            token=self.admin_token
        )
        if success:
            print(f"   💼 Total Jobs: {len(response)}")
            for job in response[:3]:  # Show first 3 jobs
                print(f"     - {job.get('title')} (Status: {job.get('status')})")
        return success

    def test_admin_applications_list(self):
        """Test admin applications list API"""
        if not self.admin_token:
            print("❌ Admin token not available")
            return False
            
        success, response = self.run_test(
            "Admin Applications List",
            "GET",
            "applications",
            200,
            token=self.admin_token
        )
        if success:
            print(f"   📄 Total Applications: {len(response)}")
            for app in response[:3]:  # Show first 3 applications
                print(f"     - {app.get('applicant_name')} for {app.get('job_title')} (Status: {app.get('status')})")
        return success

    def test_create_job_posting(self):
        """Test creating a new job posting"""
        if not self.admin_token:
            print("❌ Admin token not available")
            return False
        
        job_data = {
            "title": f"Test Position {datetime.now().strftime('%H%M%S')}",
            "department": "Engineering",
            "location": "Jakarta",
            "job_type": "full_time",
            "description": "This is a test job posting for recruitment system testing",
            "requirements": ["Bachelor's degree", "2+ years experience", "Team player"],
            "responsibilities": ["Develop software", "Write tests", "Code reviews"],
            "salary_min": 8000000,
            "salary_max": 12000000,
            "show_salary": True,
            "status": "published"
        }
        
        success, response = self.run_test(
            "Create Job Posting",
            "POST",
            "jobs",
            200,
            data=job_data,
            token=self.admin_token
        )
        if success:
            print(f"   💼 Created Job: {response.get('title')} (ID: {response.get('id')})")
            self.job_ids.append(response.get('id'))
        return success

    def test_submit_application(self, domain="luckycell.co.id"):
        """Test submitting a job application"""
        if not self.job_ids:
            print("❌ No job IDs available for testing application")
            return False
        
        job_id = self.job_ids[0]  # Use first available job
        
        # First test multipart form data endpoint
        url = f"{self.base_url}/api/public/apply"
        
        form_data = {
            "full_name": f"Test Applicant {datetime.now().strftime('%H%M%S')}",
            "email": f"testapplicant{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "+62812345678",
            "experience": "3 years in software development"
        }
        
        # Create multipart form data
        files = {
            'job_id': (None, job_id),
            'form_data': (None, json.dumps(form_data))
        }
        
        self.tests_run += 1
        print(f"\n🔍 Testing Submit Job Application...")
        print(f"   URL: {url}")
        
        try:
            response = requests.post(url, files=files)
            print(f"   Status: {response.status_code}")
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed")
                response_data = response.json()
                print(f"   📄 Application ID: {response_data.get('id')}")
                return True
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                if response.text:
                    print(f"   Response: {response.text[:300]}")
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_form_fields(self):
        """Test form fields API"""
        if not self.admin_token:
            print("❌ Admin token not available")
            return False
            
        success, response = self.run_test(
            "Get Form Fields",
            "GET",
            "form-fields",
            200,
            token=self.admin_token
        )
        if success:
            print(f"   📋 Form Fields: {len(response)}")
            for field in response[:3]:  # Show first 3 fields
                required = "Required" if field.get('is_required') else "Optional"
                print(f"     - {field.get('field_label')} ({field.get('field_type')}) - {required}")
        return success

    def run_all_tests(self):
        """Run all recruitment tests"""
        print("🚀 Starting Recruitment System API Tests")
        print("=" * 60)
        
        test_results = {}
        
        # Authentication tests
        test_results['super_admin_login'] = self.test_super_admin_login()
        test_results['admin_login'] = self.test_admin_login()
        
        # Public API tests
        test_results['public_company_profile'] = self.test_public_company_profile()
        test_results['public_careers_jobs'] = self.test_public_careers_jobs()
        test_results['public_job_detail'] = self.test_public_job_detail()
        
        # Application submission test
        test_results['submit_application'] = self.test_submit_application()
        
        # Admin API tests
        test_results['admin_jobs_list'] = self.test_admin_jobs_list()
        test_results['admin_applications_list'] = self.test_admin_applications_list()
        test_results['form_fields'] = self.test_form_fields()
        
        # Create new job posting test
        test_results['create_job_posting'] = self.test_create_job_posting()
        
        print("\n" + "=" * 60)
        print(f"📊 Final Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        
        # Show failed tests
        failed_tests = [test for test, success in test_results.items() if not success]
        if failed_tests:
            print(f"\n❌ Failed Tests: {', '.join(failed_tests)}")
            return False
        else:
            print("\n✅ All recruitment tests passed!")
            return True

def main():
    tester = RecruitmentAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())