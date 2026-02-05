# Main Domain Setup Guide (makar.id & app.makar.id)

## Overview
Sistem HR Makar.id menggunakan dua domain utama:
- **makar.id** - Landing page marketing
- **app.makar.id** - Dashboard aplikasi (Super Admin & Company Admin)

## DNS Configuration

### 1. Setup DNS Records di Domain Provider

Tambahkan DNS records berikut di panel domain Anda (misalnya Namecheap, GoDaddy, Cloudflare, dll):

```
Type    Name    Value               TTL
A       @       [SERVER_IP_ADDRESS]  300
A       app     [SERVER_IP_ADDRESS]  300
```

**Contoh:**
```
A       @       103.xxx.xxx.xxx     300
A       app     103.xxx.xxx.xxx     300
```

### 2. Verifikasi DNS Propagation

Setelah menambahkan DNS records, tunggu 5-15 menit dan verifikasi dengan:

```bash
# Check makar.id
dig makar.id

# Check app.makar.id  
dig app.makar.id

# Check menggunakan ping
ping makar.id
ping app.makar.id
```

## Nginx/Web Server Configuration

### Option 1: Nginx (Recommended)

Buat file konfigurasi `/etc/nginx/sites-available/makar.id`:

```nginx
# Landing Page - makar.id
server {
    listen 80;
    server_name makar.id www.makar.id;

    # React frontend for landing
    root /app/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}

# Dashboard Application - app.makar.id
server {
    listen 80;
    server_name app.makar.id;

    # React frontend for dashboard
    root /app/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site dan restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/makar.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Apache (.htaccess)

Untuk cPanel dengan Apache, buat file `.htaccess` di root directory:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Redirect all requests to React app
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>

# Proxy API requests to FastAPI backend
<IfModule mod_proxy.c>
    ProxyRequests Off
    ProxyPreserveHost On
    
    ProxyPass /api http://127.0.0.1:8001/api
    ProxyPassReverse /api http://127.0.0.1:8001/api
</IfModule>
```

## SSL/HTTPS Setup (Recommended)

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d makar.id -d www.makar.id -d app.makar.id

# Auto-renewal (automatically setup by certbot)
sudo certbot renew --dry-run
```

Setelah SSL installed, Nginx config akan otomatis updated untuk handle HTTPS.

## Environment Variables

Pastikan file `.env` sudah dikonfigurasi:

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://makar.id
```
atau untuk development:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=hr_system
JWT_SECRET=your-secret-key-here
CORS_ORIGINS=https://makar.id,https://app.makar.id,http://localhost:3000
```

## Application Routes Structure

### makar.id (Landing)
- `/` - Landing page (Hero, Features, Pricing, CTA)

### app.makar.id (Dashboard)
- `/login` - Super Admin login
- `/superadmin/dashboard` - Super Admin dashboard
- `/superadmin/companies` - Manage companies
- `/superadmin/users` - Manage users
- `/superadmin/settings` - Settings

### Client Custom Domains
- `company.client.com` atau `client.com` - Company profile
- `careers.client.com` - Careers page
- `hr.client.com` - Company login & admin dashboard

## Testing

### 1. Test Landing Page
```bash
curl -I https://makar.id
# Should return 200 OK with HTML content
```

### 2. Test Dashboard
```bash
curl -I https://app.makar.id/login
# Should return 200 OK with React app
```

### 3. Test API
```bash
curl https://app.makar.id/api/health
# Should return: {"status":"healthy","timestamp":"..."}
```

## Troubleshooting

### Issue: DNS not resolving
**Solution:** Wait for DNS propagation (up to 48 hours, usually 5-15 minutes)

### Issue: 502 Bad Gateway
**Solution:** 
- Check if backend is running: `sudo supervisorctl status backend`
- Restart backend: `sudo supervisorctl restart backend`
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`

### Issue: Page not found (404)
**Solution:**
- Ensure React build exists: `ls /app/frontend/build`
- Rebuild frontend: `cd /app/frontend && yarn build`
- Check Nginx configuration: `sudo nginx -t`

### Issue: CORS errors
**Solution:**
- Add your domains to `CORS_ORIGINS` in backend `.env`
- Restart backend: `sudo supervisorctl restart backend`

## Production Checklist

- [ ] DNS records configured and propagated
- [ ] SSL certificates installed and auto-renewal setup
- [ ] Environment variables configured for production
- [ ] Frontend built and deployed
- [ ] Backend running and accessible
- [ ] Nginx/Apache configuration tested
- [ ] API endpoints responding correctly
- [ ] Super Admin login working at app.makar.id/login
- [ ] Landing page loading at makar.id
- [ ] All routes accessible

## Support

For deployment assistance, refer to:
- `/app/docs/DEPLOYMENT.md` - General deployment guide
- `/app/docs/DNS_SETUP.md` - Client white-label domain setup

---
Last updated: February 2026
