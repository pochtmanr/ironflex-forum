#!/bin/bash
# Frontend Deployment Script

echo "🎨 Deploying IronFlex Forum Frontend..."

# Navigate to frontend directory
cd /var/www/ironflex-forum/frontend

# Clone/pull latest code if not exists
if [ ! -d ".git" ]; then
    git clone https://github.com/pochtmanr/ironflex-forum.git .
else
    git pull origin main
fi

# Copy only frontend files to current directory
cp -r src/ public/ package.json package-lock.json tsconfig.json tailwind.config.js postcss.config.js .
rm -rf backend/ deploy/

# Install dependencies
npm install

# Create production environment file
cat > .env.production << EOL
REACT_APP_API_URL=http://YOUR_SERVER_IP:5001
# Replace YOUR_SERVER_IP with your actual server IP or domain
EOL

echo "📝 Created .env.production - UPDATE YOUR_SERVER_IP!"

# Build for production
npm run build

echo "✅ Frontend built successfully!"
echo "Build files are in: /var/www/ironflex-forum/frontend/build/"
