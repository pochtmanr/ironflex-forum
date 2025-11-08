# Local Development Setup

This guide will help you set up the project for local development.

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (installed via Homebrew or Docker)

## Option 1: MongoDB via Homebrew (Recommended for Local Development)

### 1. Start MongoDB

```bash
# Make the script executable
chmod +x start-mongodb-local.sh stop-mongodb-local.sh

# Start MongoDB
./start-mongodb-local.sh
```

Or start MongoDB as a service:

```bash
# Start MongoDB as a background service
brew services start mongodb-community

# Stop the service when done
brew services stop mongodb-community
```

### 2. Create Environment Variables

Create a `.env.local` file in the `iron-blog` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/ironblog

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production

# File Server Configuration
FILESERVER_URL=http://localhost:3001
NEXT_PUBLIC_FILESERVER_URL=http://localhost:3001

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Initialize MongoDB Database (First Time Only)

```bash
# Connect to MongoDB
mongosh

# Switch to ironblog database
use ironblog

# Create collections with indexes
db.createCollection('users');
db.createCollection('categories');
db.createCollection('topics');
db.createCollection('posts');
db.createCollection('articles');
db.createCollection('trainings');

# Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.topics.createIndex({ "categoryId": 1 });
db.topics.createIndex({ "createdAt": -1 });
db.posts.createIndex({ "topicId": 1 });
db.posts.createIndex({ "createdAt": -1 });

# Exit
exit
```

### 4. Start the Development Server

```bash
npm install
npm run dev
```

The app will be available at http://localhost:3000

## Option 2: MongoDB via Docker Compose

### 1. Start Docker

Make sure Docker Desktop is running.

### 2. Start MongoDB Container Only

```bash
docker-compose up -d mongodb
```

### 3. Create Environment Variables

Create a `.env.local` file:

```env
# MongoDB Configuration (with authentication for Docker)
MONGODB_URI=mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production

# File Server Configuration
FILESERVER_URL=http://localhost:3001
NEXT_PUBLIC_FILESERVER_URL=http://localhost:3001

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
npm install
npm run dev
```

## File Server (Optional)

If you need to upload files, you can either:

### Option A: Start file server with Docker

```bash
docker-compose up -d fileserver
```

### Option B: Run file server locally

```bash
cd fileserver
pip install -r requirements.txt
python app.py
```

## Useful Commands

### MongoDB Commands

```bash
# Check MongoDB status (Homebrew)
brew services list | grep mongodb

# Connect to MongoDB shell
mongosh

# View all databases
show dbs

# Switch to ironblog database
use ironblog

# View collections
show collections

# View users
db.users.find()

# View categories
db.categories.find()
```

### Docker Commands

```bash
# View running containers
docker ps

# View MongoDB logs
docker logs mongodb

# Stop MongoDB container
docker-compose stop mongodb

# Remove MongoDB container and data
docker-compose down -v
```

## Troubleshooting

### MongoDB Connection Issues

1. Check if MongoDB is running:
   ```bash
   pgrep mongod
   # or for Docker:
   docker ps | grep mongodb
   ```

2. Check MongoDB logs:
   ```bash
   # For Homebrew installation
   tail -f /opt/homebrew/var/log/mongodb/mongo.log
   
   # For Docker
   docker logs mongodb
   ```

3. Test connection:
   ```bash
   mongosh --host localhost --port 27017
   ```

### Port Already in Use

If port 27017 is already in use:

```bash
# Find what's using the port
lsof -i :27017

# Kill the process
kill -9 <PID>
```

## Creating an Admin User

Once the app is running, you can create an admin user:

1. Register a new user at http://localhost:3000/register
2. Run the admin creation script:

```bash
node create-admin.js <email>
```

Replace `<email>` with the email you just registered.

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens | Yes |
| `FILESERVER_URL` | File server URL (backend) | Yes |
| `NEXT_PUBLIC_FILESERVER_URL` | File server URL (frontend) | Yes |
| `NEXT_PUBLIC_BASE_URL` | Base URL of the application | Yes |
| `EMAIL_USER` | Email account for sending emails | No |
| `EMAIL_PASSWORD` | Email account password | No |
| `EMAIL_FROM` | From email address | No |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `VK_CLIENT_ID` | VK OAuth client ID | No |
| `VK_CLIENT_SECRET` | VK OAuth client secret | No |

