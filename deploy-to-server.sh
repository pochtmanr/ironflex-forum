#!/bin/bash

# Deploy to production server
# Usage: ./deploy-to-server.sh

SERVER="root@45.10.43.204"
REMOTE_DIR="/root/iron-blog"

echo "🚀 Deploying to production server..."
echo ""

# 1. Create tarball of source code
echo "📦 Creating deployment package..."
cd /Users/romanpochtman/Developer/forumnextjs/iron-blog

# Exclude node_modules and other unnecessary files
tar -czf /tmp/iron-blog-deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='src.zip' \
  --exclude='iron-blog.tar.gz' \
  --exclude='iron-blog.zip' \
  --exclude='.git' \
  --exclude='fileserver/venv' \
  --exclude='fileserver/uploads' \
  .

echo "✅ Package created"
echo ""

# 2. Upload to server
echo "⬆️  Uploading to server..."
scp /tmp/iron-blog-deploy.tar.gz $SERVER:/tmp/
echo "✅ Upload complete"
echo ""

# 3. Deploy on server
echo "🔧 Deploying on server..."
ssh $SERVER << 'ENDSSH'
cd /root/iron-blog

# Backup current version
echo "📋 Creating backup..."
tar -czf /root/iron-blog-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='fileserver/venv' \
  --exclude='fileserver/uploads' \
  .

# Extract new version (preserve fileserver/uploads)
echo "📂 Extracting new version..."
tar -xzf /tmp/iron-blog-deploy.tar.gz

# Rebuild and restart
echo "🔨 Rebuilding containers..."
docker-compose down
docker-compose build --no-cache nextjs-app
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check status
echo "📊 Container status:"
docker-compose ps

# Show logs
echo ""
echo "📝 Recent logs:"
docker logs nextjs-app --tail 20

echo ""
echo "✅ Deployment complete!"
echo "🌐 App should be available at: http://45.10.43.204:3000"
ENDSSH

echo ""
echo "✅ All done!"
echo ""

# Cleanup
rm -f /tmp/iron-blog-deploy.tar.gz


