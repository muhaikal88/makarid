from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form, Request, Response, Cookie
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
import httpx

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
    ADMIN = "admin"
    EMPLOYEE = "employee"

# ===== SUPER ADMIN MODELS (Separate Table) =====

class SuperAdminBase(BaseModel):
    email: EmailStr
    name: str
    is_active: bool = True

class SuperAdminCreate(BaseModel):
    email: EmailStr
    name: str
    password: str

class SuperAdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class SuperAdmin(SuperAdminBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SuperAdminResponse(BaseModel):
    id: str
    email: str
    name: str
    is_active: bool
    created_at: str
    updated_at: str

class LoginResponseSuperAdmin(BaseModel):
    token: str
    user: dict  # Flexible dict to handle both SuperAdmin and User

# ===== COMPANY ADMIN MODELS (New Separate Table) =====

class CompanyAdminBase(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    companies: List[str] = []  # List of company_ids user is admin of
    is_active: bool = True
    auth_provider: str = "email"  # "email" or "google"

class CompanyAdminCreate(BaseModel):
    email: EmailStr
    name: str
    password: Optional[str] = None  # Optional if using Google OAuth
    company_id: str  # Initial company
    auth_provider: str = "email"

class CompanyAdmin(CompanyAdminBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"admin_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== EMPLOYEE MODELS (New Separate Table) =====

class EmployeeBase(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    companies: List[str] = []  # List of company_ids user is employee of
    is_active: bool = True
    auth_provider: str = "email"  # "email" or "google"

class EmployeeCreate(BaseModel):
    email: EmailStr
    name: str
    password: Optional[str] = None  # Optional if using Google OAuth
    company_id: str  # Initial company
    auth_provider: str = "email"

class Employee(EmployeeBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"emp_{uuid.uuid4().hex[:12]}")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===== UNIFIED LOGIN MODELS =====

class UnifiedLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserAccess(BaseModel):
    company_id: str
    company_name: str
    company_slug: str
    role: str  # "admin" or "employee"
    user_table: str  # "company_admins" or "employees"
    user_id: str

class UnifiedLoginResponse(BaseModel):
    access_list: List[UserAccess]
    user_email: str
    user_name: str
    user_picture: Optional[str] = None
    needs_selection: bool

class CompanyRoleSelection(BaseModel):
    company_id: str
    role: str
    user_table: str
    user_id: str

class SessionResponse(BaseModel):
    session_token: str
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    company_id: str
    company_name: str
    company_slug: str
    role: str

# ===== OLD USER MODELS (Keep for backward compatibility) =====

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = UserRole.ADMIN  # Only 'admin' or 'employee'
    company_id: str  # REQUIRED - all users must belong to a company
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = UserRole.ADMIN
    company_id: str  # REQUIRED

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None

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
    company_id: str
    is_active: bool
    created_at: str
    updated_at: str

class CompanyBase(BaseModel):
    name: str
    slug: str  # URL-friendly identifier (e.g., luckycell) - used for subdomain
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
    # Custom domain settings for white-label (optional)
    custom_domains: Optional[Dict[str, str]] = None  # {"main": "luckycell.co.id", "careers": "careers.luckycell.co.id", "hr": "hr.luckycell.co.id"}
    # SMTP settings (optional - for custom email notifications)
    smtp_settings: Optional[Dict[str, str]] = None  # {"host": "smtp.gmail.com", "port": "587", "user": "noreply@company.com", "password": "***", "from_email": "noreply@company.com", "from_name": "Company Name"}

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
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
    smtp_settings: Optional[Dict[str, str]] = None

class Company(CompanyBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyResponse(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
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
    admin_count: int = 0
    employee_count: int = 0
    custom_domains: Optional[Dict[str, str]] = None
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

# ===== SYSTEM SETTINGS MODELS =====

class SMTPSettings(BaseModel):
    host: str
    port: int
    username: str
    password: str
    from_email: str
    from_name: str
    use_tls: bool = True

class SystemSettings(BaseModel):
    smtp_settings: Optional[SMTPSettings] = None

class SystemSettingsUpdate(BaseModel):
    smtp_settings: Optional[Dict[str, Any]] = None

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

def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from company name"""
    import re
    # Convert to lowercase and replace spaces/special chars with hyphens
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug

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

def build_company_response(company: dict, admin_count: int = 0, emp_count: int = 0) -> CompanyResponse:
    """Helper to build CompanyResponse with license status"""
    license_status, days_remaining = get_license_status(company)
    
    return CompanyResponse(
        id=company["id"],
        name=company["name"],
        slug=company.get("slug"),
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
        admin_count=admin_count,
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
        role = payload.get("role")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Check superadmins table first
        if role == "super_admin":
            user = await db.superadmins.find_one({"id": user_id}, {"_id": 0})
            if user:
                user["role"] = "super_admin"
                user["company_id"] = None
                return user
        
        # Check users table (company users)
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
        role = payload.get("role")
        
        if not user_id:
            return None
        
        # Check superadmins table first
        if role == "super_admin":
            user = await db.superadmins.find_one({"id": user_id}, {"_id": 0})
            if user:
                user["role"] = "super_admin"
                user["company_id"] = None
                return user
        
        # Check users table
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        return user
    except:
        return None

async def require_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Super Admin access required")
    return current_user

async def require_admin_or_super(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in ["super_admin", UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# ============ STARTUP ============

@app.on_event("startup")
async def startup_event():
    # Create default super admin if not exists (in superadmins table)
    existing_admin = await db.superadmins.find_one({"email": "superadmin@makar.id"})
    if not existing_admin:
        super_admin = {
            "id": str(uuid.uuid4()),
            "email": "superadmin@makar.id",
            "name": "Super Admin",
            "password": hash_password("admin123"),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.superadmins.insert_one(super_admin)
        logging.info("Default Super Admin created: superadmin@makar.id / admin123")

# ============ AUTH ROUTES ============

# Super Admin Login (Separate endpoint)
@api_router.post("/auth/superadmin/login")
async def superadmin_login(data: LoginRequest):
    """Login for Super Admin only"""
    admin = await db.superadmins.find_one({"email": data.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, admin["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not admin.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    token = create_token(admin["id"], "super_admin", None)
    
    return {
        "token": token,
        "user": {
            "id": admin["id"],
            "email": admin["email"],
            "name": admin["name"],
            "role": "super_admin",
            "company_id": None,
            "is_active": admin["is_active"],
            "created_at": admin["created_at"],
            "updated_at": admin["updated_at"]
        }
    }

# Company User Login (Separate endpoint)
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    """Login for Company Admin/Employee only"""
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    # Check company license
    await check_company_license(company_id=user.get("company_id"))
    
    token = create_token(user["id"], user["role"], user.get("company_id"))
    
    return LoginResponse(
        token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            company_id=user["company_id"],
            is_active=user["is_active"],
            created_at=user["created_at"] if isinstance(user["created_at"], str) else user["created_at"].isoformat(),
            updated_at=user["updated_at"] if isinstance(user["updated_at"], str) else user["updated_at"].isoformat()
        )
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "company_id": current_user.get("company_id"),
        "is_active": current_user["is_active"],
        "created_at": current_user["created_at"] if isinstance(current_user["created_at"], str) else current_user["created_at"].isoformat(),
        "updated_at": current_user["updated_at"] if isinstance(current_user["updated_at"], str) else current_user["updated_at"].isoformat()
    }


# ============ UNIFIED AUTH (Email-based across tables) ============

@api_router.post("/auth/unified-login", response_model=UnifiedLoginResponse)
async def unified_login(data: UnifiedLoginRequest):
    """
    Unified login for company admins & employees.
    Check email across both tables and return all access.
    """
    access_list = []
    user_name = None
    user_picture = None
    
    # Check company_admins table
    admin = await db.company_admins.find_one({"email": data.email}, {"_id": 0})
    if admin:
        if admin.get("password") and verify_password(data.password, admin["password"]):
            user_name = admin["name"]
            user_picture = admin.get("picture")
            
            # Get all companies this admin has access to
            for company_id in admin.get("companies", []):
                company = await db.companies.find_one({"id": company_id}, {"_id": 0})
                if company and company.get("is_active"):
                    # Check license
                    status, _ = get_license_status(company)
                    if status not in ["expired", "suspended"]:
                        access_list.append(UserAccess(
                            company_id=company_id,
                            company_name=company["name"],
                            company_slug=company.get("slug", company["domain"]),
                            role="admin",
                            user_table="company_admins",
                            user_id=admin["id"]
                        ))
    
    # Check employees table
    employee = await db.employees.find_one({"email": data.email}, {"_id": 0})
    if employee:
        if employee.get("password") and verify_password(data.password, employee["password"]):
            if not user_name:  # Use employee name if admin not found
                user_name = employee["name"]
                user_picture = employee.get("picture")
            
            # Get all companies this employee has access to
            for company_id in employee.get("companies", []):
                company = await db.companies.find_one({"id": company_id}, {"_id": 0})
                if company and company.get("is_active"):
                    status, _ = get_license_status(company)
                    if status not in ["expired", "suspended"]:
                        access_list.append(UserAccess(
                            company_id=company_id,
                            company_name=company["name"],
                            company_slug=company.get("slug", company["domain"]),
                            role="employee",
                            user_table="employees",
                            user_id=employee["id"]
                        ))
    
    if not access_list:
        raise HTTPException(status_code=401, detail="Invalid credentials or no active access")
    
    needs_selection = len(access_list) > 1
    
    return UnifiedLoginResponse(
        access_list=access_list,
        user_email=data.email,
        user_name=user_name,
        user_picture=user_picture,
        needs_selection=needs_selection
    )

@api_router.post("/auth/select-company", response_model=SessionResponse)
async def select_company(data: CompanyRoleSelection, response: Response):
    """
    After user selects company/role, create session and return session token
    """
    # Get user data based on table
    if data.user_table == "company_admins":
        user = await db.company_admins.find_one({"id": data.user_id}, {"_id": 0})
    else:
        user = await db.employees.find_one({"id": data.user_id}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify user has access to this company
    if data.company_id not in user.get("companies", []):
        raise HTTPException(status_code=403, detail="No access to this company")
    
    # Get company info
    company = await db.companies.find_one({"id": data.company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Create session token
    session_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "session_token": session_token,
        "user_id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "picture": user.get("picture"),
        "company_id": data.company_id,
        "role": data.role,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,  # 7 days
        path="/"
    )
    
    return SessionResponse(
        session_token=session_token,
        user_id=user["id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture"),
        company_id=data.company_id,
        company_name=company["name"],
        company_slug=company.get("slug"),
        role=data.role
    )

# ============ GOOGLE OAUTH ENDPOINTS ============

EMERGENT_AUTH_API = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

@api_router.post("/auth/google/callback")
async def google_oauth_callback(session_id: str, response: Response):
    """
    Process Google OAuth session_id from Emergent Auth.
    Return user's access list (companies & roles).
    """
    # Get user data from Emergent Auth
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                EMERGENT_AUTH_API,
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            resp.raise_for_status()
            google_data = resp.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to get session data: {str(e)}")
    
    email = google_data["email"]
    name = google_data["name"]
    picture = google_data.get("picture")
    
    access_list = []
    
    # Check company_admins table
    admin = await db.company_admins.find_one({"email": email}, {"_id": 0})
    if admin:
        # Update with Google data if needed
        await db.company_admins.update_one(
            {"id": admin["id"]},
            {"$set": {
                "name": name,
                "picture": picture,
                "auth_provider": "google",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Get access list
        for company_id in admin.get("companies", []):
            company = await db.companies.find_one({"id": company_id}, {"_id": 0})
            if company and company.get("is_active"):
                status, _ = get_license_status(company)
                if status not in ["expired", "suspended"]:
                    access_list.append({
                        "company_id": company_id,
                        "company_name": company["name"],
                        "company_slug": company.get("slug", company["domain"]),
                        "role": "admin",
                        "user_table": "company_admins",
                        "user_id": admin["id"]
                    })
    
    # Check employees table
    employee = await db.employees.find_one({"email": email}, {"_id": 0})
    if employee:
        # Update with Google data
        await db.employees.update_one(
            {"id": employee["id"]},
            {"$set": {
                "name": name,
                "picture": picture,
                "auth_provider": "google",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Get access list
        for company_id in employee.get("companies", []):
            company = await db.companies.find_one({"id": company_id}, {"_id": 0})
            if company and company.get("is_active"):
                status, _ = get_license_status(company)
                if status not in ["expired", "suspended"]:
                    access_list.append({
                        "company_id": company_id,
                        "company_name": company["name"],
                        "company_slug": company.get("slug", company["domain"]),
                        "role": "employee",
                        "user_table": "employees",
                        "user_id": employee["id"]
                    })
    
    if not access_list:
        raise HTTPException(
            status_code=403, 
            detail="No company access found. Please contact your administrator."
        )
    
    # If only 1 access, auto-create session
    if len(access_list) == 1:
        access = access_list[0]
        session_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session_doc = {
            "session_token": session_token,
            "user_id": access["user_id"],
            "email": email,
            "name": name,
            "picture": picture,
            "company_id": access["company_id"],
            "role": access["role"],
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.user_sessions.insert_one(session_doc)
        
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=7*24*60*60,
            path="/"
        )
        
        company = await db.companies.find_one({"id": access["company_id"]}, {"_id": 0})
        
        return SessionResponse(
            session_token=session_token,
            user_id=access["user_id"],
            email=email,
            name=name,
            picture=picture,
            company_id=access["company_id"],
            company_name=company["name"],
            company_slug=company.get("slug"),
            role=access["role"]
        )
    
    # Multiple access - return list for selection
    return {
        "access_list": access_list,
        "user_email": email,
        "user_name": name,
        "user_picture": picture,
        "needs_selection": True
    }

# ============ SESSION-BASED AUTH HELPERS ============

async def get_session_user(request: Request):
    """Get user from session_token (cookie or header)"""
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get session from database
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": session_token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session

@api_router.get("/auth/me-session")
async def get_me_session(request: Request):
    """Get current user from session (cookie-based auth)"""
    session = await get_session_user(request)
    
    company = await db.companies.find_one({"id": session["company_id"]}, {"_id": 0})
    
    return {
        "user_id": session["user_id"],
        "email": session["email"],
        "name": session["name"],
        "picture": session.get("picture"),
        "company_id": session["company_id"],
        "company_name": company["name"] if company else None,
        "company_slug": company.get("slug") if company else None,
        "role": session["role"]
    }

@api_router.post("/auth/logout")
async def logout_session(request: Request, response: Response):
    """Logout - delete session and clear cookie"""
    session_token = request.cookies.get("session_token")
    
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(
        key="session_token",
        path="/",
        httponly=True,
        secure=True,
        samesite="none"
    )
    

async def require_session_admin(request: Request):
    """Require session-based admin authentication"""
    session = await get_session_user(request)
    if session["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return session

async def require_session_employee(request: Request):
    """Require session-based employee authentication"""
    session = await get_session_user(request)
    if session["role"] != "employee":
        raise HTTPException(status_code=403, detail="Employee access required")
    return session

async def require_session_user(request: Request):
    """Require any session-based authentication (admin or employee)"""
    session = await get_session_user(request)
    return session


    return {"message": "Logged out successfully"}


# ============ DASHBOARD ROUTES ============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(require_super_admin)):
    total_companies = await db.companies.count_documents({})
    active_companies = await db.companies.count_documents({"is_active": True})
    
    # Count from new tables
    total_admins = await db.company_admins.count_documents({})
    total_employees = await db.employees.count_documents({})
    total_users = total_admins + total_employees
    
    recent_companies_cursor = db.companies.find({}, {"_id": 0}).sort("created_at", -1).limit(5)
    recent_companies = await recent_companies_cursor.to_list(5)
    
    recent_with_counts = []
    for company in recent_companies:
        company_id = company["id"]
        admin_count = await db.company_admins.count_documents({"companies": company_id})
        emp_count = await db.employees.count_documents({"companies": company_id})
        recent_with_counts.append(build_company_response(company, admin_count, emp_count))
    
    return DashboardStats(
        total_companies=total_companies,
        active_companies=active_companies,
        total_users=total_users,
        total_employees=total_employees,
        recent_companies=recent_with_counts
    )


# ============ SYSTEM SETTINGS ROUTES (Super Admin Only) ============

@api_router.get("/system/settings")
async def get_system_settings(current_user: dict = Depends(require_super_admin)):
    """Get global system settings (SMTP, etc.)"""
    settings = await db.system_settings.find_one({}, {"_id": 0})
    
    if not settings:
        # Return default settings
        return {
            "smtp_settings": {
                "host": "",
                "port": 587,
                "username": "",
                "password": "",
                "from_email": "notif@makar.id",
                "from_name": "Makar.id Notifications",
                "use_tls": True
            }
        }
    
    return settings

@api_router.put("/system/settings")
async def update_system_settings(data: SystemSettingsUpdate, current_user: dict = Depends(require_super_admin)):
    """Update global system settings"""
    existing = await db.system_settings.find_one({})
    
    if existing:
        await db.system_settings.update_one(
            {"_id": existing["_id"]},
            {"$set": {
                **data.model_dump(exclude_none=True),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        settings_doc = {
            **data.model_dump(exclude_none=True),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.system_settings.insert_one(settings_doc)
    
    return {"message": "System settings updated successfully"}



# ============ COMPANY ROUTES ============

@api_router.get("/companies", response_model=List[CompanyResponse])
async def get_companies(current_user: dict = Depends(require_super_admin)):
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    
    result = []
    for company in companies:
        company_id = company["id"]
        
        # Count admins yang punya akses ke company ini
        admin_count = await db.company_admins.count_documents({
            "companies": company_id
        })
        
        # Count employees yang punya akses ke company ini
        emp_count = await db.employees.count_documents({
            "companies": company_id
        })
        
        result.append(build_company_response(company, admin_count, emp_count))
    
    return result

@api_router.post("/companies", response_model=CompanyResponse)
async def create_company(data: CompanyCreate, current_user: dict = Depends(require_super_admin)):
    # Auto-generate slug if not provided
    if not hasattr(data, 'slug') or not data.slug:
        slug = generate_slug(data.name)
    else:
        slug = data.slug
    
    # Check if slug already exists
    existing_slug = await db.companies.find_one({"slug": slug})
    if existing_slug:
        # Append random number to make it unique
        import random
        slug = f"{slug}-{random.randint(1000, 9999)}"
    
    # Check if domain already exists
    existing = await db.companies.find_one({"domain": data.domain})
    if existing:
        raise HTTPException(status_code=400, detail="Domain already exists")
    
    company_dict = data.model_dump()
    company_dict["slug"] = slug
    company = Company(**company_dict)
    doc = company.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    
    # Set default license (30-day trial)
    doc["license_start"] = datetime.now(timezone.utc).isoformat()
    doc["license_end"] = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    doc["license_type"] = data.license_type if hasattr(data, 'license_type') and data.license_type else "trial"
    
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
    
    # Initialize SMTP settings as null (will use default/system SMTP)
    doc["smtp_settings"] = None
    
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
    
    return build_company_response(doc, 0)

@api_router.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: str, current_user: dict = Depends(require_super_admin)):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    admin_count = await db.company_admins.count_documents({"companies": company_id})
    emp_count = await db.employees.count_documents({"companies": company_id})
    
    return build_company_response(company, admin_count, emp_count)

@api_router.put("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(company_id: str, data: CompanyUpdate, current_user: dict = Depends(require_super_admin)):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.companies.update_one({"id": company_id}, {"$set": update_data})
    
    updated = await db.companies.find_one({"id": company_id}, {"_id": 0})
    admin_count = await db.company_admins.count_documents({"companies": company_id})
    emp_count = await db.employees.count_documents({"companies": company_id})
    
    return build_company_response(updated, admin_count, emp_count)

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

# ============ PUBLIC COMPANY LIST ============

@api_router.get("/public/companies")
async def get_public_companies():
    """Get list of active companies for login portal"""
    companies = await db.companies.find(
        {"is_active": True}, 
        {"_id": 0, "id": 1, "name": 1, "slug": 1, "domain": 1, "logo_url": 1}
    ).sort("name", 1).to_list(1000)
    
    return companies

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
    Also checks primary domain field and slug-based subdomain.
    """
    # Extract slug from subdomain if it's from makar.id
    # e.g., luckycell.makar.id -> slug=luckycell
    if '.makar.id' in hostname:
        slug = hostname.replace('.makar.id', '')
        company = await db.companies.find_one({
            "slug": slug,
            "is_active": True
        }, {"_id": 0})
        
        if company:
            return DomainLookupResponse(
                found=True,
                company_id=company["id"],
                company_name=company["name"],
                domain=company["domain"],
                page_type="main",
                logo_url=company.get("logo_url")
            )
    
    # Check custom_domains or primary domain
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

# ============ LICENSE MANAGEMENT ROUTES ============

class LicenseUpdate(BaseModel):
    license_start: Optional[str] = None
    license_end: Optional[str] = None
    license_type: Optional[str] = None
    is_active: Optional[bool] = None

@api_router.put("/companies/{company_id}/license")
async def update_company_license(
    company_id: str, 
    data: LicenseUpdate,
    current_user: dict = Depends(require_super_admin)
):
    """Update company license settings"""
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.companies.update_one({"id": company_id}, {"$set": update_data})
    
    updated = await db.companies.find_one({"id": company_id}, {"_id": 0})
    emp_count = await db.users.count_documents({"company_id": company_id})
    
    return build_company_response(updated, emp_count)

@api_router.post("/companies/{company_id}/license/extend")
async def extend_company_license(
    company_id: str,
    days: int = 30,
    current_user: dict = Depends(require_super_admin)
):
    """Extend company license by specified days"""
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Calculate new end date
    current_end = company.get("license_end")
    if current_end:
        try:
            end_date = datetime.fromisoformat(current_end.replace('Z', '+00:00'))
            # If expired, start from now
            if end_date < datetime.now(timezone.utc):
                end_date = datetime.now(timezone.utc)
        except:
            end_date = datetime.now(timezone.utc)
    else:
        end_date = datetime.now(timezone.utc)
    
    new_end = (end_date + timedelta(days=days)).isoformat()
    
    await db.companies.update_one(
        {"id": company_id},
        {"$set": {
            "license_end": new_end,
            "is_active": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await db.companies.find_one({"id": company_id}, {"_id": 0})
    emp_count = await db.users.count_documents({"company_id": company_id})
    
    return {
        "message": f"License extended by {days} days",
        "new_end_date": new_end,
        "company": build_company_response(updated, emp_count)
    }

@api_router.post("/companies/{company_id}/suspend")
async def suspend_company(
    company_id: str,
    current_user: dict = Depends(require_super_admin)
):
    """Suspend a company (deactivate all access)"""
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    await db.companies.update_one(
        {"id": company_id},
        {"$set": {
            "is_active": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Company suspended successfully"}

@api_router.post("/companies/{company_id}/activate")
async def activate_company(
    company_id: str,
    current_user: dict = Depends(require_super_admin)
):
    """Activate a suspended company"""
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    await db.companies.update_one(
        {"id": company_id},
        {"$set": {
            "is_active": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Company activated successfully"}

# ============ PUBLIC COMPANY PROFILE ROUTES ============

@api_router.get("/public/company/{domain}", response_model=CompanyProfileResponse)
async def get_public_company_profile(domain: str):
    # Try to find by slug first, then domain
    company = await db.companies.find_one({
        "$or": [
            {"slug": domain},
            {"domain": domain}
        ]
    }, {"_id": 0})
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check license status
    await check_company_license(company_id=company["id"])
    
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

# ============ COMPANY SETTINGS ROUTES (For Company Admin) ============

class CompanySettingsUpdate(BaseModel):
    custom_domains: Optional[Dict[str, str]] = None
    smtp_settings: Optional[Dict[str, str]] = None

@api_router.get("/company/settings")
async def get_company_settings(current_user: dict = Depends(require_admin_or_super)):
    """Get company settings (custom domains & SMTP) for Company Admin"""
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="No company assigned")
    
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "id": company["id"],
        "name": company["name"],
        "slug": company.get("slug"),
        "domain": company["domain"],
        "custom_domains": company.get("custom_domains"),
        "smtp_settings": company.get("smtp_settings"),
        "default_subdomain": f"{company.get('slug')}.makar.id" if company.get('slug') else None
    }

@api_router.put("/company/settings")
async def update_company_settings(data: CompanySettingsUpdate, current_user: dict = Depends(require_admin_or_super)):
    """Update company settings (custom domains & SMTP) by Company Admin"""
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="No company assigned")
    
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    update_data = {}
    
    if data.custom_domains is not None:
        # Validate domains are not used by other companies
        for domain_type, domain_value in data.custom_domains.items():
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
        update_data["custom_domains"] = data.custom_domains
    
    if data.smtp_settings is not None:
        update_data["smtp_settings"] = data.smtp_settings
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.companies.update_one({"id": company_id}, {"$set": update_data})
    
    return {"message": "Settings updated successfully", "updated_fields": list(update_data.keys())}

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

# Session-based job endpoints (for new auth system)
@api_router.get("/jobs-session", response_model=List[JobResponse])
async def get_jobs_session(request: Request):
    """Get jobs using session auth"""
    session = await require_session_admin(request)
    
    query = {"company_id": session["company_id"]}
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
    # Try to find by slug first, then domain
    company = await db.companies.find_one({
        "$or": [
            {"slug": domain},
            {"domain": domain}
        ]
    }, {"_id": 0})
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check license status
    await check_company_license(company_id=company["id"])
    
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
    # Try to find by slug first, then domain
    company = await db.companies.find_one({
        "$or": [
            {"slug": domain},
            {"domain": domain}
        ]
    }, {"_id": 0})
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check license status
    await check_company_license(company_id=company["id"])
    
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
    


@api_router.get("/applications-session", response_model=List[ApplicationResponse])
async def get_applications_session(
    request: Request,
    job_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get applications using session auth"""
    session = await require_session_admin(request)
    
    query = {"company_id": session["company_id"]}
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

# ============ USER ROUTES (Updated for new structure) ============

class AllUsersResponse(BaseModel):
    """Combined response for company admins and employees"""
    id: str
    email: str
    name: str
    role: str  # "admin" or "employee"
    companies: List[str]  # List of company IDs
    company_names: List[str]  # List of company names (for display)
    is_active: bool
    auth_provider: str
    created_at: str
    updated_at: str

@api_router.get("/users")
async def get_users(current_user: dict = Depends(require_super_admin)):
    """Get all company admins and employees"""
    result = []
    
    # Get all company admins
    admins = await db.company_admins.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for admin in admins:
        # Get company names
        company_names = []
        for comp_id in admin.get("companies", []):
            comp = await db.companies.find_one({"id": comp_id}, {"_id": 0, "name": 1})
            if comp:
                company_names.append(comp["name"])
        
        result.append({
            "id": admin["id"],
            "email": admin["email"],
            "name": admin["name"],
            "role": "admin",
            "companies": admin.get("companies", []),
            "company_names": company_names,
            "is_active": admin.get("is_active", True),
            "auth_provider": admin.get("auth_provider", "email"),
            "created_at": admin["created_at"] if isinstance(admin["created_at"], str) else admin["created_at"].isoformat(),
            "updated_at": admin["updated_at"] if isinstance(admin["updated_at"], str) else admin["updated_at"].isoformat()
        })
    
    # Get all employees
    employees = await db.employees.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for emp in employees:
        # Get company names
        company_names = []
        for comp_id in emp.get("companies", []):
            comp = await db.companies.find_one({"id": comp_id}, {"_id": 0, "name": 1})
            if comp:
                company_names.append(comp["name"])
        
        result.append({
            "id": emp["id"],
            "email": emp["email"],
            "name": emp["name"],
            "role": "employee",
            "companies": emp.get("companies", []),
            "company_names": company_names,
            "is_active": emp.get("is_active", True),
            "auth_provider": emp.get("auth_provider", "email"),
            "created_at": emp["created_at"] if isinstance(emp["created_at"], str) else emp["created_at"].isoformat(),
            "updated_at": emp["updated_at"] if isinstance(emp["updated_at"], str) else emp["updated_at"].isoformat()
        })
    
    return result

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
