#!/bin/bash

# Secure deployment script for VPS
# Run this on the server to deploy from GitHub

set -e  # Exit on error

echo "🚀 Starting deployment from GitHub..."
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Check if there were any changes
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to pull from GitHub"
    exit 1
fi

# Backup database
echo "💾 Creating database backup..."
BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
docker exec mongodb mongodump --out="$BACKUP_DIR" 2>/dev/null || echo "⚠️  Warning: Backup failed (continuing anyway)"

# Stop containers
echo "🛑 Stopping containers..."
docker-compose down

# Rebuild containers
echo "🔨 Rebuilding containers..."
docker-compose build --no-cache

# Start containers
echo "▶️  Starting containers..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Health checks
echo "🏥 Running health checks..."
echo ""

# Check Next.js
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js app is running"
else
    echo "❌ Warning: Next.js app not responding"
fi

# Check MongoDB
if docker exec mongodb mongosh --quiet --eval "db.adminCommand({ping: 1}).ok" > /dev/null 2>&1; then
    echo "✅ MongoDB is running"
else
    echo "❌ Warning: MongoDB not responding"
fi

# Check Nginx
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Nginx is running"
else
    echo "❌ Warning: Nginx not responding"
fi

# Show container status
echo ""
echo "📊 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Clean up old images
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Quick commands:"
echo "  View logs: docker logs iron-blog-nextjs-app-1 --tail 50"
echo "  Check status: docker ps"
echo "  Restart: docker-compose restart"
echo "  Rollback: git reset --hard HEAD~1 && docker-compose up -d --build"

