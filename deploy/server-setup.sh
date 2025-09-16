#!/bin/bash
# Server Setup Script for IronFlex Forum

echo "🚀 Setting up IronFlex Forum server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y

# Install Git
sudo apt install git -y

# Create app directory
sudo mkdir -p /var/www/ironflex-forum
sudo chown $USER:$USER /var/www/ironflex-forum

echo "✅ Basic server setup complete!"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"

# Create directory structure
mkdir -p /var/www/ironflex-forum/{backend,frontend}

echo "📁 Directory structure created at /var/www/ironflex-forum/"
