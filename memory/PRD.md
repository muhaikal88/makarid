# PRD - Makar.id | Manajemen Karyawan

## Problem Statement
Multi-tenant recruitment platform (job board + applicant tracking system) for Indonesian market. Features company-level admin dashboards, public career pages, and super admin management.

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/ui, Axios
- **Backend**: FastAPI (Python), Motor (MongoDB async driver)
- **Database**: MongoDB
- **Auth**: JWT (super admin), Session cookies (company admin/employee)

## Architecture
- Super Admin: JWT-based auth, manages companies + users
- Company Admin: Session-based auth via unified login, manages jobs + applications
- Public: Career pages, job application forms

## What's Been Implemented

### Core Features
- Super admin dashboard (company CRUD, user management, 2FA)
- Company admin dashboard (jobs CRUD, applications management)
- Public career pages per company
- Application form with wilayah.id address integration
- Unified login for company admins/employees
- Google OAuth integration
- Soft delete + trash for applications
- Application comparison feature
- Custom domain mapping UI

### Feb 10, 2026 - Email Template Fix & UI Improvements
- **Backend**: Cleaned email templates - no HTML entities, no table elements (Gmail deliverability)
- **Backend**: Added proper email headers (Date, Message-ID, Reply-To, UTF-8)
- **Frontend**: AppDetailDialog rewritten - added "Simpan" button for status update
- **Frontend**: Status dropdown now matches backend values (reviewing, shortlisted, interviewed, offered)
- **Frontend**: CV image error handling (shows fallback on load failure)
- **Frontend**: Dialog no longer auto-closes on status change

### Feb 10, 2026 - Email Notifications
- **Backend**: Auto email on application submit (confirmation) + status update (notification)
- **Backend**: `POST /api/system/settings/test-email` for testing SMTP
- **Backend**: `GET /api/system/email-logs` for debugging delivery
- **Backend**: Proper email headers (Date, Message-ID, Reply-To) + UTF-8 charset
- **Backend**: Clean HTML templates (no HTML entities, no table elements - Gmail compatible)
- **Frontend**: "Kirim Tes" button + email input + "Log Pengiriman Email" in Settings page
- **SMTP**: musharna.id.rapidplex.com:465 (SSL), cPanel has hourly rate limit
- **Known**: cPanel rate limits ~50 emails/hour, server accepts but queues silently

### Feb 10, 2026 - Export to Excel Feature (Enhanced)
- **Backend**: `POST /api/applications-session/export` generates ZIP (Excel + CV files)
- **Backend**: Excel now has 2 CV columns: "Preview CV" (embedded image thumbnail for images, type label for PDFs) + "File CV" (hyperlink to file in ZIP)
- **Frontend**: "Pilih semua" / "Batal pilih semua" checkbox, "Export Excel (N)" button
- **Testing**: 100% pass rate

### Feb 10, 2026 - Activity Log Feature
- **Backend**: `GET /api/logs/me` endpoint with pagination (skip/limit), date filters, action/resource_type filters, search
- **Backend**: Activity logging on: login (select-company), job CRUD, application status change, soft-delete, restore, permanent delete
- **Frontend**: `ActivityLogTab.jsx` component in admin dashboard (5th tab "Log Aktivitas")
- **Frontend**: Table with User, Aksi, Resource, Deskripsi, Waktu columns
- **Frontend**: Filters: action type, resource type, date range, search, pagination (max 50/page)
- **Testing**: 100% pass rate (14/14 backend tests, all frontend UI tests passed)

### Stability Fixes (Previous Sessions)
- Fixed random JWT secret causing logouts
- Fixed backend CRUD operations (correct DB table references)
- Improved AuthContext error handling
- Axios interceptor for production URL fix

## Pending / Known Issues
- **P0**: Production site `makar.id` broken (needs redeployment with latest code)
- **P2**: Custom domain routing blocked by Emergent platform limitations

## Backlog
- Self-hosting deployment guide (DEPLOYMENT.md)
- Performance optimizations
- Email notifications via SMTP

## Key Files
- `/app/backend/server.py` - All backend logic
- `/app/frontend/src/pages/AdminDashboard.jsx` - Company admin dashboard
- `/app/frontend/src/components/admin/ActivityLogTab.jsx` - Activity log UI
- `/app/frontend/src/contexts/AuthContext.js` - Auth context
- `/app/frontend/src/index.js` - Axios interceptor for production

## Test Credentials
- Super Admin: muhaikal88@gmail.com / Admin@2026!
- Company Admin: admin@lucky.com / Admin@2026! (PT. LUCKY PERDANA MULTIMEDIA)
