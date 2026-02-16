# Makar.id - PRD & Changelog

## Completed - Feb 16, 2026

### 1. Favicon Updated
- Main site: Logo baru Makar.id (biru-oranye, bukan putih)
- Custom domain: Otomatis pakai logo perusahaan masing-masing

### 2. Mobile Responsive Dashboard
- Header: compact, truncate text, hide language switcher on mobile
- Tabs: horizontal scroll, shorter labels on mobile
- Stats cards: 2 columns on mobile (was 1)
- Padding/spacing: reduced on small screens
- CompanyProfile: smaller cover, responsive logo, compact navigation

### 3. Company Profile Rich Editor
- Custom RichEditor component (no external dependency, React 19 compatible)
- Toolbar: H1, H2, Normal, Bold, Italic, Underline, Lists, Quote, Link, Image, Color picker
- Rich HTML content: description, history, culture rendered as HTML on public page
- Color Theme picker: primary color setting per company
- Gallery: upload multiple images with auto-compression (max 1200px, JPEG 80%)
- Content image upload endpoint: `/api/upload/content-image` (auto-compress)
- All uploads auto-compressed to reduce server load

### 4. Duplicate Application Prevention
- Check email before submit (onBlur validation)
- Backend double-check on submit
- Warning banner when duplicate detected
- Submit button disabled for duplicates
- Per-job setting: "Izinkan pelamar dari lowongan lain"

### 5. Bug Fixes
- Slug field made optional (auto-generate from name)
- Salary fields: empty string → null conversion
- CV preview URL fix for custom domains
- Status labels consistency across all dialogs
