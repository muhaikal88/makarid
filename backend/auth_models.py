# Unified Authentication Models & Endpoints

from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict

# ===== UNIFIED LOGIN MODELS =====

class UnifiedLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserAccess(BaseModel):
    """Represents user's access to a company with specific role"""
    company_id: str
    company_name: str
    company_slug: str
    role: str  # "admin" or "employee"
    user_table: str  # "company_admins" or "employees"
    user_id: str

class UnifiedLoginResponse(BaseModel):
    """Response after successful login with email/password or Google OAuth"""
    access_list: List[UserAccess]  # List of companies user has access to
    user_email: str
    user_name: str
    user_picture: Optional[str] = None
    needs_selection: bool  # True if user has multiple companies/roles

class CompanyRoleSelection(BaseModel):
    """User selects which company and role to use"""
    email: str
    company_id: str
    role: str  # "admin" or "employee"
    user_table: str  # "company_admins" or "employees"
    user_id: str

class SessionData(BaseModel):
    """Data stored in session after company/role selection"""
    session_token: str
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    company_id: str
    role: str  # "admin", "employee", or "super_admin"
    expires_at: str

# ===== GOOGLE OAUTH MODELS =====

class GoogleSessionRequest(BaseModel):
    session_id: str

class GoogleSessionResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str
    session_token: str
