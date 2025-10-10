#!/bin/bash

# Environment Setup Script for Iron Blog
# This script creates proper .env files for development and production

echo "🔧 Setting up Iron Blog Environment Configuration..."

# Create .env.local for local development
cat > .env.local << 'EOF'
# Local Development Environment Configuration
MONGODB_URI=mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-2024
SMTP_HOST=95.163.180.91
SMTP_PORT=25
FROM_EMAIL=noreply@ironblog.local
SMTP_USER=
SMTP_PASS=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
BRAND_NAME=Клинический Протокол Тарновского
FILESERVER_URL=http://localhost:3001
FILESERVER_FALLBACK=http://localhost:3001
EOF

echo "✅ Created .env.local for local development"

# Create .env.production for production
cat > .env.production << 'EOF'
# Production Environment Configuration
MONGODB_URI=mongodb://admin:StrongPassword123!@mongodb:27017/ironblog?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-2024
SMTP_HOST=95.163.180.91
SMTP_PORT=25
FROM_EMAIL=noreply@ironblog.local
SMTP_USER=
SMTP_PASS=
NEXT_PUBLIC_SITE_URL=https://forum.theholylabs.com
BRAND_NAME=Клинический Протокол Тарновского
FILESERVER_URL=http://fileserver:3001
FILESERVER_FALLBACK=http://localhost:3001
EOF

echo "✅ Created .env.production for production deployment"

echo ""
echo "📋 Environment files created:"
echo "  - .env.local (for npm run dev)"
echo "  - .env.production (for npm run build and production)"
echo ""
echo "⚠️  Important: Update JWT secrets before deploying to production!"
echo ""

