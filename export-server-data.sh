#!/bin/bash

# Server connection details
SERVER_IP="45.10.43.204"
SERVER_USER="root"
SERVER_PASS="xA8u55@H3M6sKx"
MONGO_USER="admin"
MONGO_PASS="StrongPassword123!"

# Local directory for exports
EXPORT_DIR="./server-data-export"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_PATH="$EXPORT_DIR/$TIMESTAMP"

echo "=== Exporting Server Data ==="
echo "Server: $SERVER_IP"
echo "Export to: $EXPORT_PATH"
echo ""

# Create export directory
mkdir -p "$EXPORT_PATH"

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

echo "=== Exporting Collections ==="

# Export users (without password hashes for security)
echo "Exporting users..."
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
JSON.stringify(db.users.find({}, {passwordHash: 0}).toArray(), null, 2)
'" > "$EXPORT_PATH/users.json"
echo "✓ Users exported"

# Export categories
echo "Exporting categories..."
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
JSON.stringify(db.categories.find().toArray(), null, 2)
'" > "$EXPORT_PATH/categories.json"
echo "✓ Categories exported"

# Export topics
echo "Exporting topics..."
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
JSON.stringify(db.topics.find().toArray(), null, 2)
'" > "$EXPORT_PATH/topics.json"
echo "✓ Topics exported"

# Export posts
echo "Exporting posts..."
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
JSON.stringify(db.posts.find().toArray(), null, 2)
'" > "$EXPORT_PATH/posts.json"
echo "✓ Posts exported"

# Export articles
echo "Exporting articles..."
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
JSON.stringify(db.articles.find().toArray(), null, 2)
'" > "$EXPORT_PATH/articles.json"
echo "✓ Articles exported"

# Export trainings
echo "Exporting trainings..."
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
JSON.stringify(db.trainings.find().toArray(), null, 2)
'" > "$EXPORT_PATH/trainings.json"
echo "✓ Trainings exported"

# Export comments
echo "Exporting comments..."
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
JSON.stringify(db.comments.find().toArray(), null, 2)
'" > "$EXPORT_PATH/comments.json"
echo "✓ Comments exported"

echo ""
echo "=== Generating Summary ==="

# Create summary file
cat > "$EXPORT_PATH/SUMMARY.txt" << EOF
Server Data Export
==================
Date: $(date)
Server: $SERVER_IP
Database: ironblog

Collection Counts:
EOF

# Add counts to summary
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
print(\"Users: \" + db.users.countDocuments());
print(\"Topics: \" + db.topics.countDocuments());
print(\"Posts: \" + db.posts.countDocuments());
print(\"Categories: \" + db.categories.countDocuments());
print(\"Articles: \" + db.articles.countDocuments());
print(\"Trainings: \" + db.trainings.countDocuments());
print(\"Comments: \" + db.comments.countDocuments());
'" >> "$EXPORT_PATH/SUMMARY.txt"

echo ""
echo "=== Export Complete ==="
echo ""
echo "Files exported to: $EXPORT_PATH"
echo ""
ls -lh "$EXPORT_PATH"
echo ""
echo "To import this data to local MongoDB, run:"
echo "  ./import-server-data.sh $EXPORT_PATH"

