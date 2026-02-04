from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import jwt
import secrets
import json
import aiofiles

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app without a prefix
app = FastAPI(title="Lucky Cell HR System API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)

# ============ MODELS ============

class UserRole:
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    EMPLOYEE = "employee"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = UserRole.ADMIN
    company_id: Optional[str] = None
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = UserRole.ADMIN
    company_id: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    company_id: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    company_id: Optional[str] = None
    is_active: bool
    created_at: str
    updated_at: str

class CompanyBase(BaseModel):
    name: str
    domain: str  # Primary identifier (e.g., luckycell.co.id)
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = None
    is_active: bool = True
    # License management
    license_start: Optional[str] = None  # ISO date string
    license_end: Optional[str] = None    # ISO date string
    license_type: str = "trial"  # trial, monthly, yearly, lifetime
    # Custom domain settings for white-label
    custom_domains: Optional[Dict[str, str]] = None  # {"main": "luckycell.co.id", "careers": "careers.luckycell.co.id", "hr": "hr.luckycell.co.id"}

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None
    license_start: Optional[str] = None
    license_end: Optional[str] = None
    license_type: Optional[str] = None
    custom_domains: Optional[Dict[str, str]] = None

class Company(CompanyBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyResponse(BaseModel):
    id: str
    name: str
    domain: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool
    license_start: Optional[str] = None
    license_end: Optional[str] = None
    license_type: Optional[str] = None
    license_status: Optional[str] = None  # active, expired, suspended
    days_remaining: Optional[int] = None
    created_at: str
    updated_at: str
    employee_count: int = 0
    custom_domains: Optional[Dict[str, str]] = None

# Company Profile Models
class CompanyProfileUpdate(BaseModel):
    tagline: Optional[str] = None
    description: Optional[str] = None
    vision: Optional[str] = None
    mission: Optional[str] = None
    history: Optional[str] = None
    culture: Optional[str] = None
    benefits: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None
    gallery_images: Optional[List[str]] = None
    cover_image: Optional[str] = None

class CompanyProfileResponse(BaseModel):
    id: str
    name: str
    domain: str
    logo_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    vision: Optional[str] = None
    mission: Optional[str] = None
    history: Optional[str] = None
    culture: Optional[str] = None
    benefits: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None
    gallery_images: Optional[List[str]] = None
    cover_image: Optional[str] = None

# Job Posting Models
class JobStatus:
    DRAFT = "draft"
    PUBLISHED = "published"
    CLOSED = "closed"

class JobType:
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"

class JobCreate(BaseModel):
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: str = JobType.FULL_TIME
    description: str
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    show_salary: bool = False
    status: str = JobStatus.DRAFT

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    show_salary: Optional[bool] = None
    status: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    company_id: str
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    job_type: str
    description: str
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    show_salary: bool
    status: str
    application_count: int = 0
    created_at: str
    updated_at: str

# Application Form Field Models
class FieldType:
    TEXT = "text"
    TEXTAREA = "textarea"
    EMAIL = "email"
    PHONE = "phone"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    CHECKBOX = "checkbox"
    FILE = "file"

class FormFieldCreate(BaseModel):
    field_name: str
    field_label: str
    field_type: str = FieldType.TEXT
    is_required: bool = True
    options: Optional[List[str]] = None  # For select fields
    placeholder: Optional[str] = None
    order: int = 0

class FormFieldUpdate(BaseModel):
    field_label: Optional[str] = None
    field_type: Optional[str] = None
    is_required: Optional[bool] = None
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None
    order: Optional[int] = None

class FormFieldResponse(BaseModel):
    id: str
    company_id: str
    field_name: str
    field_label: str
    field_type: str
    is_required: bool
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None
    order: int

# Application Models
class ApplicationStatus:
    PENDING = "pending"
    REVIEWING = "reviewing"
    SHORTLISTED = "shortlisted"
    INTERVIEWED = "interviewed"
    OFFERED = "offered"
    HIRED = "hired"
    REJECTED = "rejected"

class ApplicationCreate(BaseModel):
    job_id: str
    form_data: Dict[str, Any]

class ApplicationUpdateStatus(BaseModel):
    status: str
    notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: str
    job_id: str
    company_id: str
    job_title: str
    applicant_name: str
    applicant_email: str
    form_data: Dict[str, Any]
    resume_url: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

class DashboardStats(BaseModel):
    total_companies: int
    active_companies: int
    total_users: int
    total_employees: int
    recent_companies: List[CompanyResponse]

# ============ HELPERS ============

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def get_license_status(company: dict) -> tuple:
    """
    Returns (status, days_remaining)
    status: 'active', 'expired', 'suspended', 'no_license'
    """
    if not company.get("is_active"):
        return ("suspended", None)
    
    license_end = company.get("license_end")
    if not license_end:
        # No license set - treat as active (trial/lifetime)
        license_type = company.get("license_type", "trial")
        if license_type == "lifetime":
            return ("active", None)
        return ("active", None)  # Trial without end date
    
    try:
        end_date = datetime.fromisoformat(license_end.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        delta = end_date - now
        days_remaining = delta.days
        
        if days_remaining < 0:
            return ("expired", days_remaining)
        return ("active", days_remaining)
    except:
        return ("active", None)

def build_company_response(company: dict, emp_count: int = 0) -> CompanyResponse:
    """Helper to build CompanyResponse with license status"""
    license_status, days_remaining = get_license_status(company)
    
    return CompanyResponse(
        id=company["id"],
        name=company["name"],
        domain=company["domain"],
        address=company.get("address"),
        phone=company.get("phone"),
        email=company.get("email"),
        logo_url=company.get("logo_url"),
        is_active=company.get("is_active", True),
        license_start=company.get("license_start"),
        license_end=company.get("license_end"),
        license_type=company.get("license_type", "trial"),
        license_status=license_status,
        days_remaining=days_remaining,
        created_at=company["created_at"] if isinstance(company["created_at"], str) else company["created_at"].isoformat(),
        updated_at=company["updated_at"] if isinstance(company["updated_at"], str) else company["updated_at"].isoformat(),
        employee_count=emp_count,
        custom_domains=company.get("custom_domains")
    )

async def check_company_license(company_id: str = None, domain: str = None):
    """Check if company license is valid. Raises HTTPException if not."""
    if company_id:
        company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    elif domain:
        company = await db.companies.find_one({"domain": domain}, {"_id": 0})
    else:
        return None
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    status, _ = get_license_status(company)
    
    if status == "suspended":
        raise HTTPException(
            status_code=403, 
            detail="Company account is suspended. Please contact administrator."
        )
    elif status == "expired":
        raise HTTPException(
            status_code=403, 
            detail="Company license has expired. Please renew your subscription."
        )
    
    return company

def create_token(user_id: str, role: str, company_id: str = None) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "company_id": company_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(optional_security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            return None
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        return user
    except:
        return None

async def require_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user

async def require_admin_or_super(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============ STARTUP ============

@app.on_event("startup")
async def startup_event():
    # Create default super admin if not exists
    existing_admin = await db.users.find_one({"role": UserRole.SUPER_ADMIN})
    if not existing_admin:
        super_admin = {
            "id": str(uuid.uuid4()),
            "email": "superadmin@luckycell.co.id",
            "name": "Super Admin",
            "password": hash_password("admin123"),
            "role": UserRole.SUPER_ADMIN,
            "company_id": None,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(super_admin)
        logging.info("Default Super Admin created: superadmin@luckycell.co.id / admin123")

# ============ AUTH ROUTES ============

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    token = create_token(user["id"], user["role"], user.get("company_id"))
    
    return LoginResponse(
        token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            company_id=user.get("company_id"),
            is_active=user["is_active"],
            created_at=user["created_at"] if isinstance(user["created_at"], str) else user["created_at"].isoformat(),
            updated_at=user["updated_at"] if isinstance(user["updated_at"], str) else user["updated_at"].isoformat()
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        company_id=current_user.get("company_id"),
        is_active=current_user["is_active"],
        created_at=current_user["created_at"] if isinstance(current_user["created_at"], str) else current_user["created_at"].isoformat(),
        updated_at=current_user["updated_at"] if isinstance(current_user["updated_at"], str) else current_user["updated_at"].isoformat()
    )

# ============ DASHBOARD ROUTES ============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(require_super_admin)):
    total_companies = await db.companies.count_documents({})
    active_companies = await db.companies.count_documents({"is_active": True})
    total_users = await db.users.count_documents({"role": {"$ne": UserRole.SUPER_ADMIN}})
    total_employees = await db.users.count_documents({"role": UserRole.EMPLOYEE})
    
    recent_companies_cursor = db.companies.find({}, {"_id": 0}).sort("created_at", -1).limit(5)
    recent_companies = await recent_companies_cursor.to_list(5)
    
    recent_with_counts = []
    for company in recent_companies:
        emp_count = await db.users.count_documents({"company_id": company["id"]})
        recent_with_counts.append(CompanyResponse(
            id=company["id"],
            name=company["name"],
            domain=company["domain"],
            address=company.get("address"),
            phone=company.get("phone"),
            email=company.get("email"),
            logo_url=company.get("logo_url"),
            is_active=company["is_active"],
            created_at=company["created_at"] if isinstance(company["created_at"], str) else company["created_at"].isoformat(),
            updated_at=company["updated_at"] if isinstance(company["updated_at"], str) else company["updated_at"].isoformat(),
            employee_count=emp_count
        ))
    
    return DashboardStats(
        total_companies=total_companies,
        active_companies=active_companies,
        total_users=total_users,
        total_employees=total_employees,
        recent_companies=recent_with_counts
    )

# ============ COMPANY ROUTES ============

@api_router.get("/companies", response_model=List[CompanyResponse])
async def get_companies(current_user: dict = Depends(require_super_admin)):
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    
    result = []
    for company in companies:
        emp_count = await db.users.count_documents({"company_id": company["id"]})
        result.append(CompanyResponse(
            id=company["id"],
            name=company["name"],
            domain=company["domain"],
            address=company.get("address"),
            phone=company.get("phone"),
            email=company.get("email"),
            logo_url=company.get("logo_url"),
            is_active=company["is_active"],
            created_at=company["created_at"] if isinstance(company["created_at"], str) else company["created_at"].isoformat(),
            updated_at=company["updated_at"] if isinstance(company["updated_at"], str) else company["updated_at"].isoformat(),
            employee_count=emp_count,
            custom_domains=company.get("custom_domains")
        ))
    
    return result

@api_router.post("/companies", response_model=CompanyResponse)
async def create_company(data: CompanyCreate, current_user: dict = Depends(require_super_admin)):
    # Check if domain already exists
    existing = await db.companies.find_one({"domain": data.domain})
    if existing:
        raise HTTPException(status_code=400, detail="Domain already exists")
    
    company = Company(**data.model_dump())
    doc = company.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    # Initialize profile fields
    doc["profile"] = {
        "tagline": None,
        "description": None,
        "vision": None,
        "mission": None,
        "history": None,
        "culture": None,
        "benefits": [],
        "social_links": {},
        "gallery_images": [],
        "cover_image": None
    }
    
    await db.companies.insert_one(doc)
    
    # Create default form fields for this company
    default_fields = [
        {"field_name": "full_name", "field_label": "Nama Lengkap", "field_type": "text", "is_required": True, "order": 1},
        {"field_name": "email", "field_label": "Email", "field_type": "email", "is_required": True, "order": 2},
        {"field_name": "phone", "field_label": "No. Telepon", "field_type": "phone", "is_required": True, "order": 3},
        {"field_name": "resume", "field_label": "Upload CV (PDF)", "field_type": "file", "is_required": True, "order": 4},
    ]
    
    for field in default_fields:
        field["id"] = str(uuid.uuid4())
        field["company_id"] = doc["id"]
        await db.form_fields.insert_one(field)
    
    return CompanyResponse(
        id=doc["id"],
        name=doc["name"],
        domain=doc["domain"],
        address=doc.get("address"),
        phone=doc.get("phone"),
        email=doc.get("email"),
        logo_url=doc.get("logo_url"),
        is_active=doc["is_active"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        employee_count=0,
        custom_domains=doc.get("custom_domains")
    )

@api_router.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: str, current_user: dict = Depends(require_super_admin)):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    emp_count = await db.users.count_documents({"company_id": company_id})
    
    return CompanyResponse(
        id=company["id"],
        name=company["name"],
        domain=company["domain"],
        address=company.get("address"),
        phone=company.get("phone"),
        email=company.get("email"),
        logo_url=company.get("logo_url"),
        is_active=company["is_active"],
        created_at=company["created_at"] if isinstance(company["created_at"], str) else company["created_at"].isoformat(),
        updated_at=company["updated_at"] if isinstance(company["updated_at"], str) else company["updated_at"].isoformat(),
        employee_count=emp_count,
        custom_domains=company.get("custom_domains")
    )

@api_router.put("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: str, data: CompanyUpdate, current_user: dict = Depends(require_super_admin)):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.companies.update_one({"id": company_id}, {"$set": update_data})
    
    updated = await db.companies.find_one({"id": company_id}, {"_id": 0})
    emp_count = await db.users.count_documents({"company_id": company_id})
    
    return CompanyResponse(
        id=updated["id"],
        name=updated["name"],
        domain=updated["domain"],
        address=updated.get("address"),
        phone=updated.get("phone"),
        email=updated.get("email"),
        logo_url=updated.get("logo_url"),
        is_active=updated["is_active"],
        created_at=updated["created_at"] if isinstance(updated["created_at"], str) else updated["created_at"].isoformat(),
        updated_at=updated["updated_at"] if isinstance(updated["updated_at"], str) else updated["updated_at"].isoformat(),
        employee_count=emp_count,
        custom_domains=updated.get("custom_domains")
    )

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_user: dict = Depends(require_super_admin)):
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Delete all related data
    await db.users.delete_many({"company_id": company_id})
    await db.jobs.delete_many({"company_id": company_id})
    await db.applications.delete_many({"company_id": company_id})
    await db.form_fields.delete_many({"company_id": company_id})
    await db.companies.delete_one({"id": company_id})
    
    return {"message": "Company deleted successfully"}

# ============ DOMAIN LOOKUP ROUTES (For White-Label) ============

class DomainLookupResponse(BaseModel):
    found: bool
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    domain: Optional[str] = None
    page_type: Optional[str] = None  # "main", "careers", "hr"
    logo_url: Optional[str] = None

@api_router.get("/public/domain-lookup")
async def lookup_domain(hostname: str):
    """
    Lookup company by hostname for white-label routing.
    Checks custom_domains.main, custom_domains.careers, custom_domains.hr
    Also checks primary domain field.
    """
    # First check custom_domains
    company = await db.companies.find_one({
        "$or": [
            {"custom_domains.main": hostname},
            {"custom_domains.careers": hostname},
            {"custom_domains.hr": hostname},
            {"domain": hostname}
        ],
        "is_active": True
    }, {"_id": 0})
    
    if not company:
        return DomainLookupResponse(found=False)
    
    # Determine page type
    custom_domains = company.get("custom_domains", {})
    page_type = "main"  # default
    
    if custom_domains:
        if custom_domains.get("careers") == hostname:
            page_type = "careers"
        elif custom_domains.get("hr") == hostname:
            page_type = "hr"
        elif custom_domains.get("main") == hostname:
            page_type = "main"
    
    return DomainLookupResponse(
        found=True,
        company_id=company["id"],
        company_name=company["name"],
        domain=company["domain"],
        page_type=page_type,
        logo_url=company.get("logo_url")
    )

@api_router.put("/companies/{company_id}/domains")
async def update_company_domains(
    company_id: str, 
    domains: Dict[str, str],
    current_user: dict = Depends(require_super_admin)
):
    """
    Update custom domains for a company.
    domains: {"main": "luckycell.co.id", "careers": "careers.luckycell.co.id", "hr": "hr.luckycell.co.id"}
    """
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Validate domains are not used by other companies
    for domain_type, domain_value in domains.items():
        if domain_value:
            existing = await db.companies.find_one({
                "$or": [
                    {"custom_domains.main": domain_value},
                    {"custom_domains.careers": domain_value},
                    {"custom_domains.hr": domain_value},
                    {"domain": domain_value}
                ],
                "id": {"$ne": company_id}
            })
            if existing:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Domain {domain_value} is already used by another company"
                )
    
    await db.companies.update_one(
        {"id": company_id},
        {"$set": {
            "custom_domains": domains,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Domains updated successfully", "domains": domains}

# ============ PUBLIC COMPANY PROFILE ROUTES ============

@api_router.get("/public/company/{domain}", response_model=CompanyProfileResponse)
async def get_public_company_profile(domain: str):
    company = await db.companies.find_one({"domain": domain, "is_active": True}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    profile = company.get("profile", {})
    
    return CompanyProfileResponse(
        id=company["id"],
        name=company["name"],
        domain=company["domain"],
        logo_url=company.get("logo_url"),
        address=company.get("address"),
        phone=company.get("phone"),
        email=company.get("email"),
        tagline=profile.get("tagline"),
        description=profile.get("description"),
        vision=profile.get("vision"),
        mission=profile.get("mission"),
        history=profile.get("history"),
        culture=profile.get("culture"),
        benefits=profile.get("benefits"),
        social_links=profile.get("social_links"),
        gallery_images=profile.get("gallery_images"),
        cover_image=profile.get("cover_image")
    )

@api_router.put("/companies/{company_id}/profile", response_model=CompanyProfileResponse)
async def update_company_profile(company_id: str, data: CompanyProfileUpdate, current_user: dict = Depends(require_admin_or_super)):
    # Check access
    if current_user["role"] == UserRole.ADMIN and current_user.get("company_id") != company_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    profile_update = {f"profile.{k}": v for k, v in data.model_dump().items() if v is not None}
    profile_update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.companies.update_one({"id": company_id}, {"$set": profile_update})
    
    updated = await db.companies.find_one({"id": company_id}, {"_id": 0})
    profile = updated.get("profile", {})
    
    return CompanyProfileResponse(
        id=updated["id"],
        name=updated["name"],
        domain=updated["domain"],
        logo_url=updated.get("logo_url"),
        address=updated.get("address"),
        phone=updated.get("phone"),
        email=updated.get("email"),
        tagline=profile.get("tagline"),
        description=profile.get("description"),
        vision=profile.get("vision"),
        mission=profile.get("mission"),
        history=profile.get("history"),
        culture=profile.get("culture"),
        benefits=profile.get("benefits"),
        social_links=profile.get("social_links"),
        gallery_images=profile.get("gallery_images"),
        cover_image=profile.get("cover_image")
    )

# ============ JOB POSTING ROUTES ============

@api_router.get("/jobs", response_model=List[JobResponse])
async def get_jobs(current_user: dict = Depends(require_admin_or_super)):
    query = {}
    if current_user["role"] == UserRole.ADMIN:
        query["company_id"] = current_user.get("company_id")
    
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    result = []
    for job in jobs:
        app_count = await db.applications.count_documents({"job_id": job["id"]})
        result.append(JobResponse(
            id=job["id"],
            company_id=job["company_id"],
            title=job["title"],
            department=job.get("department"),
            location=job.get("location"),
            job_type=job["job_type"],
            description=job["description"],
            requirements=job.get("requirements"),
            responsibilities=job.get("responsibilities"),
            salary_min=job.get("salary_min"),
            salary_max=job.get("salary_max"),
            show_salary=job.get("show_salary", False),
            status=job["status"],
            application_count=app_count,
            created_at=job["created_at"],
            updated_at=job["updated_at"]
        ))
    
    return result

@api_router.post("/jobs", response_model=JobResponse)
async def create_job(data: JobCreate, current_user: dict = Depends(require_admin_or_super)):
    company_id = current_user.get("company_id")
    if current_user["role"] == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Super Admin must specify company")
    
    if not company_id:
        raise HTTPException(status_code=400, detail="No company assigned")
    
    job_doc = {
        "id": str(uuid.uuid4()),
        "company_id": company_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.jobs.insert_one(job_doc)
    
    return JobResponse(
        id=job_doc["id"],
        company_id=job_doc["company_id"],
        title=job_doc["title"],
        department=job_doc.get("department"),
        location=job_doc.get("location"),
        job_type=job_doc["job_type"],
        description=job_doc["description"],
        requirements=job_doc.get("requirements"),
        responsibilities=job_doc.get("responsibilities"),
        salary_min=job_doc.get("salary_min"),
        salary_max=job_doc.get("salary_max"),
        show_salary=job_doc.get("show_salary", False),
        status=job_doc["status"],
        application_count=0,
        created_at=job_doc["created_at"],
        updated_at=job_doc["updated_at"]
    )

@api_router.put("/jobs/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, data: JobUpdate, current_user: dict = Depends(require_admin_or_super)):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if current_user["role"] == UserRole.ADMIN and job["company_id"] != current_user.get("company_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.jobs.update_one({"id": job_id}, {"$set": update_data})
    
    updated = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    app_count = await db.applications.count_documents({"job_id": job_id})
    
    return JobResponse(
        id=updated["id"],
        company_id=updated["company_id"],
        title=updated["title"],
        department=updated.get("department"),
        location=updated.get("location"),
        job_type=updated["job_type"],
        description=updated["description"],
        requirements=updated.get("requirements"),
        responsibilities=updated.get("responsibilities"),
        salary_min=updated.get("salary_min"),
        salary_max=updated.get("salary_max"),
        show_salary=updated.get("show_salary", False),
        status=updated["status"],
        application_count=app_count,
        created_at=updated["created_at"],
        updated_at=updated["updated_at"]
    )

@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str, current_user: dict = Depends(require_admin_or_super)):
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if current_user["role"] == UserRole.ADMIN and job["company_id"] != current_user.get("company_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.applications.delete_many({"job_id": job_id})
    await db.jobs.delete_one({"id": job_id})
    
    return {"message": "Job deleted successfully"}

# ============ PUBLIC JOB ROUTES ============

@api_router.get("/public/careers/{domain}/jobs")
async def get_public_jobs(domain: str):
    company = await db.companies.find_one({"domain": domain, "is_active": True}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    jobs = await db.jobs.find(
        {"company_id": company["id"], "status": JobStatus.PUBLISHED}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    result = []
    for job in jobs:
        job_data = {
            "id": job["id"],
            "title": job["title"],
            "department": job.get("department"),
            "location": job.get("location"),
            "job_type": job["job_type"],
            "description": job["description"],
            "requirements": job.get("requirements"),
            "responsibilities": job.get("responsibilities"),
            "created_at": job["created_at"]
        }
        if job.get("show_salary"):
            job_data["salary_min"] = job.get("salary_min")
            job_data["salary_max"] = job.get("salary_max")
        result.append(job_data)
    
    return {
        "company": {
            "id": company["id"],
            "name": company["name"],
            "domain": company["domain"],
            "logo_url": company.get("logo_url"),
            "tagline": company.get("profile", {}).get("tagline"),
            "culture": company.get("profile", {}).get("culture"),
            "benefits": company.get("profile", {}).get("benefits")
        },
        "jobs": result
    }

@api_router.get("/public/careers/{domain}/jobs/{job_id}")
async def get_public_job_detail(domain: str, job_id: str):
    company = await db.companies.find_one({"domain": domain, "is_active": True}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    job = await db.jobs.find_one(
        {"id": job_id, "company_id": company["id"], "status": JobStatus.PUBLISHED}, 
        {"_id": 0}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get form fields
    form_fields = await db.form_fields.find(
        {"company_id": company["id"]}, 
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    
    job_data = {
        "id": job["id"],
        "title": job["title"],
        "department": job.get("department"),
        "location": job.get("location"),
        "job_type": job["job_type"],
        "description": job["description"],
        "requirements": job.get("requirements"),
        "responsibilities": job.get("responsibilities"),
        "created_at": job["created_at"]
    }
    if job.get("show_salary"):
        job_data["salary_min"] = job.get("salary_min")
        job_data["salary_max"] = job.get("salary_max")
    
    return {
        "company": {
            "id": company["id"],
            "name": company["name"],
            "domain": company["domain"],
            "logo_url": company.get("logo_url")
        },
        "job": job_data,
        "form_fields": form_fields
    }

# ============ FORM FIELDS ROUTES ============

@api_router.get("/form-fields", response_model=List[FormFieldResponse])
async def get_form_fields(current_user: dict = Depends(require_admin_or_super)):
    company_id = current_user.get("company_id")
    if current_user["role"] == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Super Admin must specify company")
    
    fields = await db.form_fields.find({"company_id": company_id}, {"_id": 0}).sort("order", 1).to_list(100)
    
    return [FormFieldResponse(**field) for field in fields]

@api_router.post("/form-fields", response_model=FormFieldResponse)
async def create_form_field(data: FormFieldCreate, current_user: dict = Depends(require_admin_or_super)):
    company_id = current_user.get("company_id")
    if current_user["role"] == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=400, detail="Super Admin must specify company")
    
    field_doc = {
        "id": str(uuid.uuid4()),
        "company_id": company_id,
        **data.model_dump()
    }
    
    await db.form_fields.insert_one(field_doc)
    
    return FormFieldResponse(**field_doc)

@api_router.put("/form-fields/{field_id}", response_model=FormFieldResponse)
async def update_form_field(field_id: str, data: FormFieldUpdate, current_user: dict = Depends(require_admin_or_super)):
    field = await db.form_fields.find_one({"id": field_id}, {"_id": 0})
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    if current_user["role"] == UserRole.ADMIN and field["company_id"] != current_user.get("company_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    await db.form_fields.update_one({"id": field_id}, {"$set": update_data})
    
    updated = await db.form_fields.find_one({"id": field_id}, {"_id": 0})
    return FormFieldResponse(**updated)

@api_router.delete("/form-fields/{field_id}")
async def delete_form_field(field_id: str, current_user: dict = Depends(require_admin_or_super)):
    field = await db.form_fields.find_one({"id": field_id})
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    if current_user["role"] == UserRole.ADMIN and field["company_id"] != current_user.get("company_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.form_fields.delete_one({"id": field_id})
    return {"message": "Field deleted successfully"}

# ============ APPLICATION ROUTES ============

@api_router.post("/public/apply")
async def submit_application(
    job_id: str = Form(...),
    form_data: str = Form(...),
    resume: Optional[UploadFile] = File(None)
):
    job = await db.jobs.find_one({"id": job_id, "status": JobStatus.PUBLISHED}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    company = await db.companies.find_one({"id": job["company_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    try:
        parsed_data = json.loads(form_data)
    except:
        raise HTTPException(status_code=400, detail="Invalid form data")
    
    resume_url = None
    if resume:
        # Save resume file
        file_ext = resume.filename.split(".")[-1] if "." in resume.filename else "pdf"
        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = UPLOAD_DIR / file_name
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await resume.read()
            await f.write(content)
        
        resume_url = f"/api/uploads/{file_name}"
    
    application_doc = {
        "id": str(uuid.uuid4()),
        "job_id": job_id,
        "company_id": job["company_id"],
        "form_data": parsed_data,
        "resume_url": resume_url,
        "status": ApplicationStatus.PENDING,
        "notes": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.applications.insert_one(application_doc)
    
    return {"message": "Application submitted successfully", "id": application_doc["id"]}

@api_router.get("/applications", response_model=List[ApplicationResponse])
async def get_applications(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_admin_or_super)
):
    query = {}
    if current_user["role"] == UserRole.ADMIN:
        query["company_id"] = current_user.get("company_id")
    if job_id:
        query["job_id"] = job_id
    if status:
        query["status"] = status
    
    applications = await db.applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    result = []
    for app in applications:
        job = await db.jobs.find_one({"id": app["job_id"]}, {"_id": 0})
        job_title = job["title"] if job else "Unknown"
        
        form_data = app.get("form_data", {})
        applicant_name = form_data.get("full_name", form_data.get("name", "Unknown"))
        applicant_email = form_data.get("email", "Unknown")
        
        result.append(ApplicationResponse(
            id=app["id"],
            job_id=app["job_id"],
            company_id=app["company_id"],
            job_title=job_title,
            applicant_name=applicant_name,
            applicant_email=applicant_email,
            form_data=form_data,
            resume_url=app.get("resume_url"),
            status=app["status"],
            notes=app.get("notes"),
            created_at=app["created_at"],
            updated_at=app["updated_at"]
        ))
    
    return result

@api_router.put("/applications/{app_id}/status")
async def update_application_status(app_id: str, data: ApplicationUpdateStatus, current_user: dict = Depends(require_admin_or_super)):
    application = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if current_user["role"] == UserRole.ADMIN and application["company_id"] != current_user.get("company_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {
        "status": data.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    if data.notes is not None:
        update_data["notes"] = data.notes
    
    await db.applications.update_one({"id": app_id}, {"$set": update_data})
    
    return {"message": "Application status updated"}

@api_router.delete("/applications/{app_id}")
async def delete_application(app_id: str, current_user: dict = Depends(require_admin_or_super)):
    application = await db.applications.find_one({"id": app_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if current_user["role"] == UserRole.ADMIN and application["company_id"] != current_user.get("company_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    await db.applications.delete_one({"id": app_id})
    return {"message": "Application deleted"}

# ============ FILE UPLOAD ROUTES ============

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# ============ USER ROUTES ============

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(require_super_admin)):
    users = await db.users.find({"role": {"$ne": UserRole.SUPER_ADMIN}}, {"_id": 0, "password": 0}).to_list(1000)
    
    return [
        UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            company_id=user.get("company_id"),
            is_active=user["is_active"],
            created_at=user["created_at"] if isinstance(user["created_at"], str) else user["created_at"].isoformat(),
            updated_at=user["updated_at"] if isinstance(user["updated_at"], str) else user["updated_at"].isoformat()
        )
        for user in users
    ]

@api_router.post("/users", response_model=UserResponse)
async def create_user(data: UserCreate, current_user: dict = Depends(require_super_admin)):
    # Check if email already exists
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "name": data.name,
        "password": hash_password(data.password),
        "role": data.role,
        "company_id": data.company_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    return UserResponse(
        id=user_doc["id"],
        email=user_doc["email"],
        name=user_doc["name"],
        role=user_doc["role"],
        company_id=user_doc.get("company_id"),
        is_active=user_doc["is_active"],
        created_at=user_doc["created_at"],
        updated_at=user_doc["updated_at"]
    )

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, data: UserUpdate, current_user: dict = Depends(require_super_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "password" in update_data:
        update_data["password"] = hash_password(update_data["password"])
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    return UserResponse(
        id=updated["id"],
        email=updated["email"],
        name=updated["name"],
        role=updated["role"],
        company_id=updated.get("company_id"),
        is_active=updated["is_active"],
        created_at=updated["created_at"] if isinstance(updated["created_at"], str) else updated["created_at"].isoformat(),
        updated_at=updated["updated_at"] if isinstance(updated["updated_at"], str) else updated["updated_at"].isoformat()
    )

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_super_admin)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("role") == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot delete Super Admin")
    
    await db.users.delete_one({"id": user_id})
    
    return {"message": "User deleted successfully"}

# ============ HEALTH CHECK ============

@api_router.get("/")
async def root():
    return {"message": "Lucky Cell HR System API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
