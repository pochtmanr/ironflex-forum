# 🏋️ Iron Blog - Modern Forum Platform

A comprehensive Next.js 15 forum platform with MongoDB, featuring articles, trainings, and community discussions.

## 🚀 Features

- ✅ **Modern Stack:** Next.js 15 + MongoDB + TypeScript
- ✅ **Authentication:** JWT-based auth with refresh tokens
- ✅ **Admin Panel:** Full CRUD operations for categories, topics, posts, articles, trainings
- ✅ **File Uploads:** Dedicated Python file server
- ✅ **Docker Ready:** Complete containerization with docker-compose
- ✅ **SSL/TLS:** Nginx reverse proxy with Let's Encrypt
- ✅ **Real-time:** Direct database connection for instant updates

## 📋 Requirements

- Node.js 18+
- MongoDB 7.0+
- Docker & Docker Compose (for production)
- Python 3.13+ (for file server)

## 🛠️ Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/pochtmanr/ironflex-forum.git
cd ironflex-forum

# Install dependencies
npm install

# Set up environment
cp env.example .env.local
# Edit .env.local with your settings

# Start MongoDB (if using local)
./start-mongodb-local.sh

# Start development server
npm run dev
```

Visit http://localhost:3000

### Development with Server Database

Connect directly to production database for development:

```bash
# .env.local
MONGODB_URI=mongodb://admin:StrongPassword123!@45.10.43.204:27017/ironblog?authSource=admin
FILESERVER_URL=http://45.10.43.204:3001
NEXT_PUBLIC_FILESERVER_URL=http://45.10.43.204:3001
```

See `DIRECT_SERVER_CONNECTION.md` for details.

## 🐳 Production Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Next.js | 3000 | Main application |
| MongoDB | 27017 | Database |
| Nginx | 80, 443 | Reverse proxy |
| File Server | 3001 | File uploads |

## 🔄 Deployment from GitHub

### Automated (GitHub Actions)

1. Push to `main` branch
2. GitHub Actions automatically deploys to VPS
3. Containers rebuild and restart

### Manual Deployment

```bash
# On VPS server
cd /root/iron-blog
./deploy-from-github.sh
```

### Check Deployment Status

```bash
./check-deployment.sh
```

## 📁 Project Structure

```
iron-blog/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── admin/             # Admin panel
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   └── ...
│   ├── components/            # React components
│   │   ├── Auth/             # Login, Register
│   │   ├── Forum/            # Forum components
│   │   ├── Layout/           # Header, Footer
│   │   └── UI/               # Reusable UI components
│   ├── contexts/             # React contexts
│   ├── lib/                  # Utilities
│   ├── models/               # MongoDB models
│   └── services/             # API services
├── fileserver/               # Python file upload server
├── public/                   # Static assets
├── docker-compose.yml        # Docker orchestration
├── Dockerfile               # Next.js container
└── nginx.conf               # Nginx configuration
```

## 🔐 Security

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- MongoDB authentication
- Nginx SSL/TLS termination
- Environment variable protection
- Docker network isolation

## 👥 User Roles

- **Admin:** Full access to admin panel
- **User:** Can create topics, posts, comments
- **Guest:** Read-only access

## 📊 Admin Panel

Access at `/admin` (requires admin privileges)

- **Categories:** Create and manage forum categories
- **Topics:** Moderate discussions
- **Posts:** Manage comments
- **Users:** User management
- **Articles:** Content management
- **Trainings:** Course management

## 🔧 Configuration

### Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://admin:password@localhost:27017/ironblog?authSource=admin

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# File Server
FILESERVER_URL=http://localhost:3001
NEXT_PUBLIC_FILESERVER_URL=http://localhost:3001

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 📖 Documentation

- `SECURE_DEPLOYMENT_GUIDE.md` - Deployment best practices
- `DIRECT_SERVER_CONNECTION.md` - Connect to production DB
- `AUTHENTICATION_GUIDE.md` - Auth setup and troubleshooting
- `SERVER_STATUS.md` - Current server status
- `LOCAL_DEVELOPMENT.md` - Local setup guide

## 🚨 Troubleshooting

### Connection Issues

```bash
# Check server status
./fetch-server-data.sh

# View logs
docker logs iron-blog-nextjs-app-1 --tail 50
docker logs mongodb --tail 50
```

### Database Issues

```bash
# Connect to MongoDB
mongosh "mongodb://admin:StrongPassword123!@45.10.43.204:27017/ironblog?authSource=admin"

# Check collections
db.getCollectionNames()
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is private and proprietary.

## 👨‍💻 Authors

- **Roman Pochtman** - [@pochtmanr](https://github.com/pochtmanr)

## 🔗 Links

- **Production:** http://45.10.43.204
- **GitHub:** https://github.com/pochtmanr/ironflex-forum
- **Admin Panel:** http://45.10.43.204/admin

## ⚠️ Important: Single Repository

This project uses **only** `https://github.com/pochtmanr/ironflex-forum`  
Do not push to any other repositories.

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Contact: pochtmanrca@gmail.com

---

**Built with ❤️ using Next.js 15 and MongoDB**
