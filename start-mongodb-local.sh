#!/bin/bash

# Start MongoDB Locally for Development
# This script starts MongoDB on localhost:27017 without authentication

echo "🚀 Starting MongoDB locally for development..."

# Check if MongoDB is already running
if pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is already running!"
    echo "If you need to restart it, run: ./stop-mongodb-local.sh first"
    exit 0
fi

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_FILE="$SCRIPT_DIR/mongod-local.conf"

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Start MongoDB with the local config (no authentication)
echo "Starting MongoDB on localhost:27017 (no authentication)..."
mongod --config "$CONFIG_FILE" &

# Wait for MongoDB to start
echo "⏳ Waiting for MongoDB to start..."
sleep 3

# Check if MongoDB is running
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is running!"
    echo ""
    echo "MongoDB connection details:"
    echo "  Host: localhost"
    echo "  Port: 27017"
    echo "  Database: ironblog"
    echo "  Connection URI: mongodb://localhost:27017/ironblog"
    echo ""
    echo "To initialize the database, run: node init-db-local.js"
    echo "To stop MongoDB, run: ./stop-mongodb-local.sh"
else
    echo "❌ Failed to start MongoDB"
    echo "Check logs at: /opt/homebrew/var/log/mongodb/mongo.log"
    exit 1
fi

