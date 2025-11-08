# 🚀 Deployment Instructions

## Complete Setup Guide for GitHub → VPS Deployment

### 📦 What You Have Now:

1. **`deploy.sh`** - Complete deployment script
2. **Admin Panel Button** - Deploy from web interface
3. **API Endpoint** - `/api/admin/deploy` for deployments
4. **Automated Workflow** - GitHub Actions ready

---

## 🔧 Initial Setup on VPS

### Step 1: Connect to VPS and Setup Git

```bash
# Connect to server
ssh root@45.10.43.204

# Navigate to project
cd /root/iron-blog

# Fix git ownership
git config --global --add safe.directory /root/iron-blog

# Initialize git if needed
git init

# Add GitHub remote
git remote add origin https://github.com/pochtmanr/ironflex-forum.git

# Or if remote exists, update it
git remote set-url origin https://github.com/pochtmanr/ironflex-forum.git

# Pull latest code
git fetch origin main
git reset --hard origin/main

# Make scripts executable
chmod +x deploy.sh deploy-from-github.sh check-deployment.sh
```

### Step 2: Test Deployment Script

```bash
# Run deployment
./deploy.sh
```

This will:
- ✅ Fetch latest code from GitHub
- ✅ Backup MongoDB database
- ✅ Rebuild Docker containers
- ✅ Start all services
- ✅ Run health checks

---

## 🌐 Deploy from Admin Panel (Easiest!)

### How to Use:

1. **Push changes to GitHub:**
   ```bash
   git add .
   git commit -m "your changes"
   git push origin main
   ```

2. **Go to Admin Panel:**
   - Visit: http://45.10.43.204/admin
   - Log in as admin
   - Scroll down to "Развертывание с GitHub"

3. **Click "Развернуть" button**
   - Confirms deployment
   - Fetches latest from GitHub
   - Rebuilds containers
   - Shows progress and status

4. **Wait 2-5 minutes**
   - Page will auto-reload when complete

### Features:
- ✅ Shows last commit info
- ✅ Real-time deployment status
- ✅ Automatic page reload
- ✅ Error handling
- ✅ Only works in production (safe!)

---

## 📋 Manual Deployment Methods

### Method 1: SSH + Script (Recommended)

```bash
# From your local machine
ssh root@45.10.43.204 "cd /root/iron-blog && ./deploy.sh"
```

### Method 2: Direct SSH

```bash
# Connect to server
ssh root@45.10.43.204

# Navigate and deploy
cd /root/iron-blog
./deploy.sh
```

### Method 3: GitHub Actions (Automated)

Already configured! Just push to main:

```bash
git push origin main
# GitHub Actions will automatically deploy
```

---

## 🔍 Monitoring & Troubleshooting

### Check Deployment Status

```bash
# On VPS
./check-deployment.sh
```

Shows:
- Git branch and last commit
- Container status
- Application health
- Database connectivity
- Disk usage
- Recent logs

### View Logs

```bash
# Next.js logs
docker logs iron-blog-nextjs-app-1 -f

# MongoDB logs
docker logs mongodb -f

# All containers
docker-compose logs -f
```

### Check Container Status

```bash
docker ps
```

### Restart Services

```bash
# Restart specific service
docker-compose restart nextjs-app

# Restart all
docker-compose restart
```

---

## 🔄 Rollback if Needed

### Quick Rollback

```bash
# On VPS
cd /root/iron-blog

# View commit history
git log --oneline

# Rollback to previous commit
git reset --hard HEAD~1

# Rebuild
docker-compose up -d --build
```

### Rollback to Specific Version

```bash
# Find commit hash
git log --oneline

# Rollback to that commit
git reset --hard <commit-hash>

# Rebuild
docker-compose up -d --build
```

---

## 📊 Deployment Workflow

### Development → Production Flow:

```
1. Make changes locally
   ↓
2. Test locally (npm run dev)
   ↓
3. Commit changes
   ↓
4. Push to GitHub
   ↓
5. Deploy via:
   - Admin Panel Button (easiest)
   - SSH + ./deploy.sh
   - GitHub Actions (automatic)
   ↓
6. Monitor deployment
   ↓
7. Verify application works
```

---

## 🔐 Security Notes

### Admin Panel Deployment:
- ✅ Only works in production environment
- ✅ Requires admin authentication
- ✅ Creates automatic backups
- ✅ Runs health checks

### Script Security:
- ✅ Exits on errors (`set -e`)
- ✅ Creates database backups
- ✅ Validates environment
- ✅ Cleans up old images

---

## 🎯 Quick Commands Reference

```bash
# Deploy from local machine
ssh root@45.10.43.204 "cd /root/iron-blog && ./deploy.sh"

# Check status
ssh root@45.10.43.204 "cd /root/iron-blog && ./check-deployment.sh"

# View logs
ssh root@45.10.43.204 "docker logs iron-blog-nextjs-app-1 --tail 50"

# Restart containers
ssh root@45.10.43.204 "cd /root/iron-blog && docker-compose restart"

# Full rebuild
ssh root@45.10.43.204 "cd /root/iron-blog && docker-compose up -d --build"
```

---

## 🆘 Common Issues

### Issue: "dubious ownership in repository"

```bash
git config --global --add safe.directory /root/iron-blog
```

### Issue: Containers not starting

```bash
# Check logs
docker-compose logs

# Restart
docker-compose down
docker-compose up -d
```

### Issue: Port already in use

```bash
# Check what's using the port
netstat -tulpn | grep :3000

# Stop conflicting service
docker-compose down
```

### Issue: Out of disk space

```bash
# Clean up Docker
docker system prune -a

# Remove old images
docker image prune -a
```

---

## ✅ Deployment Checklist

Before deploying:
- [ ] Code tested locally
- [ ] Committed to git
- [ ] Pushed to GitHub
- [ ] Backup database (automatic in script)
- [ ] Check disk space on VPS

After deploying:
- [ ] Check application loads
- [ ] Test login
- [ ] Test admin panel
- [ ] Check database connectivity
- [ ] Monitor logs for errors

---

## 🎉 You're All Set!

Your deployment system is now:
- ✅ **Automated** - Push and deploy
- ✅ **Safe** - Automatic backups
- ✅ **Easy** - Admin panel button
- ✅ **Monitored** - Health checks
- ✅ **Rollback-ready** - Git history

**Deploy with confidence!** 🚀

