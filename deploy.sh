#!/bin/bash

# Quick Deployment Script for Forum Next.js
# This script pushes your latest code to the server and rebuilds Docker containers

set -e  # Exit on any error

echo "🚀 Starting deployment to production server..."
echo ""

# Step 1: Check git status
echo "📋 Step 1: Checking git status..."
git status

echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Step 2: Add all changes
echo ""
echo "📦 Step 2: Adding all changes to git..."
git add .

# Step 3: Commit changes
echo ""
read -p "Enter commit message: " commit_message
git commit -m "$commit_message" || echo "No changes to commit or commit failed"

# Step 4: Push to repository
echo ""
echo "⬆️  Step 3: Pushing to git repository..."
git push origin main || git push origin master

# Step 5: SSH to server and deploy
echo ""
echo "🔗 Step 4: Connecting to server and deploying..."
echo "Note: You may need to enter your server password"
echo ""

# Replace with your actual server details
SERVER_USER="root"
SERVER_HOST="forum.theholylabs.com"
PROJECT_PATH="/root/forumnextjs/iron-blog"

ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
    set -e
    
    echo "📥 Pulling latest code from repository..."
    cd /root/forumnextjs/iron-blog
    git pull
    
    echo ""
    echo "🛑 Stopping old containers..."
    docker compose down
    
    echo ""
    echo "🔨 Rebuilding Docker images..."
    docker compose build --no-cache nextjs-app
    
    echo ""
    echo "🚀 Starting new containers..."
    docker compose up -d
    
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    echo ""
    echo "📊 Checking container status..."
    docker compose ps
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "📝 Recent logs:"
    docker compose logs --tail=50 nextjs-app
ENDSSH

echo ""
echo "🎉 Deployment finished successfully!"
echo ""
echo "🌐 Your site should now be updated at: https://forum.theholylabs.com"
echo ""

