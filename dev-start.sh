#!/bin/bash

echo "🚀 Starting Iron Blog Local Development Environment..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
    echo ""
    echo "   Or install MongoDB directly:"
    echo "   brew tap mongodb/brew"
    echo "   brew install mongodb-community@7.0"
    echo "   brew services start mongodb-community@7.0"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "   Please start Docker Desktop"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start MongoDB and Fileserver
echo "📦 Starting MongoDB and Fileserver containers..."
docker compose up -d mongodb fileserver

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 5

# Check if containers are running
if docker ps | grep -q mongodb && docker ps | grep -q fileserver; then
    echo "✅ MongoDB and Fileserver are running"
    echo ""
    echo "📊 Service Status:"
    echo "   MongoDB:    http://localhost:27017"
    echo "   Fileserver: http://localhost:3001"
    echo ""
    echo "🎯 Next Steps:"
    echo "   Run: npm run dev"
    echo "   Then open: http://localhost:3000"
    echo ""
    echo "🛑 To stop services:"
    echo "   Run: ./dev-stop.sh"
    echo "   Or:  docker compose stop mongodb fileserver"
else
    echo "❌ Failed to start services"
    echo "   Check logs with: docker compose logs mongodb fileserver"
    exit 1
fi

