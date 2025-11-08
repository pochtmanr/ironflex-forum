#!/bin/bash

# Server connection details
SERVER_IP="45.10.43.204"
SERVER_USER="root"
SERVER_PASS="xA8u55@H3M6sKx"

echo "=== Connecting to VPS Server ==="
echo "Server: $SERVER_IP"
echo ""

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo "Installing sshpass..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get install -y sshpass
    fi
fi

# Function to run SSH command
run_ssh() {
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -q "$SERVER_USER@$SERVER_IP" "$1"
}

echo "=== Step 1: Checking for duplicate project directories ==="
echo "Searching for iron-blog directories..."
run_ssh "find /root -maxdepth 3 -type d -name '*iron-blog*' -o -name '*forum*' 2>/dev/null"
echo ""
echo "Searching for docker-compose.yml files..."
run_ssh "find /root -maxdepth 3 -type f -name 'docker-compose.yml' 2>/dev/null"

echo ""
echo "=== Step 2: Listing running Docker containers ==="
run_ssh "docker ps -a"

echo ""
echo "=== Step 3: Checking MongoDB connection and data ==="
echo "--- MongoDB Ping Test ---"
run_ssh "docker exec mongodb mongosh --eval 'db.adminCommand({ping: 1})' 2>/dev/null || echo 'MongoDB container not found'"

echo ""
echo "--- Database List ---"
run_ssh "docker exec mongodb mongosh --eval 'db.adminCommand({listDatabases: 1})' 2>/dev/null"

echo ""
echo "--- Collections in iron-blog database ---"
run_ssh "docker exec mongodb mongosh iron-blog --eval 'db.getCollectionNames()' 2>/dev/null"

echo ""
echo "--- User count ---"
run_ssh "docker exec mongodb mongosh iron-blog --eval 'db.users.countDocuments()' 2>/dev/null"

echo ""
echo "--- Topic count ---"
run_ssh "docker exec mongodb mongosh iron-blog --eval 'db.topics.countDocuments()' 2>/dev/null"

echo ""
echo "--- Post count ---"
run_ssh "docker exec mongodb mongosh iron-blog --eval 'db.posts.countDocuments()' 2>/dev/null"

echo ""
echo "--- Category count ---"
run_ssh "docker exec mongodb mongosh iron-blog --eval 'db.categories.countDocuments()' 2>/dev/null"

echo ""
echo "--- Article count ---"
run_ssh "docker exec mongodb mongosh iron-blog --eval 'db.articles.countDocuments()' 2>/dev/null"

echo ""
echo "--- Training count ---"
run_ssh "docker exec mongodb mongosh iron-blog --eval 'db.trainings.countDocuments()' 2>/dev/null"

echo ""
echo "=== Step 4: Checking Next.js container status ==="
echo "--- Container logs (last 50 lines) ---"
run_ssh "docker logs iron-blog-nextjs-app-1 --tail 50 2>/dev/null || docker logs nextjs-app --tail 50 2>/dev/null || echo 'Next.js container not found'"

echo ""
echo "--- Environment variables ---"
run_ssh "docker exec iron-blog-nextjs-app-1 sh -c \"env | grep -E 'MONGODB|NEXTAUTH|NODE_ENV'\" 2>/dev/null || docker exec nextjs-app sh -c \"env | grep -E 'MONGODB|NEXTAUTH|NODE_ENV'\" 2>/dev/null || echo 'Cannot access container environment'"

echo ""
echo "=== Step 5: Network connectivity test ==="
run_ssh "docker exec iron-blog-nextjs-app-1 sh -c 'nc -zv mongodb 27017' 2>&1 || docker exec nextjs-app sh -c 'nc -zv mongodb 27017' 2>&1 || echo 'Cannot test network connectivity'"

echo ""
echo "=== Step 6: Docker network inspection ==="
run_ssh "docker network ls"

echo ""
echo "=== Diagnosis Complete ==="
echo ""
echo "To clean up duplicate directories, run: ./cleanup-server-duplicates.sh"

