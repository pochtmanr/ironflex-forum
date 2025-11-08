#!/bin/bash

# Stop MongoDB Local Instance

echo "🛑 Stopping MongoDB..."

if pgrep -x "mongod" > /dev/null; then
    pkill mongod
    echo "✅ MongoDB stopped successfully"
else
    echo "ℹ️  MongoDB is not running"
fi

