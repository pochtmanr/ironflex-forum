#!/bin/bash

echo "🛑 Stopping Iron Blog Local Development Environment..."
echo ""

# Stop MongoDB and Fileserver
docker compose stop mongodb fileserver

echo "✅ Services stopped"
echo ""
echo "💡 To restart services:"
echo "   Run: ./dev-start.sh"
echo ""
echo "🗑️  To completely remove containers and data:"
echo "   Run: docker compose down mongodb fileserver"
echo "   (Warning: This will delete your local database!)"

