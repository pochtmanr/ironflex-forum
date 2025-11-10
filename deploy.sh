#!/bin/bash

echo "🚀 Starting deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Restart PM2 process
echo "🔄 Restarting PM2..."
pm2 restart iron-blog || pm2 start npm --name "iron-blog" -- start

echo "✅ Deployment complete!"

