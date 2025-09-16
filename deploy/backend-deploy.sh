#!/bin/bash
# Backend Deployment Script

echo "🔧 Deploying IronFlex Forum Backend..."

# Navigate to backend directory
cd /var/www/ironflex-forum/backend

# Clone/pull latest code
if [ ! -d ".git" ]; then
    git clone https://github.com/pochtmanr/ironflex-forum.git .
else
    git pull origin main
fi

# Copy only backend files
cp -r backend/* .
rm -rf backend/

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create environment file
cat > .env << EOL
NODE_ENV=production
PORT=5001
FIREBASE_PROJECT_ID=ironflex-64531
# Add your Firebase credentials here
EOL

echo "📝 Created .env file - YOU NEED TO ADD FIREBASE CREDENTIALS!"

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'ironflex-backend',
    script: 'dist/forum-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }]
};
EOL

echo "✅ Backend deployment files ready!"
echo "Next: Add Firebase credentials to .env file"
