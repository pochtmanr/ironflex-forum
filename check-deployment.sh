#!/bin/bash

# Check deployment status on VPS

echo "╔════════════════════════════════════════════════════════╗"
echo "║           Deployment Status Check                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Git information
echo "=== Git Information ==="
echo "Branch: $(git branch --show-current)"
echo "Last commit: $(git log -1 --pretty=format:'%h - %s (%cr)')"
echo "Remote: $(git remote get-url origin)"
echo ""

# Container status
echo "=== Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Application health
echo "=== Application Health ==="

# Next.js
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js: Running (http://localhost:3000)"
else
    echo "❌ Next.js: Not responding"
fi

# MongoDB
if docker exec mongodb mongosh --quiet --eval "db.adminCommand({ping: 1}).ok" > /dev/null 2>&1; then
    echo "✅ MongoDB: Running"
    USER_COUNT=$(docker exec mongodb mongosh iron-blog --quiet --eval "db.users.countDocuments()" 2>/dev/null || echo "0")
    TOPIC_COUNT=$(docker exec mongodb mongosh iron-blog --quiet --eval "db.topics.countDocuments()" 2>/dev/null || echo "0")
    echo "   Users: $USER_COUNT, Topics: $TOPIC_COUNT"
else
    echo "❌ MongoDB: Not responding"
fi

# Nginx
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Nginx: Running (http://localhost:80)"
else
    echo "❌ Nginx: Not responding"
fi

# File Server
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ File Server: Running (http://localhost:3001)"
else
    echo "❌ File Server: Not responding"
fi

echo ""

# Disk usage
echo "=== Disk Usage ==="
df -h / | tail -1 | awk '{print "Root: " $3 " used of " $2 " (" $5 " full)"}'
du -sh /root/iron-blog 2>/dev/null | awk '{print "Project: " $1}'

echo ""

# Docker resources
echo "=== Docker Resources ==="
echo "Images: $(docker images -q | wc -l)"
echo "Containers: $(docker ps -q | wc -l) running, $(docker ps -aq | wc -l) total"
echo "Volumes: $(docker volume ls -q | wc -l)"

echo ""

# Recent logs
echo "=== Recent Logs (Last 5 lines) ==="
echo "--- Next.js ---"
docker logs iron-blog-nextjs-app-1 --tail 5 2>&1 | sed 's/^/  /'
echo ""
echo "--- MongoDB ---"
docker logs mongodb --tail 5 2>&1 | sed 's/^/  /'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                 Status Check Complete                  ║"
echo "╚════════════════════════════════════════════════════════╝"

