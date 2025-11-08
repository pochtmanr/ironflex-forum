#!/bin/bash

# Server connection details
SERVER_IP="45.10.43.204"
SERVER_USER="root"
SERVER_PASS="xA8u55@H3M6sKx"
MONGO_USER="admin"
MONGO_PASS="StrongPassword123!"

echo "=== Fetching Data from VPS Server ==="
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

echo "=== 1. Server & Container Status ==="
echo "--- Docker Containers ---"
run_ssh "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo ""
echo "=== 2. MongoDB Database Info ==="
echo "--- Databases ---"
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin --quiet --eval 'db.adminCommand({listDatabases: 1}).databases.forEach(db => print(db.name + \": \" + (db.sizeOnDisk/1024).toFixed(2) + \" KB\"))'"

echo ""
echo "--- Collections in ironblog ---"
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval 'db.getCollectionNames().join(\", \")'"

echo ""
echo "=== 3. Document Counts ==="
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
print(\"Users: \" + db.users.countDocuments());
print(\"Topics: \" + db.topics.countDocuments());
print(\"Posts: \" + db.posts.countDocuments());
print(\"Categories: \" + db.categories.countDocuments());
print(\"Articles: \" + db.articles.countDocuments());
print(\"Trainings: \" + db.trainings.countDocuments());
print(\"Comments: \" + db.comments.countDocuments());
'"

echo ""
echo "=== 4. User Data ==="
run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
db.users.find({}, {passwordHash: 0}).forEach(user => {
    print(\"---\");
    print(\"Username: \" + user.username);
    print(\"Email: \" + user.email);
    print(\"Display Name: \" + user.displayName);
    print(\"Admin: \" + user.isAdmin);
    print(\"Verified: \" + user.isVerified);
    print(\"Created: \" + user.createdAt);
    print(\"Last Login: \" + (user.lastLogin || \"Never\"));
});
'"

echo ""
echo "=== 5. Categories ==="
CATEGORY_COUNT=$(run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval 'db.categories.countDocuments()'")
if [ "$CATEGORY_COUNT" -gt 0 ]; then
    run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
    db.categories.find().forEach(cat => {
        print(\"---\");
        print(\"Name: \" + cat.name);
        print(\"Slug: \" + cat.slug);
        print(\"Description: \" + (cat.description || \"N/A\"));
    });
    '"
else
    echo "No categories found"
fi

echo ""
echo "=== 6. Topics ==="
TOPIC_COUNT=$(run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval 'db.topics.countDocuments()'")
if [ "$TOPIC_COUNT" -gt 0 ]; then
    run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
    db.topics.find().limit(5).forEach(topic => {
        print(\"---\");
        print(\"Title: \" + topic.title);
        print(\"Author: \" + topic.authorId);
        print(\"Views: \" + topic.views);
        print(\"Created: \" + topic.createdAt);
    });
    '"
else
    echo "No topics found"
fi

echo ""
echo "=== 7. Articles ==="
ARTICLE_COUNT=$(run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval 'db.articles.countDocuments()'")
if [ "$ARTICLE_COUNT" -gt 0 ]; then
    run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
    db.articles.find().limit(5).forEach(article => {
        print(\"---\");
        print(\"Title: \" + article.title);
        print(\"Slug: \" + article.slug);
        print(\"Published: \" + article.isPublished);
        print(\"Created: \" + article.createdAt);
    });
    '"
else
    echo "No articles found"
fi

echo ""
echo "=== 8. Trainings ==="
TRAINING_COUNT=$(run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval 'db.trainings.countDocuments()'")
if [ "$TRAINING_COUNT" -gt 0 ]; then
    run_ssh "docker exec mongodb mongosh -u $MONGO_USER -p '$MONGO_PASS' --authenticationDatabase admin ironblog --quiet --eval '
    db.trainings.find().limit(5).forEach(training => {
        print(\"---\");
        print(\"Title: \" + training.title);
        print(\"Slug: \" + training.slug);
        print(\"Published: \" + training.isPublished);
        print(\"Created: \" + training.createdAt);
    });
    '"
else
    echo "No trainings found"
fi

echo ""
echo "=== 9. Next.js Application Status ==="
echo "--- Environment Variables ---"
run_ssh "docker exec iron-blog-nextjs-app-1 sh -c \"env | grep -E 'MONGODB|NEXTAUTH|NODE_ENV' | sort\""

echo ""
echo "--- Recent Logs (last 20 lines) ---"
run_ssh "docker logs iron-blog-nextjs-app-1 --tail 20"

echo ""
echo "=== 10. Project Location ==="
run_ssh "find /root -maxdepth 3 -type d -name '*iron-blog*' -o -name '*forum*' 2>/dev/null"

echo ""
echo "=== Data Fetch Complete ==="
echo ""
echo "Summary saved to: SERVER_STATUS.md"
echo "To export data, run: ./export-server-data.sh"

