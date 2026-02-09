# Makar.id - HR SaaS Platform PRD

## Original Problem Statement
Software HR/Employee Management System untuk mengelola karyawan, dari mulai rekrutmen untuk HRD, database karyawan, kehadiran, aktivitas yang dilakukan karyawan, pengajuan cuti, izin sakit, serta penggajian. Pelanggan pertama adalah Lucky Cell (luckycell.co.id).

Setiap perusahaan yang terdaftar akan memiliki:
- Domain utama untuk Company Profile
- Subdomain untuk Recruitment landing page
- Page untuk input lamaran dengan custom form fields

Ada 3 role: Super Admin, Admin (untuk perusahaan), dan Karyawan.

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Webpack, Tailwind CSS, shadcn/ui
- **Auth**: JWT for Super Admins, Session/Cookie for Company Users (supports Google OAuth)
- **Database**: MongoDB (collections: superadmins, company_admins, employees, companies, jobs, applications, activity_logs, system_settings)

## What's Been Implemented

### Auth & User Management (Complete)
- [x] Separate login flows: Super Admin (/login) and Company Users (/company-login)
- [x] Unified login with Google OAuth for company users
- [x] Multi-company/role selection process
- [x] 2FA with Google Authenticator
- [x] Strong password validation & generator
- [x] User profile management (name, email, password, picture)

### Super Admin Dashboard (Complete)
- [x] Dashboard with statistics
- [x] Company management (CRUD)
- [x] User management (CRUD) with status/2FA toggles
- [x] Super Admin management
- [x] Global SMTP settings
- [x] Activity Log page

### Company Admin Dashboard (Complete - Feb 9, 2026)
- [x] Overview tab with stats, career page link, recent applications
- [x] Jobs tab with full CRUD (create, edit, delete job postings)
- [x] Applications tab with clickable list, detail dialog, status updates, filters & search
- [x] **Refactored** from monolithic 1100-line file into 6 modular components

### Recruitment Flow (Complete)
- [x] Public career pages per company (/careers/{slug})
- [x] Detailed job application form with Indonesian address API (wilayah.id)
- [x] File upload for CV/Resume

### UI/UX & Branding (Complete)
- [x] Rebranded to Makar.id
- [x] Bilingual support (ID/EN)
- [x] Marketing landing page

## Component Architecture (AdminDashboard)
```
AdminDashboard.jsx (orchestrator)
├── components/admin/OverviewTab.jsx
├── components/admin/JobsTab.jsx
├── components/admin/ApplicationsTab.jsx
├── components/admin/JobFormDialog.jsx
└── components/admin/AppDetailDialog.jsx
```

## Credentials
- **Super Admin**: muhaikal88@gmail.com / Admin@2026! (2FA enabled)
- **Super Admin Backup**: superadmin@makar.id / admin123 (2FA enabled)
- **Company Admin**: admin@demo.co.id / admin123
- **Employee**: employee@demo.co.id / emp123

## Prioritized Backlog

### P1 - High Priority
1. Full Activity Log integration across all backend endpoints
2. Employee Dashboard (currently placeholder)

### P2 - Medium Priority
3. Email notification system (SMTP integration)
4. Public company profile page
5. DNS/Custom domain guidance documentation

### P3 - Future
6. Database Karyawan (Employee records)
7. Sistem Kehadiran (Attendance/Clock-in/out)
8. Pengajuan Cuti dan Izin Sakit
9. Modul Penggajian (Payroll)
10. Employee self-service portal

## Known Infrastructure Issues
- Custom domains require production deployment (preview URLs cannot be used as CNAME targets)
- User needs wildcard CNAME record for *.makar.id
- Data discrepancy between production and preview (separate databases)
