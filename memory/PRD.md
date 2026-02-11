# Makar.id - HR Management System PRD

## Original Problem Statement
Web-based applicant tracking system (ATS) for Indonesian businesses with multi-tenant, white-label domain support.

## Core Architecture
- **Backend:** Python FastAPI + MongoDB (Motor async)
- **Frontend:** React + Shadcn UI + TailwindCSS
- **Auth:** JWT (superadmin) + Session-based (company users)
- **Multi-tenant:** Company-based isolation with white-label custom domains

## What's Been Implemented

### Phase 1 - Core System (Completed)
- Multi-tenant company management with license system
- Super admin dashboard (CRUD companies, users, settings)
- Company admin dashboard (jobs, applications, activity logs)
- Employee dashboard
- Unified login system (email + Google OAuth)
- 2FA (TOTP) support
- Public career pages & job application forms

### Phase 2 - Recruitment Features (Completed)
- Activity Log for company admins (with filters, pagination)
- Excel export with CV bundling (ZIP)
- Image preview in Excel for image CVs
- CV image compression on upload
- Email notifications (application confirmation + status updates)
- SMTP settings per company

### Phase 3 - VPS Deployment Support (Completed - Feb 11, 2026)
- Database seed system (`seed_data/` JSON files + `seed_db.py` script)
- Auto-seed on startup from seed files
- API endpoints: `/api/seed/status`, `/api/seed/init`, `/api/seed/reset-password`
- Frontend REACT_APP_BACKEND_URL fallback to relative URLs for self-hosted
- `.env.example` files for deployment guidance

### Phase 4 - White-Label Custom Domain (Completed - Feb 11, 2026)
- **DomainRouter refactored** - no redirect, renders pages directly at custom domain root
- **DomainContext** - shares resolved domain info across components
- **Custom domain routing:**
  - `luckycell.co.id/` → Company Profile (no redirect)
  - `career.luckycell.co.id/` → Careers page (no redirect)
  - `hr.luckycell.co.id/` → Login page (no redirect)
- **White-label branding:** Hide "Powered by Makar.id" on custom domains
- **Custom Page Title:** Per-company HTML title setting for browser tabs
- **License display:** Company admin dashboard shows remaining license days
- **License enforcement:** Expired license shows blocking message on public pages

## Pending Issues
- **P0:** Email notifications for status updates not delivered in production (SMTP works for test emails)
- **P1:** CV image crash fix (implemented, needs user verification)
- **P1:** Save button for status changes (implemented, needs user verification)

## Key Files
- `backend/server.py` - Main API server
- `backend/seed_data/` - Database seed files
- `backend/seed_db.py` - Seed script for VPS deployment
- `frontend/src/App.js` - Main router with custom domain support
- `frontend/src/components/DomainRouter.jsx` - Domain resolution & context
- `frontend/src/contexts/DomainContext.js` - Domain context provider
- `frontend/src/components/admin/OverviewTab.jsx` - Admin dashboard overview
- `frontend/src/pages/CompanyProfile.jsx` - Public company profile
- `frontend/src/pages/Careers.jsx` - Public careers page
- `frontend/src/pages/UnifiedLogin.jsx` - Company login (white-labeled)

## Credentials (Preview)
- Superadmin: muhaikal88@gmail.com / Admin@2026!
- Company Admin: admin@lucky.com / Admin@2026!
