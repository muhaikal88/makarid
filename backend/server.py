from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import hashlib
import jwt
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
    domain: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    logo_url: Optional[str] = None
    is_active: bool = True

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
    created_at: str
    updated_at: str
    employee_count: int = 0

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

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
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

async def require_super_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required")
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
    
    token = create_token(user["id"], user["role"])
    
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
            employee_count=emp_count
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
    
    await db.companies.insert_one(doc)
    
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
        employee_count=0
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
        employee_count=emp_count
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
        employee_count=emp_count
    )

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_user: dict = Depends(require_super_admin)):
    company = await db.companies.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Delete all users associated with this company
    await db.users.delete_many({"company_id": company_id})
    await db.companies.delete_one({"id": company_id})
    
    return {"message": "Company deleted successfully"}

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
