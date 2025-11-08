#!/bin/bash

# Quick script to create a local admin user for development

echo "=== Create Local Admin User ==="
echo ""

# Check if local MongoDB is running
if ! nc -z localhost 27017 2>/dev/null; then
    echo "❌ Local MongoDB is not running!"
    echo ""
    echo "Starting MongoDB..."
    ./start-mongodb-local.sh
    sleep 3
fi

echo "✓ MongoDB is running"
echo ""

# Check if make-admin.js exists
if [ ! -f "make-admin.js" ]; then
    echo "❌ make-admin.js not found!"
    exit 1
fi

echo "Creating admin user..."
echo ""
echo "You can use the same credentials as the server:"
echo "  Email: pochtmanrca@gmail.com"
echo "  Username: pochtmanrca"
echo ""
echo "Or create a new admin user."
echo ""

# Run the make-admin script
node make-admin.js

echo ""
echo "=== Done ==="
echo ""
echo "You can now:"
echo "1. Start the dev server: npm run dev"
echo "2. Go to http://localhost:3000/login"
echo "3. Log in with your admin credentials"
echo "4. Access the admin panel at http://localhost:3000/admin"

