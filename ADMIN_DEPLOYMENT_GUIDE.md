# Admin Deployment Button Guide

## ✅ What Was Fixed

The deployment button in the admin panel (`/admin`) now works correctly!

### Issues Fixed:
1. ✅ **Missing authentication** - API now requires admin token
2. ✅ **Missing deploy.sh script** - Created proper deployment script
3. ✅ **Better error handling** - Shows detailed error messages
4. ✅ **Proper git pull and rebuild** - Pulls latest code and rebuilds containers

---

## How to Use the Deployment Button

### Step 1: Access Admin Panel

1. Go to your site: `http://tarnovsky.ru/admin` or `https://forum.theholylabs.com/admin`
2. Make sure you're logged in as an admin

### Step 2: Deploy Latest Version

1. Scroll down to the **"Развертывание с GitHub"** section
2. Click the **"Развернуть"** button
3. Confirm the deployment when prompted
4. Wait 2-5 minutes for the deployment to complete

### What Happens During Deployment:

```
1. 📥 Pulls latest code from GitHub (main branch)
2. 🛑 Stops all containers
3. 🔨 Rebuilds the Next.js application
4. 🚀 Starts all services
5. ✅ Shows success message
```

---

## The Deployment Script

The deployment button runs `/root/iron-blog/deploy.sh` which:

```bash
#!/bin/bash
# Located at: /root/iron-blog/deploy.sh

1. Pulls latest code: git pull origin main
2. Stops containers: docker-compose down
3. Rebuilds app: docker-compose build nextjs-app
4. Starts services: docker-compose up -d
5. Shows status: docker-compose ps
```

---

## Manual Deployment (SSH)

If you prefer to deploy manually via SSH:

```bash
# Connect to server
ssh root@45.10.43.204

# Navigate to project
cd /root/iron-blog

# Run deployment script
./deploy.sh

# Or run commands manually:
git pull origin main
docker-compose down
docker-compose build nextjs-app
docker-compose up -d
```

---

## Troubleshooting

### "Deployment failed" Error

**Possible causes:**
1. Not logged in as admin
2. Network issues
3. Docker container issues

**Solution:**
```bash
# SSH to server and check logs
ssh root@45.10.43.204
cd /root/iron-blog
docker-compose logs nextjs-app --tail 50
```

### "Authentication required" Error

**Cause:** Not logged in or token expired

**Solution:**
1. Log out and log back in
2. Make sure you're logged in as an admin user
3. Try the deployment button again

### Deployment Takes Too Long

**Normal behavior:** Deployment can take 2-5 minutes because it:
- Pulls code from GitHub
- Rebuilds the Next.js application (compiles TypeScript, optimizes assets)
- Restarts all containers

**What to do:**
- Wait patiently
- Don't refresh the page
- The page will auto-reload when complete

---

## Deployment Flow Diagram

```
┌─────────────────────────────────────────────┐
│  Admin clicks "Развернуть" button          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Frontend sends POST to /api/admin/deploy   │
│  with authentication token                  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  API verifies admin token                   │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  API executes: bash /root/iron-blog/deploy.sh│
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  deploy.sh runs:                            │
│  1. git pull origin main                    │
│  2. docker-compose down                     │
│  3. docker-compose build nextjs-app         │
│  4. docker-compose up -d                    │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  API returns success/error to frontend      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  Frontend shows success message             │
│  and reloads page after 3 seconds           │
└─────────────────────────────────────────────┘
```

---

## Security Notes

1. **Admin Only:** Only users with `isAdmin: true` can deploy
2. **Authentication Required:** Must have valid admin token
3. **Production Only:** Deployment only works in production environment
4. **No Destructive Actions:** Deployment only pulls and rebuilds, doesn't delete data

---

## Files Modified

### Frontend:
- `src/app/admin/page.tsx` - Added auth token to deployment request

### Backend:
- `src/app/api/admin/deploy/route.ts` - Added authentication and better error handling

### Scripts:
- `deploy.sh` - New deployment script for git pull and rebuild

---

## Quick Reference

| Action | Command |
|--------|---------|
| Deploy via Admin Panel | Click "Развернуть" button |
| Deploy via SSH | `ssh root@45.10.43.204 'cd /root/iron-blog && ./deploy.sh'` |
| Check deployment status | `ssh root@45.10.43.204 'cd /root/iron-blog && docker-compose ps'` |
| View logs | `ssh root@45.10.43.204 'cd /root/iron-blog && docker logs iron-blog-nextjs-app-1'` |
| Manual rebuild | `ssh root@45.10.43.204 'cd /root/iron-blog && docker-compose build nextjs-app && docker-compose restart nextjs-app'` |

---

## Success Indicators

After successful deployment, you should see:

1. ✅ **Success message** in admin panel
2. ✅ **Page auto-reloads** after 3 seconds
3. ✅ **Latest commit** shown in deployment panel
4. ✅ **Site is accessible** at all URLs

---

## Need Help?

If deployment fails:
1. Check the error message in the admin panel
2. SSH to server and check logs: `docker-compose logs nextjs-app --tail 50`
3. Verify containers are running: `docker-compose ps`
4. Check memory usage: `free -h`
5. Try manual deployment via SSH

