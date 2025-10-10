# Quick Deployment Commands

## Option 1: Use Deployment Script (Recommended)

```bash
chmod +x deploy.sh
./deploy.sh
```

## Option 2: Manual Commands (Copy & Paste)

### On Your Local Machine:

```bash
# 1. Check status
git status

# 2. Add all changes
git add .

# 3. Commit with message
git commit -m "Updated VK auth and bug fixes"

# 4. Push to repository
git push origin main
```

### On Your Server (SSH):

```bash
# 1. SSH to server
ssh root@forum.theholylabs.com

# 2. Navigate to project
cd /root/forumnextjs/iron-blog

# 3. Pull latest code
git pull

# 4. Stop containers
docker compose down

# 5. Rebuild Next.js container
docker compose build --no-cache nextjs-app

# 6. Start all containers
docker compose up -d

# 7. Check status
docker compose ps

# 8. View logs (optional)
docker compose logs -f nextjs-app
```

## Option 3: Quick One-Liner for Server

After pushing to git, run this on the server:

```bash
ssh root@forum.theholylabs.com "cd /root/forumnextjs/iron-blog && git pull && docker compose down && docker compose build --no-cache nextjs-app && docker compose up -d && docker compose ps"
```

## Option 4: Update Only (No Rebuild)

If you only changed code (no package.json changes):

```bash
# On server
cd /root/forumnextjs/iron-blog
git pull
docker compose restart nextjs-app
```

## Verify Deployment

```bash
# Check if containers are running
docker compose ps

# Check logs for errors
docker compose logs --tail=100 nextjs-app

# Test the site
curl https://forum.theholylabs.com/health
```

## Rollback if Needed

```bash
# On server
cd /root/forumnextjs/iron-blog
git log --oneline  # Find previous commit hash
git reset --hard <previous-commit-hash>
docker compose down
docker compose up -d --build
```

## Common Issues

### Issue: Old version still showing
**Solution:** Clear browser cache or use incognito mode

### Issue: Container won't start
**Solution:** Check logs
```bash
docker compose logs nextjs-app
```

### Issue: Build fails
**Solution:** Clear Docker cache
```bash
docker system prune -a
docker compose build --no-cache
docker compose up -d
```

### Issue: Port conflicts
**Solution:** Check what's using the port
```bash
netstat -tulpn | grep :3000
```

## Environment Variables on Server

Make sure your server has `.env.production` with:

```env
MONGODB_URI=mongodb://admin:StrongPassword123!@mongodb:27017/ironblog?authSource=admin
VK_APP_ID=54219432
VK_SECRET_KEY=qN5oY1IJe9uUFsxxRTil
VK_SERVICE_KEY=e60b849ae60b849ae60b849a0ee530d632ee60be60b849a8eedd4c410c10ed625908ed1
NEXT_PUBLIC_VK_APP_ID=54219432
NEXT_PUBLIC_SITE_URL=https://forum.theholylabs.com
```

## Quick Reference

```bash
# Deploy everything
git add . && git commit -m "Update" && git push && ssh root@forum.theholylabs.com "cd /root/forumnextjs/iron-blog && git pull && docker compose down && docker compose build --no-cache && docker compose up -d"

# Just restart
ssh root@forum.theholylabs.com "cd /root/forumnextjs/iron-blog && docker compose restart"

# View logs
ssh root@forum.theholylabs.com "cd /root/forumnextjs/iron-blog && docker compose logs -f nextjs-app"
```

