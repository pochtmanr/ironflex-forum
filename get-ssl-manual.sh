#!/bin/bash

# Manual SSL certificate setup for tarnovsky.ru
# This script will guide you through getting SSL certificate using DNS validation

SERVER_IP="45.10.43.204"
SERVER_USER="root"
SERVER_PASS="xA8u55@H3M6sKx"

echo "=========================================="
echo "SSL Certificate Setup for tarnovsky.ru"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: First remove the old DNS record!"
echo ""
echo "In Timeweb DNS settings, you currently have TWO A records:"
echo "  1. tarnovsky.ru → 77.232.131.121 (OLD - DELETE THIS)"
echo "  2. tarnovsky.ru → 45.10.43.204 (NEW - KEEP THIS)"
echo ""
echo "You need to DELETE the old record (77.232.131.121)"
echo ""
read -p "Have you removed the old DNS record? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please remove the old DNS record first, then run this script again."
    exit 1
fi

echo ""
echo "Waiting for DNS to propagate (30 seconds)..."
sleep 30

echo ""
echo "Checking DNS..."
DNS_IPS=$(dig +short tarnovsky.ru)
echo "tarnovsky.ru resolves to: $DNS_IPS"

if echo "$DNS_IPS" | grep -q "77.232.131.121"; then
    echo ""
    echo "⚠️  Warning: DNS still shows old IP address (77.232.131.121)"
    echo "Please wait a few more minutes for DNS to propagate."
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Attempting to get SSL certificate..."
SSHPASS="$SERVER_PASS" sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T \
    "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /root/iron-blog

echo "=== Getting SSL certificate for tarnovsky.ru ==="
docker-compose run --rm --entrypoint "certbot certonly --webroot --webroot-path=/var/www/certbot --email admin@tarnovsky.ru --agree-tos --no-eff-email -d tarnovsky.ru -d www.tarnovsky.ru" certbot

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSL certificate obtained successfully!"
    echo ""
    echo "=== Updating nginx configuration ==="
    
    # Backup current config
    cp nginx.conf nginx.conf.backup
    
    # Update SSL certificate paths for tarnovsky.ru
    sed -i 's|ssl_certificate /etc/letsencrypt/live/forum.theholylabs.com/fullchain.pem;|ssl_certificate /etc/letsencrypt/live/tarnovsky.ru/fullchain.pem;|g' nginx.conf
    sed -i 's|ssl_certificate_key /etc/letsencrypt/live/forum.theholylabs.com/privkey.pem;|ssl_certificate_key /etc/letsencrypt/live/tarnovsky.ru/privkey.pem;|g' nginx.conf
    
    echo "=== Testing nginx configuration ==="
    docker exec nginx nginx -t
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "=== Restarting nginx ==="
        docker-compose restart nginx
        echo ""
        echo "✅ SSL certificate installed and nginx restarted!"
    else
        echo ""
        echo "❌ nginx configuration error, restoring backup"
        mv nginx.conf.backup nginx.conf
        docker-compose restart nginx
    fi
else
    echo ""
    echo "❌ Failed to obtain SSL certificate"
    echo ""
    echo "This usually means:"
    echo "  1. Old DNS record (77.232.131.121) is still active"
    echo "  2. DNS hasn't propagated yet (wait 5-10 more minutes)"
    echo "  3. Port 80 is not accessible from the internet"
fi
ENDSSH

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Test your site:"
echo "  http://tarnovsky.ru"
echo "  https://tarnovsky.ru"

