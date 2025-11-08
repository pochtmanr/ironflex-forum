#!/bin/bash

# Script to push current project to GitHub
# This will REPLACE the old React/Firebase version

echo "╔════════════════════════════════════════════════════════╗"
echo "║     Push Iron Blog to GitHub                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  WARNING: This will REPLACE the old version on GitHub!"
echo "   Old repo: React + Firebase"
echo "   New repo: Next.js 15 + MongoDB"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo ""
    echo "📦 Initializing Git repository..."
    git init
fi

# Check if remote exists
if git remote | grep -q "origin"; then
    echo "✓ Remote 'origin' already exists"
else
    echo ""
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/pochtmanr/ironflex-forum.git
fi

# Create/update .gitignore
echo ""
echo "📝 Updating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env*.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# MongoDB data
data/
mongodb-data/

# Temporary files
temp-sync-data/
server-data-export/
*.tmp

# Python virtual environment
venv/
__pycache__/
*.pyc

# Uploads (optional - uncomment if you don't want to commit uploads)
# fileserver/uploads/*
# !fileserver/uploads/.gitkeep

# Backups
backup/
*.backup
EOF

# Stage all files
echo ""
echo "📦 Staging files..."
git add .

# Show what will be committed
echo ""
echo "📋 Files to be committed:"
git status --short

echo ""
read -p "Proceed with commit? (yes/no): " commit_confirm

if [ "$commit_confirm" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

# Commit
echo ""
echo "💾 Creating commit..."
git commit -m "feat: Complete rewrite - Next.js 15 + MongoDB forum platform

Major Changes:
- Migrated from React/Firebase to Next.js 15 + MongoDB
- Added comprehensive admin panel with full CRUD operations
- Implemented JWT authentication with refresh tokens
- Added Python file upload server
- Complete Docker containerization
- Nginx reverse proxy with SSL/TLS support
- GitHub Actions for automated deployment
- Direct server database connection for development

Features:
- Forum with categories, topics, and posts
- Articles and trainings management
- User authentication and authorization
- File uploads and image handling
- Admin panel for content management
- Responsive design with original IronFlex styling

Tech Stack:
- Next.js 15
- MongoDB 7.0
- TypeScript
- Docker & Docker Compose
- Nginx
- Python (file server)
- JWT authentication"

# Push to GitHub (force push to replace old version)
echo ""
echo "🚀 Pushing to GitHub..."
echo "   This will REPLACE the old version!"
echo ""
read -p "Final confirmation - Force push? (yes/no): " final_confirm

if [ "$final_confirm" != "yes" ]; then
    echo "Cancelled. Your local commit is saved but not pushed."
    exit 0
fi

git push -f origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║            ✅ Successfully Pushed to GitHub!          ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo ""
    echo "🔗 Repository: https://github.com/pochtmanr/ironflex-forum"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Go to GitHub repository settings"
    echo "   2. Add secrets for GitHub Actions:"
    echo "      - VPS_HOST: 45.10.43.204"
    echo "      - VPS_USER: root"
    echo "      - VPS_PASSWORD: xA8u55@H3M6sKx"
    echo "   3. Push changes will auto-deploy to VPS"
    echo ""
    echo "🔐 Setup GitHub Secrets:"
    echo "   https://github.com/pochtmanr/ironflex-forum/settings/secrets/actions"
    echo ""
else
    echo ""
    echo "❌ Push failed!"
    echo "   You may need to authenticate with GitHub"
    echo "   Run: gh auth login"
    echo "   Or use a personal access token"
fi

