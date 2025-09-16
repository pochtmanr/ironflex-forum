#!/bin/bash
# SSL Setup with Let's Encrypt

echo "🔒 Setting up SSL with Let's Encrypt..."

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

echo "📝 Before running SSL setup:"
echo "1. Make sure your domain points to this server"
echo "2. Replace YOUR_DOMAIN in nginx config"
echo "3. Test nginx config: sudo nginx -t"
echo ""
echo "To get SSL certificate, run:"
echo "sudo certbot --nginx -d yourdomain.com"
echo ""
echo "Auto-renewal is set up automatically!"

# Set up auto-renewal (certbot usually does this automatically)
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "✅ SSL setup ready!"
