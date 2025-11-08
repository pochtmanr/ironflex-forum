#!/bin/bash

# Server connection details
SERVER_IP="45.10.43.204"
SERVER_USER="root"
SERVER_PASS="xA8u55@H3M6sKx"

echo "=== Connecting to VPS Server ==="
echo "Server: $SERVER_IP"
echo ""

# Use sshpass for automated connection (install if needed)
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass for automated SSH connection..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get install -y sshpass
    fi
fi

echo "=== Step 1: Checking for duplicate project directories ==="
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -T "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
echo "Searching for iron-blog directories..."
find /root -maxdepth 3 -type d -name "*iron-blog*" -o -name "*forum*" 2>/dev/null
echo ""
echo "Searching for docker-compose.yml files..."
find /root -maxdepth 3 -type f -name "docker-compose.yml" 2>/dev/null
ENDSSH

echo ""
echo "=== Step 2: Listing running Docker containers ==="
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -T "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
docker ps -a
ENDSSH

echo ""
echo "=== Step 3: Checking MongoDB connection and data ==="
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -T "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
echo "--- MongoDB Ping Test ---"
docker exec mongodb mongosh --eval "db.adminCommand({ping: 1})" 2>/dev/null || echo "MongoDB container not found or not running"

echo ""
echo "--- Database List ---"
docker exec mongodb mongosh --eval "db.adminCommand({listDatabases: 1})" 2>/dev/null

echo ""
echo "--- Collections in iron-blog database ---"
docker exec mongodb mongosh iron-blog --eval "db.getCollectionNames()" 2>/dev/null

echo ""
echo "--- User count ---"
docker exec mongodb mongosh iron-blog --eval "db.users.countDocuments()" 2>/dev/null

echo ""
echo "--- Topic count ---"
docker exec mongodb mongosh iron-blog --eval "db.topics.countDocuments()" 2>/dev/null

echo ""
echo "--- Post count ---"
docker exec mongodb mongosh iron-blog --eval "db.posts.countDocuments()" 2>/dev/null

echo ""
echo "--- Category count ---"
docker exec mongodb mongosh iron-blog --eval "db.categories.countDocuments()" 2>/dev/null

echo ""
echo "--- Article count ---"
docker exec mongodb mongosh iron-blog --eval "db.articles.countDocuments()" 2>/dev/null

echo ""
echo "--- Training count ---"
docker exec mongodb mongosh iron-blog --eval "db.trainings.countDocuments()" 2>/dev/null
ENDSSH

echo ""
echo "=== Step 4: Checking Next.js container status ==="
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -T "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
echo "--- Container logs (last 50 lines) ---"
docker logs iron-blog-nextjs-app-1 --tail 50 2>/dev/null || docker logs nextjs-app --tail 50 2>/dev/null || echo "Next.js container not found"

echo ""
echo "--- Environment variables ---"
docker exec iron-blog-nextjs-app-1 sh -c "env | grep -E 'MONGODB|NEXTAUTH|NODE_ENV'" 2>/dev/null || docker exec nextjs-app sh -c "env | grep -E 'MONGODB|NEXTAUTH|NODE_ENV'" 2>/dev/null || echo "Cannot access container environment"
ENDSSH

echo ""
echo "=== Step 5: Network connectivity test ==="
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -T "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
docker exec iron-blog-nextjs-app-1 sh -c "nc -zv mongodb 27017" 2>&1 || docker exec nextjs-app sh -c "nc -zv mongodb 27017" 2>&1 || echo "Cannot test network connectivity"
ENDSSH

echo ""
echo "=== Diagnosis Complete ==="
echo ""
echo "To clean up duplicate directories, run: ./cleanup-server-duplicates.sh"

