#!/bin/bash
# ================================================
# Makar.id - Auto Deploy Script
# Jalankan: sudo bash scripts/deploy.sh
# ================================================

set -e

echo "========================================="
echo "  Makar.id Auto Deploy"
echo "========================================="

# Detect project directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "[1/5] Pulling latest code..."
git pull

echo "[2/5] Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
fi
pip install -r requirements.txt -q 2>/dev/null || pip3 install -r requirements.txt -q 2>/dev/null

echo "[3/5] Building frontend..."
cd "$PROJECT_DIR/frontend"
yarn install --silent 2>/dev/null
yarn build

echo "[4/5] Deploying files..."
# Copy frontend build
if [ -d "/var/www/makar" ]; then
    cp -r build/* /var/www/makar/
    echo "  Frontend deployed to /var/www/makar/"
fi

# Patch Nginx config for social media crawlers (OG meta)
NGINX_CONF=""
for f in /etc/nginx/sites-enabled/makar* /etc/nginx/conf.d/makar* /etc/nginx/sites-available/makar*; do
    if [ -f "$f" ]; then
        NGINX_CONF="$f"
        break
    fi
done

if [ -n "$NGINX_CONF" ]; then
    # Check if already patched
    if grep -q "facebookexternalhit\|WhatsApp.*Twitterbot" "$NGINX_CONF"; then
        echo "  Nginx OG meta already configured"
    else
        echo "  Patching Nginx for social media link previews..."
        # Replace simple 'try_files $uri /index.html;' with crawler detection
        sed -i 's|try_files \$uri /index.html;|# Social media crawler detection for dynamic OG meta\n        if (\$http_user_agent ~* "facebookexternalhit|WhatsApp|Twitterbot|LinkedIn|Slackbot|TelegramBot") {\n            rewrite ^(.*)$ /api/og-meta?path=\$1 break;\n            proxy_pass http://127.0.0.1:8001;\n        }\n        try_files \$uri /index.html;|' "$NGINX_CONF"
        
        # Validate nginx config
        if nginx -t 2>/dev/null; then
            systemctl reload nginx
            echo "  Nginx patched and reloaded successfully"
        else
            echo "  WARNING: Nginx config test failed. Reverting..."
            # Revert the change
            sed -i '/# Social media crawler detection/d' "$NGINX_CONF"
            sed -i '/facebookexternalhit/d' "$NGINX_CONF"
            sed -i '/rewrite.*og-meta/d' "$NGINX_CONF"
            sed -i '/proxy_pass.*8001/{ /location/!d }' "$NGINX_CONF"
            echo "  Reverted. Please check Nginx config manually."
        fi
    fi
else
    echo "  WARNING: Nginx config not found. Skipping OG meta patch."
    echo "  You may need to manually configure Nginx."
fi

echo "[5/5] Restarting backend..."
if systemctl is-active --quiet makar 2>/dev/null; then
    systemctl restart makar
    echo "  Backend service restarted"
elif command -v supervisorctl &>/dev/null; then
    supervisorctl restart backend 2>/dev/null || true
    echo "  Backend restarted via supervisor"
fi

echo ""
echo "========================================="
echo "  Deploy selesai!"
echo "========================================="
echo ""
echo "  Test:"
echo "  - https://makar.id/api/health"
echo "  - https://makar.id/api/seed/status"
echo ""
