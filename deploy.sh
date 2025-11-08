#!/bin/bash

# Complete deployment script for VPS
# Fetches latest from GitHub and rebuilds Docker containers

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════╗"
echo "║         🚀 Iron Blog Deployment Script                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.yml not found!${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Fix git ownership issue
echo "🔧 Fixing git permissions..."
git config --global --add safe.directory $(pwd) 2>/dev/null || true

# Check current git status
echo "📊 Current status:"
echo "   Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
echo "   Last commit: $(git log -1 --oneline 2>/dev/null || echo 'unknown')"
echo ""

# Fetch latest changes
echo "📥 Fetching latest changes from GitHub..."
if git fetch origin main 2>/dev/null; then
    echo -e "${GREEN}✓ Fetch successful${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Could not fetch from GitHub${NC}"
    echo "Continuing with local version..."
fi

# Check if there are updates
LOCAL=$(git rev-parse @{0} 2>/dev/null || echo "")
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

if [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}✓ Already up to date${NC}"
else
    echo "📦 Pulling latest changes..."
    git reset --hard origin/main
    echo -e "${GREEN}✓ Code updated${NC}"
fi

# Create backup directory
BACKUP_DIR="/backup"
mkdir -p "$BACKUP_DIR"

# Backup database
echo ""
echo "💾 Creating database backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if docker exec mongodb mongodump --out="$BACKUP_DIR/$TIMESTAMP" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_DIR/$TIMESTAMP${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Backup failed (continuing anyway)${NC}"
fi

# Stop containers
echo ""
echo "🛑 Stopping containers..."
docker-compose down
echo -e "${GREEN}✓ Containers stopped${NC}"

# Remove old images (optional)
echo ""
echo "🧹 Cleaning up old images..."
docker image prune -f > /dev/null 2>&1
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Rebuild containers
echo ""
echo "🔨 Building containers (this may take a few minutes)..."
if docker-compose build --no-cache; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    echo "Attempting to restore previous version..."
    docker-compose up -d
    exit 1
fi

# Start containers
echo ""
echo "▶️  Starting containers..."
if docker-compose up -d; then
    echo -e "${GREEN}✓ Containers started${NC}"
else
    echo -e "${RED}❌ Failed to start containers!${NC}"
    exit 1
fi

# Wait for services to start
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 15

# Health checks
echo ""
echo "🏥 Running health checks..."
HEALTH_OK=true

# Check Next.js
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Next.js app is running${NC}"
else
    echo -e "${RED}✗ Next.js app not responding${NC}"
    HEALTH_OK=false
fi

# Check MongoDB
if docker exec mongodb mongosh --quiet --eval "db.adminCommand({ping: 1}).ok" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${RED}✗ MongoDB not responding${NC}"
    HEALTH_OK=false
fi

# Check Nginx
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${YELLOW}⚠️  Nginx not responding (may be normal)${NC}"
fi

# Check File Server
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ File Server is running${NC}"
else
    echo -e "${YELLOW}⚠️  File Server not responding${NC}"
fi

# Show container status
echo ""
echo "📊 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Final status
echo ""
if [ "$HEALTH_OK" = true ]; then
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║          ✅ Deployment Successful!                    ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "🌐 Application: http://$(hostname -I | awk '{print $1}')"
    echo "📊 Admin Panel: http://$(hostname -I | awk '{print $1}')/admin"
else
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║          ⚠️  Deployment Completed with Warnings       ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "Some services may not be responding correctly."
    echo "Check logs with: docker-compose logs"
fi

echo ""
echo "📝 Useful commands:"
echo "   View logs: docker logs iron-blog-nextjs-app-1 -f"
echo "   Restart: docker-compose restart"
echo "   Stop: docker-compose down"
echo "   Status: docker ps"

