#!/bin/bash

# Diagnostic script for server issues
# Run this on the server

echo "=== MongoDB Connection Test ==="
docker exec mongodb mongosh --eval "db.adminCommand({ping: 1})"

echo ""
echo "=== Check if MongoDB is accessible from Next.js container ==="
docker exec iron-blog-nextjs-app-1 sh -c "nc -zv mongodb 27017" 2>&1 || echo "Cannot reach MongoDB"

echo ""
echo "=== Next.js Environment Variables ==="
docker exec iron-blog-nextjs-app-1 sh -c "env | grep MONGODB"

echo ""
echo "=== Next.js App Logs (Last 30 lines) ==="
docker logs iron-blog-nextjs-app-1 --tail 30

echo ""
echo "=== MongoDB Logs (Last 20 lines) ==="
docker logs mongodb --tail 20

echo ""
echo "=== Container Network Info ==="
docker network inspect iron-blog_my_custom_network | grep -A 5 "nextjs-app\|mongodb"

