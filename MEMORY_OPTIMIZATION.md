# Memory Optimization Guide for 4GB Server

## 🚨 Problem
Your server was using all 4GB of RAM and crashing because:
1. Node.js was configured to use up to 2GB during build
2. No memory limits on Docker containers
3. MongoDB cache was unlimited
4. Too many database connections (pool size of 10)

## ✅ Solutions Implemented

### 1. Docker Container Memory Limits
Each container now has strict memory limits:
- **MongoDB**: 1GB (with 0.5GB cache limit)
- **Next.js App**: 1.5GB
- **Fileserver**: 512MB
- **Nginx**: 256MB
- **Total**: ~3.25GB (leaving 750MB for system)

### 2. Node.js Memory Limits
- Build time: 512MB (`--max-old-space-size=512`)
- Runtime: 1GB (`--max-old-space-size=1024`)

### 3. MongoDB Optimizations
- Reduced connection pool from 10 to 5
- Set WiredTiger cache to 0.5GB
- Enabled connection timeouts

### 4. Application Optimizations
- Disabled Next.js telemetry
- Removed console logs in production
- Optimized image handling (unoptimized mode)

## 📦 Deployment

### Quick Deploy (Recommended)
```bash
./deploy-optimized.sh
```

This script:
- Stops existing containers
- Cleans up Docker resources
- Builds with memory constraints
- Starts services one by one
- Shows memory usage

### Manual Deploy
```bash
# Stop containers
docker-compose down

# Clean up
docker system prune -f --volumes

# Rebuild
docker-compose build --no-cache

# Start
docker-compose up -d
```

## 📊 Monitoring

### Real-time Monitoring
```bash
./monitor-memory.sh
```

### One-time Check
```bash
# System memory
free -h

# Docker stats
docker stats

# Container-specific
docker stats mongodb nextjs-app fileserver nginx
```

### Check Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f nextjs-app
docker-compose logs -f mongodb
```

## 🔧 Troubleshooting

### If Server Still Crashes

1. **Check which container is using too much memory:**
```bash
docker stats --no-stream
```

2. **Reduce memory limits further:**
Edit `docker-compose.yml` and reduce `mem_limit` values

3. **Check MongoDB logs:**
```bash
docker logs mongodb
```

4. **Restart specific container:**
```bash
docker-compose restart nextjs-app
```

### If Application is Slow

1. **Check if containers are hitting memory limits:**
```bash
docker stats
```

2. **Increase memory for Next.js app:**
Edit `docker-compose.yml`:
```yaml
nextjs-app:
  mem_limit: 2g  # Increase from 1.5g
```

But make sure total doesn't exceed 3.5GB!

### If MongoDB Crashes

1. **Check MongoDB memory usage:**
```bash
docker exec mongodb mongo admin -u admin -p StrongPassword123! --eval "db.serverStatus().mem"
```

2. **Reduce cache size further:**
Edit `docker-compose.yml`:
```yaml
command: --bind_ip_all --auth --wiredTigerCacheSizeGB 0.25
```

## 🎯 Best Practices

### DO:
✅ Monitor memory regularly
✅ Keep Docker images small
✅ Clean up old images: `docker image prune -af`
✅ Use connection pooling wisely
✅ Set proper timeouts
✅ Enable swap if needed (but it's slow)

### DON'T:
❌ Run development mode in production
❌ Keep unnecessary containers running
❌ Upload extremely large files
❌ Keep old Docker images
❌ Run multiple builds simultaneously

## 📈 Upgrade Path

If you continue to have memory issues, consider:

1. **Upgrade to 8GB RAM** (recommended)
   - Costs ~$5-10 more per month
   - Much more stable
   - Better performance

2. **Use external MongoDB** (like MongoDB Atlas)
   - Free tier available
   - Saves 1GB on your server
   - Better reliability

3. **Use external file storage** (like S3, Cloudflare R2)
   - Saves memory and disk space
   - Better for scaling

4. **Enable swap** (temporary solution)
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 🔍 Memory Usage Breakdown

Current allocation:
```
MongoDB:    1.0 GB (25%)
Next.js:    1.5 GB (37.5%)
Fileserver: 0.5 GB (12.5%)
Nginx:      0.25 GB (6.25%)
System:     0.75 GB (18.75%)
--------------------------
Total:      4.0 GB (100%)
```

## 📞 Emergency Commands

If server becomes unresponsive:

```bash
# SSH into server
ssh user@your-server

# Kill all Docker containers
docker kill $(docker ps -q)

# Free up memory
docker system prune -af --volumes

# Restart Docker
sudo systemctl restart docker

# Start only essential services
docker-compose up -d mongodb fileserver nextjs-app
```

## 📝 Notes

- These settings are optimized for a 4GB server
- Adjust based on your actual usage patterns
- Monitor for at least 24 hours after deployment
- Keep backups of your database!

