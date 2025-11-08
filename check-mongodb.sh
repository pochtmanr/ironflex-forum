#!/bin/bash

# Check MongoDB Status

echo "🔍 Checking MongoDB status..."
echo ""

# Check if MongoDB process is running
if pgrep -x "mongod" > /dev/null; then
    PID=$(pgrep -x "mongod")
    echo "✅ MongoDB is running (PID: $PID)"
else
    echo "❌ MongoDB is not running"
    echo ""
    echo "To start MongoDB, run: ./start-mongodb-local.sh"
    exit 1
fi

echo ""
echo "📊 Database Statistics:"
mongosh ironblog --quiet --eval "
  const stats = db.stats();
  print('  Database: ' + stats.db);
  print('  Collections: ' + stats.collections);
  print('  Objects: ' + stats.objects);
  print('  Data Size: ' + (stats.dataSize / 1024).toFixed(2) + ' KB');
  print('  Storage Size: ' + (stats.storageSize / 1024).toFixed(2) + ' KB');
  print('  Indexes: ' + stats.indexes);
  print('  Index Size: ' + (stats.indexSize / 1024).toFixed(2) + ' KB');
"

echo ""
echo "📦 Collections:"
mongosh ironblog --quiet --eval "
  db.getCollectionNames().forEach(function(col) {
    const count = db[col].countDocuments();
    print('  ' + col + ': ' + count + ' documents');
  });
"

echo ""
echo "🔗 Connection URI: mongodb://localhost:27017/ironblog"
echo ""

