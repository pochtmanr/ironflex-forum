#!/bin/bash

# Quick start script for local development
# This will set up everything you need automatically

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Iron Blog - Local Development Quick Start           ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if MongoDB is running
echo "📦 Step 1: Checking MongoDB..."
if nc -z localhost 27017 2>/dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB is already running"
else
    echo -e "${YELLOW}⚠${NC} MongoDB is not running. Starting..."
    ./start-mongodb-local.sh
    sleep 3
    
    if nc -z localhost 27017 2>/dev/null; then
        echo -e "${GREEN}✓${NC} MongoDB started successfully"
    else
        echo -e "${RED}✗${NC} Failed to start MongoDB"
        echo "Please start it manually: ./start-mongodb-local.sh"
        exit 1
    fi
fi

echo ""

# Step 2: Check if database has users
echo "👤 Step 2: Checking for users..."
USER_COUNT=$(mongosh "mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin" --quiet --eval "db.users.countDocuments()" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $USER_COUNT user(s) in database"
else
    echo -e "${YELLOW}⚠${NC} No users found. You need to either:"
    echo "   1. Sync from server: ./sync-from-server.sh"
    echo "   2. Create admin user: ./create-local-admin.sh"
    echo ""
    read -p "Do you want to sync from server now? (y/n): " sync_choice
    
    if [ "$sync_choice" = "y" ] || [ "$sync_choice" = "Y" ]; then
        echo ""
        echo "🔄 Syncing data from server..."
        ./sync-from-server.sh
    else
        echo ""
        echo "Creating local admin user..."
        ./create-local-admin.sh
    fi
fi

echo ""

# Step 3: Check if dev server is running
echo "🚀 Step 3: Checking dev server..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Dev server is already running on port 3000"
else
    echo -e "${YELLOW}⚠${NC} Dev server is not running"
    echo ""
    read -p "Do you want to start the dev server now? (y/n): " start_choice
    
    if [ "$start_choice" = "y" ] || [ "$start_choice" = "Y" ]; then
        echo ""
        echo "Starting dev server..."
        echo "Opening in new terminal window..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            osascript -e 'tell application "Terminal" to do script "cd '"$(pwd)"' && npm run dev"'
        else
            # Linux
            gnome-terminal -- bash -c "cd $(pwd) && npm run dev; exec bash" 2>/dev/null || \
            xterm -e "cd $(pwd) && npm run dev" 2>/dev/null || \
            echo "Please start manually: npm run dev"
        fi
        
        echo -e "${GREEN}✓${NC} Dev server starting in new window"
    else
        echo ""
        echo "To start manually, run: npm run dev"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Your application should be available at:"
echo "   http://localhost:3000"
echo ""
echo "📝 Next steps:"
echo "   1. Go to http://localhost:3000/login"
echo "   2. Log in with your credentials"
echo "   3. Visit http://localhost:3000/admin to access admin panel"
echo "   4. Create forum categories at http://localhost:3000/admin/categories"
echo ""
echo "📚 Useful commands:"
echo "   - View server data: ./fetch-server-data.sh"
echo "   - Sync from server: ./sync-from-server.sh"
echo "   - Export server data: ./export-server-data.sh"
echo "   - Stop MongoDB: ./stop-mongodb-local.sh"
echo ""
echo "📖 Read AUTHENTICATION_GUIDE.md for more information"
echo ""

