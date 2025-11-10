#!/bin/bash

echo "🚀 Starting deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Stop and delete existing PM2 process
echo "🛑 Stopping existing process..."
pm2 stop iron-blog 2>/dev/null || true
pm2 delete iron-blog 2>/dev/null || true

# Wait a moment for port to be released
sleep 2

# Start fresh PM2 process using standalone server
echo "▶️ Starting new process..."
pm2 start node --name "iron-blog" -- .next/standalone/server.js

# Save PM2 configuration
pm2 save

echo "✅ Deployment complete!"

