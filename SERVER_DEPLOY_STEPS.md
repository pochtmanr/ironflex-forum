# 🚀 Quick Server Deployment Steps

## On Your Server (SSH into your server first)

### 1. Pull Latest Code

```bash
cd /var/www/iron-blog  # or wherever your project is
git pull origin main
```

### 2. Create Production Environment File

```bash
# Copy template
cp .env.template .env.production

# Generate secure JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Edit .env.production and paste the generated secrets
nano .env.production
```

**Edit `.env.production` with these values:**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/iron-blog

# JWT Secrets (PASTE YOUR GENERATED VALUES HERE!)
JWT_SECRET=paste_your_generated_jwt_secret_here
JWT_REFRESH_SECRET=paste_your_generated_refresh_secret_here

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

### 3. Deploy

```bash
# Make deploy script executable (first time only)
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

That's it! The script will:
- ✅ Pull latest code
- ✅ Install dependencies
- ✅ Build the application
- ✅ Restart with PM2

### 4. Check Status

```bash
# View application status
pm2 status

# View logs
pm2 logs iron-blog

# Monitor in real-time
pm2 monit
```

---

## Future Updates

Whenever you push new code to GitHub, just run on the server:

```bash
cd /var/www/iron-blog
./deploy.sh
```

---

## Troubleshooting

### If deploy fails:

```bash
# Check logs
pm2 logs iron-blog --lines 50

# Restart manually
pm2 restart iron-blog

# Check environment file
cat .env.production
```

### If emails not sending:

```bash
# Test SMTP connection
telnet 95.163.180.91 25

# Check mail logs
sudo tail -f /var/log/mail.log
```

### If database connection fails:

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod
```

---

## Important Files

- `.env.production` - Production environment variables (NEVER commit to git!)
- `deploy.sh` - Deployment script
- `DEPLOYMENT.md` - Full deployment documentation
- `.env.template` - Template for environment variables

---

## Security Checklist

- [x] Code pushed to GitHub
- [ ] `.env.production` created on server
- [ ] JWT secrets generated and set
- [ ] MongoDB URI configured
- [ ] SMTP server accessible
- [ ] Application deployed and running
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Firewall configured
- [ ] DNS records set (SPF, DMARC)

---

**Questions?** Check the full guide: `DEPLOYMENT.md`

