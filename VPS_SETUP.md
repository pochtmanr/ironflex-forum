# 🖥️ VPS Setup Instructions

## Run These Commands on Your VPS

### Step 1: Connect to VPS
```bash
ssh root@45.10.43.204
```

### Step 2: Navigate to Project
```bash
cd /root/iron-blog
```

### Step 3: Verify Repository (Important!)
```bash
# Check current remote
git remote -v

# Should show: https://github.com/pochtmanr/ironflex-forum.git
# If it shows anything else, fix it:
git remote set-url origin https://github.com/pochtmanr/ironflex-forum.git
```

### Step 4: Pull Latest Code
```bash
# Fix git permissions
git config --global --add safe.directory /root/iron-blog

# Pull latest
git pull origin main

# If you get conflicts, force reset:
git fetch origin main
git reset --hard origin/main
```

### Step 5: Make Scripts Executable
```bash
chmod +x *.sh
```

### Step 6: Verify Scripts Exist
```bash
ls -la *.sh
```

You should see:
- `deploy.sh`
- `deploy-from-github.sh`
- `check-deployment.sh`
- `verify-repo.sh`
- And others...

### Step 7: Run Deployment
```bash
./deploy.sh
```

This will:
- ✅ Fetch latest from GitHub
- ✅ Backup MongoDB
- ✅ Rebuild Docker containers
- ✅ Start all services
- ✅ Run health checks

---

## 🎯 Quick Commands

```bash
# One-liner to update and deploy
ssh root@45.10.43.204 "cd /root/iron-blog && git pull origin main && chmod +x *.sh && ./deploy.sh"

# Check status
ssh root@45.10.43.204 "cd /root/iron-blog && ./check-deployment.sh"

# View logs
ssh root@45.10.43.204 "docker logs iron-blog-nextjs-app-1 --tail 50"
```

---

## ✅ Verification

After deployment, check:

1. **Application:** http://45.10.43.204
2. **Admin Panel:** http://45.10.43.204/admin
3. **Containers:** `docker ps`

---

## 🚨 Troubleshooting

### If scripts are missing:
```bash
git fetch origin main
git reset --hard origin/main
chmod +x *.sh
```

### If deployment fails:
```bash
# Check logs
docker-compose logs

# Restart containers
docker-compose restart

# Full rebuild
docker-compose down
docker-compose up -d --build
```

### If git has issues:
```bash
git config --global --add safe.directory /root/iron-blog
git remote set-url origin https://github.com/pochtmanr/ironflex-forum.git
git fetch origin main
git reset --hard origin/main
```

---

## 📝 Repository Info

**Official Repository:** https://github.com/pochtmanr/ironflex-forum  
**Do NOT use:** Any other repository  
**VPS Path:** `/root/iron-blog`

