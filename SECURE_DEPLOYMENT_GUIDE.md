# 🔒 Secure Deployment Guide

## Current Situation

- **GitHub Repo:** https://github.com/pochtmanr/ironflex-forum (OLD React/Firebase version)
- **Current Project:** Next.js 15 + MongoDB (COMPLETELY DIFFERENT)
- **VPS Server:** 45.10.43.204 (Running Docker containers)

## ✅ Recommended: Replace & Automate

### Step 1: Backup Current GitHub Repo (Optional)

```bash
# If you want to keep the old version
cd /Users/romanpochtman/Developer/forumnextjs/iron-blog
git clone https://github.com/pochtmanr/ironflex-forum.git old-ironflex-backup
```

### Step 2: Initialize Git in Current Project

```bash
cd /Users/romanpochtman/Developer/forumnextjs/iron-blog

# Initialize git
git init

# Add remote (will replace old repo)
git remote add origin https://github.com/pochtmanr/ironflex-forum.git

# Create .gitignore if not exists
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env*.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# MongoDB data
data/
mongodb-data/

# Temporary files
temp-sync-data/
server-data-export/
*.tmp

# Python virtual environment
venv/
__pycache__/
*.pyc

# Uploads (if you don't want to commit them)
fileserver/uploads/*
!fileserver/uploads/.gitkeep
EOF

# Add all files
git add .

# Initial commit
git commit -m "feat: Complete rewrite - Next.js 15 + MongoDB forum platform

- Migrated from React/Firebase to Next.js 15 + MongoDB
- Added admin panel with full CRUD operations
- Implemented authentication with JWT
- Added file upload service
- Docker containerization
- Nginx reverse proxy
- SSL/TLS support
- Direct server database connection for development"

# Force push (replaces old repo)
git push -f origin main
```

### Step 3: Create GitHub Actions for Automated Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Deploy to VPS
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USER }}
        password: ${{ secrets.VPS_PASSWORD }}
        script: |
          cd /root/iron-blog
          
          # Pull latest changes
          git pull origin main
          
          # Rebuild and restart containers
          docker-compose down
          docker-compose build --no-cache
          docker-compose up -d
          
          # Clean up old images
          docker image prune -f
          
          echo "Deployment completed successfully!"
```

### Step 4: Set Up GitHub Secrets

1. Go to: https://github.com/pochtmanr/ironflex-forum/settings/secrets/actions
2. Add these secrets:
   - `VPS_HOST`: `45.10.43.204`
   - `VPS_USER`: `root`
   - `VPS_PASSWORD`: `xA8u55@H3M6sKx`

### Step 5: Initialize Git on VPS Server

```bash
# Connect to server
ssh root@45.10.43.204

# Navigate to project
cd /root/iron-blog

# Initialize git if not already
git init

# Add your GitHub as remote
git remote add origin https://github.com/pochtmanr/ironflex-forum.git

# Pull the code
git pull origin main

# Set up git to remember credentials (optional)
git config credential.helper store
```

## 🔐 Security Best Practices

### 1. Use SSH Keys Instead of Password

**On your local machine:**

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to server
ssh-copy-id root@45.10.43.204

# Test connection
ssh root@45.10.43.204
```

**Update GitHub Actions to use SSH key:**

```yaml
- name: Deploy to VPS
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.VPS_HOST }}
    username: ${{ secrets.VPS_USER }}
    key: ${{ secrets.VPS_SSH_KEY }}  # Instead of password
    script: |
      cd /root/iron-blog
      git pull origin main
      docker-compose up -d --build
```

### 2. Create Deploy User (Don't Use Root)

```bash
# On VPS server
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Copy project to deploy user
cp -r /root/iron-blog /home/deploy/
chown -R deploy:deploy /home/deploy/iron-blog

# Use 'deploy' user in GitHub Actions instead of 'root'
```

### 3. Use GitHub Deploy Keys

```bash
# On VPS server as deploy user
ssh-keygen -t ed25519 -C "deploy@ironflex"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: 
# https://github.com/pochtmanr/ironflex-forum/settings/keys
```

### 4. Environment Variables Security

**Never commit these files:**
- `.env`
- `.env.local`
- `.env.production`

**Store secrets in:**
1. GitHub Secrets (for CI/CD)
2. Server environment files (encrypted)

### 5. Create Deployment Script

Create `deploy-from-github.sh`:

```bash
#!/bin/bash

# Secure deployment script
set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Backup current state
echo "💾 Creating backup..."
docker-compose exec mongodb mongodump --out=/backup/$(date +%Y%m%d_%H%M%S)

# Rebuild containers
echo "🔨 Rebuilding containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services..."
sleep 10

# Health check
echo "🏥 Running health checks..."
curl -f http://localhost:3000 || echo "Warning: Next.js not responding"
docker exec mongodb mongosh --eval "db.adminCommand({ping: 1})" || echo "Warning: MongoDB not responding"

echo "✅ Deployment complete!"
```

## 📋 Deployment Workflow

### Manual Deployment (Secure)

```bash
# 1. On local machine - commit and push
git add .
git commit -m "feat: your changes"
git push origin main

# 2. On VPS server - pull and deploy
ssh root@45.10.43.204
cd /root/iron-blog
./deploy-from-github.sh
```

### Automated Deployment (GitHub Actions)

1. Push to `main` branch
2. GitHub Actions automatically deploys
3. Receive notification on success/failure

## 🔄 Rollback Strategy

```bash
# On VPS server
cd /root/iron-blog

# View commit history
git log --oneline

# Rollback to previous version
git reset --hard <commit-hash>
docker-compose up -d --build

# Or rollback one commit
git reset --hard HEAD~1
docker-compose up -d --build
```

## 📊 Monitoring Deployments

Create `check-deployment.sh`:

```bash
#!/bin/bash

echo "=== Deployment Status ==="
echo "Git branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --oneline)"
echo ""
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== Application Health ==="
curl -s http://localhost:3000/api/health || echo "❌ App not responding"
echo ""
echo "=== Database Status ==="
docker exec mongodb mongosh --quiet --eval "db.serverStatus().ok" || echo "❌ DB not responding"
```

## 🎯 Recommended Setup

1. **Replace old GitHub repo** with current code
2. **Set up GitHub Actions** for automated deployment
3. **Use SSH keys** instead of passwords
4. **Create deploy user** (don't use root)
5. **Enable automatic backups** before each deployment
6. **Set up monitoring** (health checks)

## 🚨 Important Notes

- **Backup database** before each deployment
- **Test locally** before pushing to main
- **Use branches** for features (main = production)
- **Never commit** `.env` files
- **Monitor logs** after deployment
- **Keep secrets** in GitHub Secrets, not in code

## 📞 Quick Commands

```bash
# Local: Push changes
git add . && git commit -m "your message" && git push

# Server: Deploy
ssh root@45.10.43.204 "cd /root/iron-blog && ./deploy-from-github.sh"

# Server: Check status
ssh root@45.10.43.204 "cd /root/iron-blog && ./check-deployment.sh"

# Server: View logs
ssh root@45.10.43.204 "docker logs iron-blog-nextjs-app-1 --tail 50"

# Server: Rollback
ssh root@45.10.43.204 "cd /root/iron-blog && git reset --hard HEAD~1 && docker-compose up -d --build"
```

---

**Your deployment is now secure, automated, and easy to rollback!** 🎉

