#!/bin/bash

# Deployment script for VPS
# This script will connect to your server and deploy the optimized version

SERVER_IP="95.163.180.91"  # Your server IP (adjust if different)
SERVER_USER="root"
PROJECT_PATH="/root/iron-blog"  # Adjust if your project is elsewhere

echo "🚀 Deploying to VPS..."
echo "================================"
echo ""

# Check if we can connect
echo "📡 Testing connection to $SERVER_IP..."
if ! ping -c 1 $SERVER_IP &> /dev/null; then
    echo "❌ Cannot reach server. Check your internet connection."
    exit 1
fi

echo "✅ Server is reachable"
echo ""

# Copy files to server
echo "📦 Copying updated files to server..."
scp docker-compose.yml Dockerfile src/lib/mongodb.ts $SERVER_USER@$SERVER_IP:$PROJECT_PATH/

# SSH and deploy
echo "🔧 Connecting to server and deploying..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /root/iron-blog

echo "📊 Current memory usage:"
free -h
echo ""

echo "🛑 Stopping containers..."
docker-compose down

echo "🧹 Cleaning up Docker..."
docker system prune -f

echo "🔨 Rebuilding with memory limits..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 15

echo "📊 Container status:"
docker-compose ps

echo ""
echo "💾 Memory usage:"
docker stats --no-stream

echo ""
echo "✅ Deployment complete!"
ENDSSH

echo ""
echo "🎉 Done! Your site should be running with memory optimizations."
echo ""
echo "To monitor: ssh $SERVER_USER@$SERVER_IP 'docker stats'"

