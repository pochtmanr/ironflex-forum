#!/bin/bash

# Server connection details
SERVER_IP="45.10.43.204"
SERVER_USER="root"
SERVER_PASS="xA8u55@H3M6sKx"

echo "=== Cleaning up duplicate project directories on VPS ==="
echo "Server: $SERVER_IP"
echo ""

# Use sshpass for automated connection
if ! command -v sshpass &> /dev/null; then
    echo "Error: sshpass not installed. Run connect-and-diagnose-server.sh first."
    exit 1
fi

echo "WARNING: This will:"
echo "1. Find all iron-blog/forum project directories"
echo "2. Keep ONLY the one with active Docker containers"
echo "3. Delete all other duplicate directories"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "=== Finding active project directory ==="
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -T "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
# Find the directory with running containers
ACTIVE_DIR=$(docker inspect iron-blog-nextjs-app-1 2>/dev/null | grep -o '"com.docker.compose.project.working_dir": "[^"]*"' | cut -d'"' -f4)

if [ -z "$ACTIVE_DIR" ]; then
    ACTIVE_DIR=$(docker inspect nextjs-app 2>/dev/null | grep -o '"com.docker.compose.project.working_dir": "[^"]*"' | cut -d'"' -f4)
fi

if [ -z "$ACTIVE_DIR" ]; then
    echo "Could not find active project directory from Docker containers"
    echo "Searching for docker-compose.yml files..."
    find /root -maxdepth 3 -type f -name "docker-compose.yml" 2>/dev/null
    exit 1
fi

echo "Active project directory: $ACTIVE_DIR"
echo "$ACTIVE_DIR" > /tmp/active_project_dir.txt

# Find all potential project directories
echo ""
echo "All project directories found:"
find /root -maxdepth 3 -type d \( -name "*iron-blog*" -o -name "*forum*" \) 2>/dev/null | while read dir; do
    if [ "$dir" != "$ACTIVE_DIR" ] && [ -d "$dir" ]; then
        echo "  - $dir (WILL BE DELETED)"
    elif [ "$dir" == "$ACTIVE_DIR" ]; then
        echo "  - $dir (ACTIVE - KEEPING)"
    fi
done
ENDSSH

echo ""
echo "=== Removing duplicate directories ==="
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -T "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
if [ ! -f /tmp/active_project_dir.txt ]; then
    echo "Error: Could not determine active directory"
    exit 1
fi

ACTIVE_DIR=$(cat /tmp/active_project_dir.txt)
echo "Keeping: $ACTIVE_DIR"
echo ""

# Remove duplicates
find /root -maxdepth 3 -type d \( -name "*iron-blog*" -o -name "*forum*" \) 2>/dev/null | while read dir; do
    if [ "$dir" != "$ACTIVE_DIR" ] && [ -d "$dir" ]; then
        echo "Removing: $dir"
        rm -rf "$dir"
        echo "  ✓ Deleted"
    fi
done

# Clean up temp file
rm -f /tmp/active_project_dir.txt

echo ""
echo "=== Cleanup complete ==="
echo ""
echo "Remaining directories:"
find /root -maxdepth 3 -type d \( -name "*iron-blog*" -o -name "*forum*" \) 2>/dev/null
ENDSSH

echo ""
echo "=== Server cleanup finished ==="

