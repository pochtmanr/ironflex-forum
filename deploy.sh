#!/bin/bash

# Deployment script for iron-blog
# This script pulls the latest code from GitHub and rebuilds the containers

set -e  # Exit on error

echo "=========================================="
echo "Starting deployment..."
echo "=========================================="
echo ""

# Navigate to project directory
cd /root/iron-blog || exit 1

echo "📊 Current status:"
docker-compose ps
echo ""

echo "🔄 Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main
echo "✅ Code updated"
echo ""

echo "🛑 Stopping containers..."
docker-compose down
echo "✅ Containers stopped"
echo ""

echo "🔨 Rebuilding Next.js application..."
docker-compose build nextjs-app
echo "✅ Build complete"
echo ""

echo "🚀 Starting all services..."
docker-compose up -d
echo "✅ Services started"
echo ""

echo "⏳ Waiting for services to be ready..."
sleep 15
echo ""

echo "📊 Final status:"
docker-compose ps
echo ""

echo "💾 Memory usage:"
free -h
echo ""

echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "=========================================="
echo ""
echo "🌐 Your site should be accessible at:"
echo "  - http://tarnovsky.ru"
echo "  - https://tarnovsky.ru"
echo "  - http://forum.theholylabs.com"
echo "  - https://forum.theholylabs.com"
echo ""

# Show last commit
echo "📝 Deployed commit:"
git log -1 --pretty=format:"%h - %s (%cr by %an)" 
echo ""
echo ""

