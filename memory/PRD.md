# Lucky Cell HR Management System - PRD

## Original Problem Statement
Software HR/Employee Management System untuk mengelola karyawan, dari mulai rekrutmen untuk HRD, database karyawan, kehadiran, aktivitas yang dilakukan karyawan, pengajuan cuti, izin sakit, serta penggajian. Pelanggan pertama adalah Lucky Cell (luckycell.co.id).

Ada 3 role: Super Admin, Admin (untuk perusahaan), dan Karyawan.

## User Personas
1. **Super Admin**: Mengelola semua perusahaan klien dan admin perusahaan
2. **Admin (Company)**: Mengelola karyawan dan operasional HR di perusahaan mereka
3. **Karyawan**: Mengakses data kehadiran, cuti, dan penggajian mereka

## Core Requirements (MVP)
- [x] Login system dengan multi-role (Super Admin, Admin, Employee)
- [x] Dashboard Super Admin dengan statistik
- [x] Company Management (CRUD)
- [x] User Management (CRUD) 
- [x] Bilingual Support (Indonesia/English)
- [ ] Database Karyawan
- [ ] Sistem Kehadiran (Attendance)
- [ ] Pengajuan Cuti/Izin Sakit
- [ ] Modul Penggajian (Payroll)
- [ ] Rekrutmen untuk HRD

## What's Been Implemented (Feb 4, 2026)

### Phase 1: Super Admin Dashboard ✅
**Backend (FastAPI + MongoDB):**
- Authentication system dengan JWT
- Super Admin auto-creation pada startup
- Dashboard stats API
- Companies CRUD API
- Users CRUD API

**Frontend (React + Shadcn UI):**
- Login page dengan Lucky Cell branding
- Dashboard dengan statistik cards
- Companies management page
- Users management page
- Settings page
- Bilingual support (ID/EN) dengan language switcher
- Responsive sidebar navigation

**Design:**
- Lucky Cell brand colors (Blue #2E4DA7, Red #E31E24, White)
- Professional corporate look
- Manrope font family

## Prioritized Backlog

### P0 - Critical (Next Sprint)
1. Admin dashboard untuk perusahaan
2. Database Karyawan (Employee records)
3. Sistem Kehadiran (Clock-in/Clock-out)

### P1 - High Priority
4. Pengajuan Cuti dan Izin Sakit
5. Modul Penggajian (Payroll)
6. Employee self-service portal

### P2 - Medium Priority
7. Rekrutmen modul
8. Laporan dan Analytics
9. Notifikasi via email
10. Mobile responsive improvements

## Technical Architecture

```
Frontend (React 19)
├── Shadcn UI Components
├── Tailwind CSS
├── React Router
├── Axios for API calls
└── Sonner for toasts

Backend (FastAPI)
├── MongoDB with Motor
├── JWT Authentication
├── Pydantic validation
└── CORS middleware

Database (MongoDB)
├── users collection
├── companies collection
└── (future: employees, attendance, leaves, payroll)
```

## Credentials
- Super Admin: superadmin@luckycell.co.id / admin123

## Next Tasks
1. Build Admin dashboard untuk perusahaan klien
2. Implement employee database schema
3. Build attendance/clock-in system
4. Create leave request workflow
