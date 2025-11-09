#!/bin/bash

# Script to sync data from VPS server to local MongoDB
# This will export data from server and import to local database

SERVER_IP="45.10.43.204"
SERVER_USER="root"
SERVER_PASS="xA8u55@H3M6sKx"
MONGO_USER="admin"
MONGO_PASS="StrongPassword123!"

# Local MongoDB settings (from your local setup)
# Check if local MongoDB has auth enabled
if mongosh "mongodb://localhost:27017/ironblog" --quiet --eval "db.runCommand({ping: 1})" &>/dev/null; then
    LOCAL_MONGO_URI="mongodb://localhost:27017/ironblog"
else
    LOCAL_MONGO_URI="mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin"
fi

TEMP_DIR="./temp-sync-data"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "=== Syncing Data from Server to Local ==="
echo "Server: $SERVER_IP"
echo "Local MongoDB: localhost:27017"
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

# Create temp directory
mkdir -p "$TEMP_DIR"

echo "=== Step 1: Exporting data from server ==="

# Collections to export
COLLECTIONS=("users" "categories" "topics" "posts" "articles" "trainings" "comments")

for collection in "${COLLECTIONS[@]}"; do
    echo "Exporting $collection..."
    sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -q "$SERVER_USER@$SERVER_IP" \
        "docker exec mongodb mongoexport -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin -d ironblog -c $collection --jsonArray" \
        > "$TEMP_DIR/$collection.json" 2>/dev/null
    
    if [ -s "$TEMP_DIR/$collection.json" ]; then
        COUNT=$(cat "$TEMP_DIR/$collection.json" | grep -o '"_id"' | wc -l)
        echo "  ✓ Exported $COUNT documents"
    else
        echo "  ℹ No documents found"
    fi
done

echo ""
echo "=== Step 2: Checking local MongoDB ==="

# Check if local MongoDB is running
if ! nc -z localhost 27017 2>/dev/null; then
    echo "❌ Local MongoDB is not running!"
    echo ""
    echo "Please start MongoDB first:"
    echo "  ./start-mongodb-local.sh"
    echo ""
    exit 1
fi

echo "✓ Local MongoDB is running"

echo ""
echo "=== Step 3: Importing data to local MongoDB ==="

for collection in "${COLLECTIONS[@]}"; do
    if [ -s "$TEMP_DIR/$collection.json" ]; then
        echo "Importing $collection..."
        
        # Drop existing collection first (optional - comment out if you want to keep existing data)
        mongosh "$LOCAL_MONGO_URI" --quiet --eval "db.$collection.drop()" 2>/dev/null
        
        # Import the collection
        mongoimport --uri="$LOCAL_MONGO_URI" \
            --collection="$collection" \
            --file="$TEMP_DIR/$collection.json" \
            --jsonArray \
            --drop 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "  ✓ Imported successfully"
        else
            echo "  ❌ Import failed"
        fi
    fi
done

echo ""
echo "=== Step 4: Verifying import ==="

mongosh "$LOCAL_MONGO_URI" --quiet --eval "
print('Collection counts:');
print('Users: ' + db.users.countDocuments());
print('Categories: ' + db.categories.countDocuments());
print('Topics: ' + db.topics.countDocuments());
print('Posts: ' + db.posts.countDocuments());
print('Articles: ' + db.articles.countDocuments());
print('Trainings: ' + db.trainings.countDocuments());
print('Comments: ' + db.comments.countDocuments());
"

echo ""
echo "=== Step 5: Cleanup ==="
rm -rf "$TEMP_DIR"
echo "✓ Temporary files removed"

echo ""
echo "=== Sync Complete ==="
echo ""
echo "Your local database now has the same data as the server!"
echo ""
echo "Note: Passwords are hashed, so you'll need to:"
echo "1. Log in with existing credentials, OR"
echo "2. Create a new admin user locally with: node make-admin.js"
echo ""
echo "Server users:"
echo "  - pochtmanrca@gmail.com (Admin)"
echo "  - 13w7byba@mail.ru (Regular user)"

