# Quick Start Guide

Get up and running with the Iron Blog forum in minutes!

## 🚀 Quick Setup (3 steps)

### 1. Start MongoDB

```bash
./start-mongodb-local.sh
```

MongoDB will start on `localhost:27017` without authentication (perfect for local development).

### 2. Create `.env.local` file

Create a file named `.env.local` in the `iron-blog` directory with:

```env
MONGODB_URI=mongodb://localhost:27017/ironblog
JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here
FILESERVER_URL=http://localhost:3001
NEXT_PUBLIC_FILESERVER_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Start the Development Server

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser! 🎉

## 📝 Common Tasks

### Check MongoDB Status

```bash
pgrep mongod
# or
mongosh --eval "db.serverStatus().ok"
```

### Stop MongoDB

```bash
./stop-mongodb-local.sh
```

### View Database Collections

```bash
mongosh ironblog --eval "db.getCollectionNames()"
```

### Reinitialize Database

```bash
node init-db-local.js
```

### Create Admin User

**Option 1: First User (Automatic)**
The first user to register on the site automatically becomes an admin!

**Option 2: Make Existing User Admin**
```bash
npm run admin:make your-email@example.com
# or
node make-admin.js your-email@example.com
```

### View MongoDB Logs

```bash
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

## 🔧 Troubleshooting

### Port 27017 Already in Use

```bash
lsof -i :27017
kill -9 <PID>
```

### MongoDB Won't Start

Check the logs:
```bash
cat /opt/homebrew/var/log/mongodb/mongo.log
```

### Cannot Connect to Database

1. Ensure MongoDB is running: `pgrep mongod`
2. Test connection: `mongosh mongodb://localhost:27017/ironblog`
3. Check `.env.local` has correct `MONGODB_URI`

### Clear All Data and Start Fresh

```bash
./stop-mongodb-local.sh
rm -rf /opt/homebrew/var/mongodb/*
./start-mongodb-local.sh
node init-db-local.js
```

## 📚 More Information

- Full setup guide: [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)
- Docker setup: [docker-compose.yml](./docker-compose.yml)
- Main README: [README.md](./README.md)

## 🛑 Stopping Everything

```bash
# Stop MongoDB
./stop-mongodb-local.sh

# Stop Next.js dev server
# Press Ctrl+C in the terminal where npm run dev is running
```

## 💡 Tips

- MongoDB logs are at: `/opt/homebrew/var/log/mongodb/mongo.log`
- MongoDB data is at: `/opt/homebrew/var/mongodb`
- No authentication is needed for local development
- Use `mongosh` to interact with MongoDB directly
- Use MongoDB Compass GUI: `mongodb://localhost:27017`

---

**Need help?** Check [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed documentation.

