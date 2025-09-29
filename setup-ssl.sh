#!/bin/bash

echo "🔧 SETTING UP SSL CERTIFICATE FOR forum.theholylabs.com"
echo "======================================================="

# Step 1: Restart nginx with new domain config
echo "1. Restarting nginx with domain configuration..."
sudo docker compose restart nginx
if [ $? -ne 0 ]; then
    echo "❌ Failed to restart nginx"
    exit 1
fi

# Step 2: Wait for nginx to be ready
echo "2. Waiting for nginx to be ready..."
sleep 5

# Step 3: Test HTTP first
echo "3. Testing HTTP connection..."
curl -I http://forum.theholylabs.com/
if [ $? -ne 0 ]; then
    echo "❌ HTTP not working, check domain DNS"
    exit 1
fi

# Step 4: Get SSL certificate
echo "4. Getting SSL certificate with Let's Encrypt..."
sudo docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@theholylabs.com \
    --agree-tos \
    --no-eff-email \
    -d forum.theholylabs.com

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"
    
    # Step 5: Restart nginx to enable HTTPS
    echo "5. Restarting nginx to enable HTTPS..."
    sudo docker compose restart nginx
    
    echo "🎉 HTTPS SETUP COMPLETE!"
    echo "Your forum is now available at:"
    echo "🌐 https://forum.theholylabs.com/"
    
    # Test HTTPS
    echo "6. Testing HTTPS connection..."
    curl -I https://forum.theholylabs.com/
else
    echo "❌ Failed to get SSL certificate"
    echo "Make sure:"
    echo "- Domain DNS points to this server"
    echo "- Port 80 is accessible from internet"
    echo "- No firewall blocking HTTP traffic"
fi
