#!/bin/bash

# Setup script for tarnovsky.ru domain
# This will configure nginx and obtain SSL certificate for tarnovsky.ru

SERVER_IP="45.10.43.204"
SERVER_USER="root"
SERVER_PASS="xA8u55@H3M6sKx"
DOMAIN="tarnovsky.ru"

echo "=========================================="
echo "Setting up tarnovsky.ru domain"
echo "=========================================="
echo ""

echo "Step 1: Upload updated nginx configuration"
echo "-------------------------------------------"
SSHPASS="$SERVER_PASS" sshpass -e scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    nginx.conf "$SERVER_USER@$SERVER_IP:/root/iron-blog/"

if [ $? -eq 0 ]; then
    echo "✅ nginx.conf uploaded successfully"
else
    echo "❌ Failed to upload nginx.conf"
    exit 1
fi

echo ""
echo "Step 2: Test nginx configuration"
echo "-------------------------------------------"
SSHPASS="$SERVER_PASS" sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T \
    "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /root/iron-blog
docker exec nginx nginx -t
ENDSSH

if [ $? -eq 0 ]; then
    echo "✅ nginx configuration is valid"
else
    echo "❌ nginx configuration has errors"
    exit 1
fi

echo ""
echo "Step 3: Reload nginx with new configuration"
echo "-------------------------------------------"
SSHPASS="$SERVER_PASS" sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T \
    "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /root/iron-blog
docker-compose restart nginx
sleep 3
docker-compose ps nginx
ENDSSH

echo ""
echo "Step 4: Obtain SSL certificate for tarnovsky.ru"
echo "-------------------------------------------"
echo "NOTE: Before running this, make sure tarnovsky.ru DNS points to $SERVER_IP"
echo ""
read -p "Has tarnovsky.ru DNS been updated to point to $SERVER_IP? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Obtaining SSL certificate..."
    SSHPASS="$SERVER_PASS" sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -T \
        "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /root/iron-blog

# Get certificate for tarnovsky.ru and www.tarnovsky.ru
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@tarnovsky.ru \
    --agree-tos \
    --no-eff-email \
    -d tarnovsky.ru \
    -d www.tarnovsky.ru

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully"
    
    # Update nginx to use the new certificate
    echo "Updating nginx configuration to use tarnovsky.ru certificate..."
    
    # Reload nginx
    docker-compose restart nginx
    echo "✅ nginx reloaded with SSL certificate"
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Make sure:"
    echo "  1. DNS for tarnovsky.ru points to $SERVER_IP"
    echo "  2. Port 80 is accessible from the internet"
    echo "  3. nginx is running and serving /.well-known/acme-challenge/"
fi
ENDSSH
else
    echo ""
    echo "⚠️  Please update DNS first:"
    echo "   1. Go to your DNS provider (looks like Timeweb)"
    echo "   2. Update A record for tarnovsky.ru to: $SERVER_IP"
    echo "   3. Update A record for www.tarnovsky.ru to: $SERVER_IP"
    echo "   4. Wait 5-10 minutes for DNS to propagate"
    echo "   5. Run this script again"
fi

echo ""
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Your site should now be accessible at:"
echo "  - http://tarnovsky.ru"
echo "  - http://forum.theholylabs.com"
echo ""
echo "Once SSL is configured:"
echo "  - https://tarnovsky.ru"
echo "  - https://forum.theholylabs.com"

