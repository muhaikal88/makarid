# Panduan Setup Custom Domain untuk Client

## Overview

Sistem HR Makar.id mendukung white-label custom domain. Setiap client dapat menggunakan domain mereka sendiri:

- `domain.com` → Company Profile
- `careers.domain.com` → Halaman Recruitment/Lowongan Kerja
- `hr.domain.com` → Portal Login Karyawan

---

## Langkah-langkah Setup

### 1. Setup di Server Makar.id (Anda)

#### A. Nginx Configuration

Buat file `/etc/nginx/sites-available/hr-saas`:

```nginx
server {
    listen 80;
    listen 443 ssl;
    
    # Terima semua domain
    server_name ~^(.+)$;
    
    # SSL dengan Let's Encrypt (wildcard atau per-domain)
    ssl_certificate /etc/letsencrypt/live/makar.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/makar.id/privkey.pem;
    
    # Frontend (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### B. SSL Certificate

Gunakan Certbot dengan DNS challenge untuk wildcard certificate, atau generate per domain:

```bash
# Untuk wildcard (lebih mudah)
certbot certonly --dns-cloudflare -d "*.makar.id" -d "makar.id"

# Atau per-domain client (manual)
certbot certonly --nginx -d "luckycell.co.id" -d "careers.luckycell.co.id" -d "hr.luckycell.co.id"
```

---

### 2. Instruksi untuk Client (Lucky Cell)

Beritahu client untuk menambahkan DNS record berikut di domain registrar mereka:

#### DNS Records yang Perlu Ditambahkan:

| Type  | Name/Host | Value/Target              | TTL  |
|-------|-----------|---------------------------|------|
| A     | @         | `IP_SERVER_ANDA`          | 3600 |
| CNAME | careers   | `luckycell.co.id`         | 3600 |
| CNAME | hr        | `luckycell.co.id`         | 3600 |

**Atau jika menggunakan CNAME untuk semua:**

| Type  | Name/Host | Value/Target              | TTL  |
|-------|-----------|---------------------------|------|
| CNAME | @         | `app.makar.id`            | 3600 |
| CNAME | careers   | `app.makar.id`            | 3600 |
| CNAME | hr        | `app.makar.id`            | 3600 |

> **Catatan:** Beberapa registrar tidak mengizinkan CNAME untuk root domain (@). Dalam kasus ini, gunakan A record dengan IP server.

---

### 3. Setup di Dashboard Super Admin

Setelah DNS propagate (biasanya 5-30 menit), update domain di Super Admin:

```
1. Login ke /login sebagai Super Admin
2. Buka menu Companies
3. Edit company Lucky Cell
4. Isi Custom Domains:
   - Main Domain: luckycell.co.id
   - Careers Domain: careers.luckycell.co.id
   - HR Domain: hr.luckycell.co.id
5. Save
```

---

## Cara Kerja Routing

```
User mengakses: careers.luckycell.co.id
        ↓
DNS resolve ke IP server Makar.id
        ↓
Nginx menerima request dengan Host: careers.luckycell.co.id
        ↓
Frontend React mendeteksi hostname
        ↓
Frontend call API: /api/public/domain-lookup?hostname=careers.luckycell.co.id
        ↓
Backend return: { page_type: "careers", company_id: "xxx", domain: "luckycell.co.id" }
        ↓
Frontend render halaman Careers untuk Lucky Cell
```

---

## Troubleshooting

### DNS Belum Propagate
```bash
# Check DNS
nslookup luckycell.co.id
dig careers.luckycell.co.id
```

### SSL Error
```bash
# Generate SSL untuk domain baru
certbot certonly --nginx -d "newclient.com" -d "careers.newclient.com" -d "hr.newclient.com"

# Atau gunakan Cloudflare untuk SSL termination
```

### Domain Tidak Ditemukan
- Pastikan custom_domains sudah di-set di database
- Check API: `curl "https://app.makar.id/api/public/domain-lookup?hostname=luckycell.co.id"`

---

## Contoh Template Email untuk Client

```
Subject: Instruksi Setup Domain untuk HR System

Kepada Yth. IT Lucky Cell,

Untuk mengaktifkan sistem HR dengan domain perusahaan Anda, mohon tambahkan DNS record berikut:

Domain: luckycell.co.id

| Tipe  | Name    | Value           |
|-------|---------|-----------------|
| A     | @       | 103.xxx.xxx.xxx |
| CNAME | careers | luckycell.co.id |
| CNAME | hr      | luckycell.co.id |

Setelah DNS aktif (± 30 menit), akses:
- Company Profile: https://luckycell.co.id
- Lowongan Kerja: https://careers.luckycell.co.id
- Login Karyawan: https://hr.luckycell.co.id

Jika ada kendala, hubungi tim support kami.

Terima kasih,
Tim Makar.id
```

---

## API Reference

### Domain Lookup
```
GET /api/public/domain-lookup?hostname={domain}

Response:
{
  "found": true,
  "company_id": "xxx",
  "company_name": "PT. Lucky Cell",
  "domain": "luckycell.co.id",
  "page_type": "careers",  // "main", "careers", atau "hr"
  "logo_url": "https://..."
}
```

### Update Company Domains (Super Admin Only)
```
PUT /api/companies/{company_id}/domains
Authorization: Bearer {token}

Body:
{
  "main": "luckycell.co.id",
  "careers": "careers.luckycell.co.id",
  "hr": "hr.luckycell.co.id"
}
```
