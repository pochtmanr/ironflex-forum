#!/bin/bash

# Iron Blog Deployment Script
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting Iron Blog Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code from git...${NC}"
git pull origin main || {
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production not found!${NC}"
    echo -e "${YELLOW}Please create .env.production from .env.template${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install || {
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
}

# Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed. Install it with: npm install -g pm2${NC}"
    exit 1
fi

# Restart or start application
if pm2 list | grep -q "iron-blog"; then
    echo -e "${YELLOW}♻️  Restarting application...${NC}"
    pm2 restart iron-blog
else
    echo -e "${YELLOW}🚀 Starting application for the first time...${NC}"
    pm2 start npm --name "iron-blog" -- start
    pm2 save
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "=================================="
echo ""
echo -e "${YELLOW}📊 Application Status:${NC}"
pm2 status iron-blog

echo ""
echo -e "${YELLOW}📝 View logs with:${NC} pm2 logs iron-blog"
echo -e "${YELLOW}📊 Monitor with:${NC} pm2 monit"
echo -e "${YELLOW}🔄 Restart with:${NC} pm2 restart iron-blog"
echo ""
