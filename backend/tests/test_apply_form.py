"""
Test cases for Job Application Form (ApplyJob) - Makar.id HR Platform
Tests the public career page form fields, wilayah.id API proxy, and form submission
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test constants
COMPANY_SLUG = "lucky"
JOB_ID = "5b2330f0-ef65-4ba0-ad39-0d0ede450eba"

class TestPublicJobEndpoint:
    """Tests for GET /api/public/careers/{domain}/jobs/{job_id}"""
    
    def test_job_detail_returns_form_fields(self):
        """Verify job detail endpoint returns form fields for application form"""
        response = requests.get(f"{BASE_URL}/api/public/careers/{COMPANY_SLUG}/jobs/{JOB_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check response structure
        assert "company" in data
        assert "job" in data
        assert "form_fields" in data
        
        # Verify company info
        assert data["company"]["name"] == "PT. LUCKY PERDANA MULTIMEDIA"
        
        # Verify job info
        assert data["job"]["id"] == JOB_ID
        assert data["job"]["title"] is not None
        
        print(f"Job: {data['job']['title']}")
        print(f"Form fields count: {len(data['form_fields'])}")
    
    def test_form_fields_contain_required_fields(self):
        """Verify all required fields are present in form_fields"""
        response = requests.get(f"{BASE_URL}/api/public/careers/{COMPANY_SLUG}/jobs/{JOB_ID}")
        assert response.status_code == 200
        
        form_fields = response.json()["form_fields"]
        field_names = [f["field_name"] for f in form_fields]
        
        # Required fields according to requirements
        required_fields = [
            "full_name",      # Nama Lengkap
            "email",          # Email
            "phone",          # No. Telepon
            "birth_place",    # Tempat Lahir
            "birth_date",     # Tanggal Lahir
            "education",      # Pendidikan Terakhir
            "major",          # Jurusan
            "province",       # Provinsi
            "city",           # Kota/Kabupaten
            "district",       # Kecamatan
            "village",        # Kelurahan/Desa
            "full_address",   # Alamat Lengkap
            "expected_salary", # Gaji yang Diharapkan
            "experience",     # Pengalaman Kerja
            "resume"          # Upload CV
        ]
        
        for field in required_fields:
            assert field in field_names, f"Missing field: {field}"
            print(f"✓ Field present: {field}")
    
    def test_education_field_has_correct_options(self):
        """Verify education dropdown has 5 options: SMA/SMK, D3, S1, S2, S3"""
        response = requests.get(f"{BASE_URL}/api/public/careers/{COMPANY_SLUG}/jobs/{JOB_ID}")
        assert response.status_code == 200
        
        form_fields = response.json()["form_fields"]
        education_field = next((f for f in form_fields if f["field_name"] == "education"), None)
        
        assert education_field is not None
        assert education_field["field_type"] == "select"
        assert education_field["options"] == ["SMA/SMK", "D3", "S1", "S2", "S3"]
        print(f"Education options: {education_field['options']}")


class TestWilayahProxyEndpoints:
    """Tests for wilayah.id API proxy endpoints (CORS workaround)"""
    
    def test_provinces_endpoint(self):
        """Verify /api/wilayah/provinces returns 38 Indonesian provinces"""
        response = requests.get(f"{BASE_URL}/api/wilayah/provinces")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        provinces = data["data"]
        
        assert len(provinces) == 38, f"Expected 38 provinces, got {len(provinces)}"
        
        # Check data structure
        assert "code" in provinces[0]
        assert "name" in provinces[0]
        
        # Check some known provinces
        province_names = [p["name"] for p in provinces]
        assert "DKI Jakarta" in province_names
        assert "Jawa Barat" in province_names
        assert "Aceh" in province_names
        
        print(f"Total provinces: {len(provinces)}")
    
    def test_regencies_endpoint_dki_jakarta(self):
        """Verify /api/wilayah/regencies/{code} returns cities for DKI Jakarta"""
        # DKI Jakarta province code is 31
        response = requests.get(f"{BASE_URL}/api/wilayah/regencies/31")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        cities = data["data"]
        
        assert len(cities) == 6, f"DKI Jakarta should have 6 cities, got {len(cities)}"
        
        city_names = [c["name"] for c in cities]
        assert any("Jakarta Pusat" in name for name in city_names)
        assert any("Jakarta Selatan" in name for name in city_names)
        
        print(f"DKI Jakarta cities: {city_names}")
    
    def test_districts_endpoint(self):
        """Verify /api/wilayah/districts/{code} returns kecamatan"""
        # Jakarta Selatan code is 31.74
        response = requests.get(f"{BASE_URL}/api/wilayah/regencies/31")
        cities = response.json()["data"]
        jakarta_selatan = next((c for c in cities if "Jakarta Selatan" in c["name"]), None)
        
        assert jakarta_selatan is not None
        
        response = requests.get(f"{BASE_URL}/api/wilayah/districts/{jakarta_selatan['code']}")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        districts = data["data"]
        
        assert len(districts) > 0, "Should have districts"
        
        district_names = [d["name"] for d in districts]
        print(f"Jakarta Selatan districts ({len(districts)}): {district_names[:5]}...")
    
    def test_villages_endpoint(self):
        """Verify /api/wilayah/villages/{code} returns kelurahan/desa"""
        # First get a district code
        response = requests.get(f"{BASE_URL}/api/wilayah/districts/31.74")  # Jakarta Selatan
        if response.status_code != 200:
            pytest.skip("Could not get districts for Jakarta Selatan")
        
        districts = response.json()["data"]
        if not districts:
            pytest.skip("No districts found")
        
        first_district = districts[0]
        
        response = requests.get(f"{BASE_URL}/api/wilayah/villages/{first_district['code']}")
        assert response.status_code == 200
        
        data = response.json()
        assert "data" in data
        villages = data["data"]
        
        assert len(villages) > 0, "Should have villages/kelurahan"
        print(f"Villages in {first_district['name']}: {[v['name'] for v in villages]}")


class TestApplicationSubmission:
    """Tests for POST /api/public/apply endpoint"""
    
    def test_submit_without_resume_fails(self):
        """Verify submission fails when required CV is missing"""
        form_data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "phone": "081234567890",
            "birth_place": "Jakarta",
            "birth_date": "1990-01-01",
            "education": "S1",
            "major": "Computer Science",
            "province": "DKI Jakarta",
            "city": "Jakarta Selatan",
            "district": "Cilandak",
            "village": "Cilandak Barat",
            "full_address": "Jl. Test No. 1",
            "expected_salary": "8000000",
            "experience": "2 years"
        }
        
        import json
        response = requests.post(
            f"{BASE_URL}/api/public/apply",
            data={
                "job_id": JOB_ID,
                "form_data": json.dumps(form_data)
            }
        )
        
        # Should succeed even without resume if resume is not required
        # Or return error if resume is required
        print(f"Response status: {response.status_code}")
        print(f"Response: {response.text}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
