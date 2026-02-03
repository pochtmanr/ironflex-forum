#!/bin/bash

# Memory-Optimized Deployment Script for 4GB Server
# This script deploys your Next.js app with proper memory limits

set -e

echo "🚀 Starting memory-optimized deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "⚠️  Warning: Not running as root. Some operations may fail."
fi

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down || true

# Clean up Docker to free memory
echo "🧹 Cleaning up Docker resources..."
docker system prune -f --volumes || true

# Remove old images to free space
echo "🗑️  Removing old images..."
docker image prune -af || true

# Build with memory limits
echo "🔨 Building with memory constraints..."
docker-compose build --no-cache

# Start services one by one to avoid memory spikes
echo "🚀 Starting MongoDB..."
docker-compose up -d mongodb
sleep 10

echo "🚀 Starting Fileserver..."
docker-compose up -d fileserver
sleep 5

echo "🚀 Starting Next.js app..."
docker-compose up -d nextjs-app
sleep 10

echo "🚀 Starting Nginx..."
docker-compose up -d nginx

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Check container status
echo "📊 Container Status:"
docker-compose ps

# Show memory usage
echo ""
echo "💾 Memory Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Memory Limits:"
echo "  - MongoDB: 1GB"
echo "  - Next.js: 1.5GB"
echo "  - Fileserver: 512MB"
echo "  - Nginx: 256MB"
echo "  - Total: ~3.25GB (leaving 750MB for system)"
echo ""
echo "🔍 Monitor memory with: docker stats"
echo "📋 View logs with: docker-compose logs -f [service-name]"


