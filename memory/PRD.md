# Lucky Cell HR Management System - PRD

## Original Problem Statement
Software HR/Employee Management System untuk mengelola karyawan, dari mulai rekrutmen untuk HRD, database karyawan, kehadiran, aktivitas yang dilakukan karyawan, pengajuan cuti, izin sakit, serta penggajian. Pelanggan pertama adalah Lucky Cell (luckycell.co.id).

Setiap perusahaan yang terdaftar akan memiliki:
- Domain utama untuk Company Profile
- Subdomain untuk Recruitment landing page
- Page untuk input lamaran dengan custom form fields

Ada 3 role: Super Admin, Admin (untuk perusahaan), dan Karyawan.

## User Personas
1. **Super Admin**: Mengelola semua perusahaan klien dan admin perusahaan
2. **Admin (Company)**: Mengelola job posting, lamaran, company profile, dan custom form fields
3. **Karyawan**: Mengakses data kehadiran, cuti, dan penggajian mereka
4. **Pelamar (Public)**: Melihat company profile, lowongan kerja, dan submit lamaran

## Core Requirements (MVP)
- [x] Login system dengan multi-role (Super Admin, Admin, Employee)
- [x] Dashboard Super Admin dengan statistik
- [x] Company Management (CRUD)
- [x] User Management (CRUD) 
- [x] Bilingual Support (Indonesia/English)
- [x] Public Company Profile page
- [x] Public Careers/Recruitment page
- [x] Job Posting Management (Admin)
- [x] Custom Application Form Fields
- [x] Job Application Submission
- [x] Application Management (Admin)
- [ ] Database Karyawan
- [ ] Sistem Kehadiran (Attendance)
- [ ] Pengajuan Cuti/Izin Sakit
- [ ] Modul Penggajian (Payroll)

## What's Been Implemented

### Phase 1: Super Admin Dashboard ✅ (Feb 4, 2026)
- Login page dengan Lucky Cell branding
- Dashboard dengan statistik cards
- Companies management (CRUD)
- Users management (CRUD)
- Settings page
- Bilingual support (ID/EN)

### Phase 2: Recruitment Module ✅ (Feb 4, 2026)
**Public Pages:**
- `/company/{domain}` - Company Profile dengan visi/misi, culture, benefits
- `/careers/{domain}` - Job listing dengan search & filter
- `/careers/{domain}/apply/{jobId}` - Application form dengan custom fields

**Admin Features:**
- Job Posting CRUD (title, department, location, salary, requirements)
- Custom Form Fields configuration per company
- Application management dengan status tracking

**Backend APIs:**
- Public: `/api/public/company/{domain}`, `/api/public/careers/{domain}/jobs`
- Admin: `/api/jobs`, `/api/form-fields`, `/api/applications`
- File upload untuk CV/Resume

## URL Pattern
- Company Profile: `/company/{domain}` (e.g., `/company/luckycell.co.id`)
- Careers Page: `/careers/{domain}` (e.g., `/careers/luckycell.co.id`)
- Apply Job: `/careers/{domain}/apply/{jobId}`

## Credentials
- Super Admin: superadmin@luckycell.co.id / admin123
- Lucky Cell Admin: admin@luckycell.co.id / admin123

## Prioritized Backlog

### P0 - Critical (Next Sprint)
1. Admin Dashboard untuk company (manage jobs, applications, profile)
2. Database Karyawan (Employee records)
3. Sistem Kehadiran (Clock-in/Clock-out)

### P1 - High Priority
4. Pengajuan Cuti dan Izin Sakit
5. Modul Penggajian (Payroll)
6. Employee self-service portal
7. Email notifications untuk applications

### P2 - Medium Priority
8. Laporan dan Analytics
9. Interview scheduling
10. Mobile responsive improvements

## Technical Architecture

```
Frontend (React 19)
├── Public Pages (Company Profile, Careers, Apply)
├── Admin Dashboard (Super Admin, Company Admin)
├── Shadcn UI Components
├── Tailwind CSS
└── Bilingual Context (ID/EN)

Backend (FastAPI)
├── Auth (JWT)
├── Companies CRUD
├── Users CRUD
├── Jobs CRUD
├── Applications
├── Form Fields
└── File Upload

Database (MongoDB)
├── users
├── companies (with profile)
├── jobs
├── applications
└── form_fields
```

## Next Tasks
1. Build Admin Dashboard untuk company dengan tabs (Jobs, Applications, Profile, Form Fields)
2. Add email notification saat ada lamaran baru
3. Implement employee database schema
4. Build attendance/clock-in system
