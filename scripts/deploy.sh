#!/bin/bash
# ================================================
# Makar.id - Auto Deploy Script
# Jalankan: cd ~/makarid && sudo bash scripts/deploy.sh
# ================================================

set -e

echo "========================================="
echo "  Makar.id Auto Deploy"
echo "========================================="

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "[1/6] Pulling latest code..."
git pull

echo "[2/6] Installing backend dependencies..."
cd "$PROJECT_DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
fi
pip install -r requirements.txt -q 2>/dev/null || pip3 install -r requirements.txt -q

echo "[3/6] Building frontend..."
cd "$PROJECT_DIR/frontend"
yarn install --silent 2>/dev/null
yarn build

echo "[4/6] Deploying frontend..."
if [ -d "/var/www/makar" ]; then
    cp -r build/* /var/www/makar/
    echo "  Copied to /var/www/makar/"
fi

echo "[5/6] Updating Nginx config..."
NGINX_CONF_SRC="$PROJECT_DIR/nginx/makar.id.conf"
NGINX_CONF_DST=""

# Find existing nginx config
for f in /etc/nginx/sites-enabled/makar* /etc/nginx/conf.d/makar*; do
    if [ -f "$f" ]; then
        NGINX_CONF_DST="$f"
        break
    fi
done

if [ -n "$NGINX_CONF_DST" ] && [ -f "$NGINX_CONF_SRC" ]; then
    # Backup old config
    cp "$NGINX_CONF_DST" "${NGINX_CONF_DST}.bak"
    
    # Read SSL cert paths from existing config (preserve user's cert paths)
    SSL_CERT=$(grep -m1 "ssl_certificate " "$NGINX_CONF_DST" | awk '{print $2}' | tr -d ';')
    SSL_KEY=$(grep -m1 "ssl_certificate_key " "$NGINX_CONF_DST" | awk '{print $2}' | tr -d ';')
    
    # Read server_name from existing config (preserve user's domains)
    SERVER_NAMES=$(grep -A5 "listen 443" "$NGINX_CONF_DST" | grep "server_name" | sed 's/server_name//' | tr -d ';' | xargs)
    
    # Copy new template
    cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"
    
    # Patch SSL paths if different
    if [ -n "$SSL_CERT" ]; then
        sed -i "s|ssl_certificate .*|ssl_certificate $SSL_CERT;|" "$NGINX_CONF_DST"
    fi
    if [ -n "$SSL_KEY" ]; then
        sed -i "s|ssl_certificate_key .*|ssl_certificate_key $SSL_KEY;|" "$NGINX_CONF_DST"
    fi
    
    # Validate
    if nginx -t 2>&1; then
        systemctl reload nginx
        echo "  Nginx updated and reloaded"
    else
        echo "  ERROR: Nginx config invalid. Restoring backup..."
        cp "${NGINX_CONF_DST}.bak" "$NGINX_CONF_DST"
        nginx -t && systemctl reload nginx
        echo "  Restored old config. Please check nginx/makar.id.conf manually."
    fi
else
    echo "  WARNING: Nginx config not found. Copy manually:"
    echo "  sudo cp $PROJECT_DIR/nginx/makar.id.conf /etc/nginx/sites-enabled/makar.id"
    echo "  sudo nginx -t && sudo systemctl reload nginx"
fi

echo "[6/6] Restarting backend..."
if systemctl is-active --quiet makar 2>/dev/null; then
    systemctl restart makar
    echo "  Backend restarted"
fi

echo ""
echo "========================================="
echo "  Deploy selesai!"
echo "========================================="
echo ""
