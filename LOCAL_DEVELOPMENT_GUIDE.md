# Local Development Setup Guide

This guide will help you set up the project for local development on your Mac.

## Prerequisites

You need to have MongoDB and the fileserver running locally. You have two options:

### Option 1: Use Docker Desktop (Recommended)

1. **Install Docker Desktop for Mac**
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop

2. **Start Required Services**
   ```bash
   cd /Users/romanpochtman/Developer/forumnextjs/iron-blog
   
   # Start MongoDB and fileserver
   docker compose up -d mongodb fileserver
   ```

3. **Verify Services are Running**
   ```bash
   docker ps
   ```
   You should see `mongodb` and `fileserver` containers running.

4. **Start Next.js Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open http://localhost:3000
   - MongoDB will be available at localhost:27017
   - Fileserver will be available at localhost:3001

### Option 2: Install MongoDB Directly on Mac

If you don't want to use Docker:

1. **Install MongoDB using Homebrew**
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community@7.0
   ```

2. **Start MongoDB**
   ```bash
   brew services start mongodb-community@7.0
   ```

3. **Create Admin User**
   ```bash
   mongosh
   ```
   Then in MongoDB shell:
   ```javascript
   use admin
   db.createUser({
     user: "admin",
     pwd: "StrongPassword123!",
     roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
   })
   exit
   ```

4. **Enable Authentication**
   Edit `/opt/homebrew/etc/mongod.conf` and add:
   ```yaml
   security:
     authorization: enabled
   ```

5. **Restart MongoDB**
   ```bash
   brew services restart mongodb-community@7.0
   ```

6. **Start Fileserver**
   ```bash
   cd fileserver
   python3 app.py
   ```
   (Or use Docker for fileserver only: `docker compose up -d fileserver`)

7. **Start Next.js Development Server**
   ```bash
   npm run dev
   ```

## Environment Files

### `.env.local` (Local Development)
Already created with:
- MongoDB: `mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin`
- Site URL: `http://localhost:3000`
- Fileserver: `http://localhost:3001`

### `.env.production` (Production Server)
On the server at `/home/ubuntu/iron-blog/.env.production`:
- MongoDB: `mongodb://admin:StrongPassword123!@mongodb:27017/ironblog?authSource=admin` (Docker internal network)
- Site URL: `https://forum.theholylabs.com`
- Fileserver: `http://fileserver:3001` (Docker internal network)

## Quick Start Commands

### Using Docker (Recommended)

```bash
# Start all services
cd /Users/romanpochtman/Developer/forumnextjs/iron-blog
docker compose up -d mongodb fileserver

# Start development
npm run dev

# Stop services when done
docker compose stop mongodb fileserver
```

### Without Docker

```bash
# Make sure MongoDB is running
brew services start mongodb-community@7.0

# Start fileserver in one terminal
cd fileserver && python3 app.py

# Start Next.js in another terminal
npm run dev
```

## Troubleshooting

### MongoDB Connection Refused

If you see `ECONNREFUSED ::1:27017` or `127.0.0.1:27017`:

1. **Check if MongoDB is running**:
   ```bash
   # For Docker:
   docker ps | grep mongodb
   
   # For Homebrew:
   brew services list | grep mongodb
   ```

2. **Check MongoDB logs**:
   ```bash
   # For Docker:
   docker logs mongodb
   
   # For Homebrew:
   tail -f /opt/homebrew/var/log/mongodb/mongo.log
   ```

3. **Test MongoDB connection**:
   ```bash
   mongosh "mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin"
   ```

### Port Already in Use

If port 27017 or 3001 is already in use:

```bash
# Find process using the port
lsof -i :27017
lsof -i :3001

# Kill the process if needed
kill -9 <PID>
```

### Create Admin User for Testing

Once MongoDB is running:

```bash
# Connect to MongoDB
mongosh "mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin"

# Run in MongoDB shell:
use ironblog
db.users.insertOne({
  email: "admin@test.com",
  username: "admin",
  passwordHash: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5gyAXAzMR8lqu", // password: admin123
  displayName: "Admin User",
  role: "admin",
  isActive: true,
  isEmailVerified: true,
  created_at: new Date(),
  updated_at: new Date()
})
```

Login credentials: `admin@test.com` / `admin123`

## Development Workflow

1. **Start Services** (MongoDB + Fileserver)
2. **Start Next.js** (`npm run dev`)
3. **Make Changes** (Hot reload enabled)
4. **Test Locally** (http://localhost:3000)
5. **Build & Deploy** to production when ready

## Production Deployment

When you're ready to deploy changes to production:

```bash
# Make sure your changes are committed
git status

# The deployment script will handle:
# - Building the Docker image
# - Copying files to server
# - Restarting containers

# Just run the deployment as before
```

The production environment uses Docker's internal networking, so MongoDB and fileserver are accessed via container names (`mongodb:27017`, `fileserver:3001`) rather than `localhost`.

