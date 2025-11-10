# 🚀 Deployment Guide for Iron Blog

## Prerequisites

- Node.js 18+ installed on server
- MongoDB running
- SMTP server configured
- Git installed
- PM2 or similar process manager (recommended)

## 1. Server Setup

### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install MongoDB (if not already installed)
# Follow: https://docs.mongodb.com/manual/installation/
```

## 2. Clone Repository

```bash
# Navigate to your web directory
cd /var/www  # or your preferred location

# Clone the repository
git clone https://github.com/YOUR_USERNAME/iron-blog.git
cd iron-blog

# Or if already cloned, pull latest changes
git pull origin main
```

## 3. Configure Environment Variables

### Create Production Environment File

```bash
# Copy template
cp .env.template .env.production

# Edit with your production values
nano .env.production
```

### Generate Secure JWT Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET (use different value!)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Example Production `.env.production`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/iron-blog

# JWT Secrets (use your generated values!)
JWT_SECRET=your_generated_64_char_hex_string_here
JWT_REFRESH_SECRET=your_different_generated_64_char_hex_string_here

# Site
NEXT_PUBLIC_SITE_URL=https://tarnovsky.ru
BRAND_NAME=Клинический Протокол Тарновского

# Email
SMTP_HOST=95.163.180.91
SMTP_PORT=25
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=admin@tarnovsky.ru

# Admin
ADMIN_EMAIL=admin@tarnovsky.ru
```

## 4. Install Dependencies & Build

```bash
# Install Node modules
npm install

# Build for production
npm run build
```

## 5. Configure SMTP Server

Ensure your SMTP server (`95.163.180.91`) is configured:

### Postfix Configuration (if using Postfix)

```bash
# Edit main.cf
sudo nano /etc/postfix/main.cf
```

Add/update:
```
myhostname = tarnovsky.ru
mydomain = tarnovsky.ru
myorigin = $mydomain
inet_interfaces = all
mydestination = $myhostname, localhost.$mydomain, localhost, $mydomain
mynetworks = 127.0.0.0/8, YOUR_NEXTJS_SERVER_IP/32
```

Restart Postfix:
```bash
sudo systemctl restart postfix
```

### DNS Configuration

Add these DNS records to `tarnovsky.ru`:

```dns
# SPF Record
Type: TXT
Name: @
Value: v=spf1 ip4:95.163.180.91 ~all

# DMARC Record
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@tarnovsky.ru

# MX Record (if receiving emails)
Type: MX
Name: @
Value: 10 mail.tarnovsky.ru
```

## 6. Start Application

### Option A: Using PM2 (Recommended)

```bash
# Start with PM2
pm2 start npm --name "iron-blog" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Monitor logs
pm2 logs iron-blog

# Other useful PM2 commands
pm2 status              # Check status
pm2 restart iron-blog   # Restart app
pm2 stop iron-blog      # Stop app
pm2 delete iron-blog    # Remove from PM2
```

### Option B: Using systemd

Create service file:
```bash
sudo nano /etc/systemd/system/iron-blog.service
```

Add:
```ini
[Unit]
Description=Iron Blog Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/iron-blog
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable iron-blog
sudo systemctl start iron-blog
sudo systemctl status iron-blog
```

## 7. Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/tarnovsky.ru
```

Add:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tarnovsky.ru www.tarnovsky.ru;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tarnovsky.ru www.tarnovsky.ru;

    # SSL Configuration (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tarnovsky.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tarnovsky.ru/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js
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

    # File uploads
    client_max_body_size 10M;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/tarnovsky.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 8. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d tarnovsky.ru -d www.tarnovsky.ru

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

## 9. MongoDB Security

```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create app user
use iron-blog
db.createUser({
  user: "ironblog",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [ { role: "readWrite", db: "iron-blog" } ]
})

# Enable authentication in MongoDB config
sudo nano /etc/mongod.conf
```

Add:
```yaml
security:
  authorization: enabled
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

Update `.env.production`:
```env
MONGODB_URI=mongodb://ironblog:STRONG_PASSWORD_HERE@localhost:27017/iron-blog
```

## 10. Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
echo "🚀 Deploying Iron Blog..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Restart application
echo "♻️  Restarting application..."
pm2 restart iron-blog

echo "✅ Deployment complete!"
echo "📊 Checking status..."
pm2 status iron-blog
```

Make executable:
```bash
chmod +x deploy.sh
```

## 11. Future Deployments

```bash
# Simply run:
./deploy.sh
```

## 12. Monitoring & Logs

```bash
# PM2 logs
pm2 logs iron-blog

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Application logs
pm2 logs iron-blog --lines 100
```

## 13. Backup Strategy

### MongoDB Backup

```bash
# Create backup script
nano ~/backup-mongodb.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mongodump --out $BACKUP_DIR/backup_$DATE
# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

Setup cron:
```bash
chmod +x ~/backup-mongodb.sh
crontab -e
```

Add:
```
0 2 * * * /home/username/backup-mongodb.sh
```

## 14. Troubleshooting

### Application won't start
```bash
pm2 logs iron-blog
# Check for errors in logs
```

### Email not sending
```bash
# Test SMTP connection
telnet 95.163.180.91 25
# Check Postfix logs
sudo tail -f /var/log/mail.log
```

### Database connection issues
```bash
# Check MongoDB status
sudo systemctl status mongod
# Check connection
mongosh --eval "db.adminCommand('ping')"
```

## 15. Security Checklist

- [ ] Strong JWT secrets generated
- [ ] MongoDB authentication enabled
- [ ] Firewall configured (ufw/iptables)
- [ ] SSL certificate installed
- [ ] Regular backups scheduled
- [ ] PM2 monitoring active
- [ ] Nginx security headers configured
- [ ] File upload limits set
- [ ] SMTP relay restricted
- [ ] DNS records configured (SPF, DMARC)

## 16. Performance Optimization

```bash
# Enable PM2 cluster mode
pm2 start npm --name "iron-blog" -i max -- start

# Monitor performance
pm2 monit
```

---

## Quick Reference Commands

```bash
# Deploy
./deploy.sh

# Restart
pm2 restart iron-blog

# Logs
pm2 logs iron-blog

# Status
pm2 status

# MongoDB backup
~/backup-mongodb.sh

# SSL renewal
sudo certbot renew
```

---

**Need Help?** Check logs first:
- Application: `pm2 logs iron-blog`
- Nginx: `/var/log/nginx/error.log`
- MongoDB: `/var/log/mongodb/mongod.log`
- Email: `/var/log/mail.log`

