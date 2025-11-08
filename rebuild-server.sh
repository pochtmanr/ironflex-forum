#!/bin/bash

# Quick rebuild on server
# Usage: ./rebuild-server.sh

SERVER="root@45.10.43.204"

echo "🔧 Rebuilding on server..."
echo ""

ssh $SERVER << 'ENDSSH'
cd /root/iron-blog

echo "🔨 Rebuilding Next.js container..."
docker-compose build --no-cache nextjs-app

echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "📊 Container status:"
docker-compose ps

echo ""
echo "📝 Next.js App Logs (last 30 lines):"
docker logs nextjs-app --tail 30

echo ""
echo "✅ Rebuild complete!"
ENDSSH

echo ""
echo "🌐 Check: http://45.10.43.204:3000"


