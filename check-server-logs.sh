#!/bin/bash

# Check server logs
# Usage: ./check-server-logs.sh [lines]

SERVER="root@45.10.43.204"
LINES=${1:-50}

echo "📝 Fetching server logs (last $LINES lines)..."
echo ""

echo "=== Next.js App Logs ==="
ssh $SERVER "docker logs nextjs-app --tail $LINES 2>&1"

echo ""
echo ""
echo "=== Container Status ==="
ssh $SERVER "docker ps"

echo ""
echo "=== MongoDB Status ==="
ssh $SERVER "docker logs mongodb --tail 10 2>&1"

echo ""
echo "=== Fileserver Status ==="
ssh $SERVER "docker logs fileserver --tail 10 2>&1"


