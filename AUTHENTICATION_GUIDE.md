# Authentication & Local Development Guide

## 🔴 Current Issue

You're seeing authentication errors because:
1. **Local MongoDB is NOT running** - Your dev environment needs a database
2. **No local user account** - You need to create an admin user locally
3. **No auth token in localStorage** - You need to log in to get a token

## ✅ Server Status (VPS)

**Server is working perfectly!** ✨

- **Location:** `/root/iron-blog` (no duplicates found)
- **MongoDB:** Running with 2 users
- **Next.js:** Running in production mode
- **All containers:** Healthy

### Server Users:
1. **pochtmanrca@gmail.com** (Admin, verified)
2. **13w7byba@mail.ru** (Regular user)

## 🚀 Quick Fix - Get Your Local Dev Working

### Option 1: Sync Data from Server (Recommended)

This will copy all users, categories, topics, etc. from the server to your local database:

```bash
# 1. Start local MongoDB
./start-mongodb-local.sh

# 2. Sync all data from server
./sync-from-server.sh

# 3. Start dev server
npm run dev

# 4. Log in at http://localhost:3000/login
# Use: pochtmanrca@gmail.com with your password
```

### Option 2: Create Fresh Local Admin

If you just want to test locally without server data:

```bash
# 1. Start local MongoDB
./start-mongodb-local.sh

# 2. Create admin user
./create-local-admin.sh
# Follow the prompts to create your admin account

# 3. Start dev server
npm run dev

# 4. Log in at http://localhost:3000/login
```

### Option 3: Manual Setup

```bash
# Start MongoDB
./start-mongodb-local.sh

# Create admin user manually
node make-admin.js

# Start dev server
npm run dev
```

## 🔍 Understanding the Errors

### 1. "No user logged in, redirecting to login"
- **Cause:** No JWT token in localStorage
- **Fix:** Log in through the login page

### 2. "500 Internal Server Error" on `/forum/categories` and `/forum/stats`
- **Cause:** Local MongoDB not running OR no data in database
- **Fix:** Start MongoDB and add some data (use sync script)

### 3. "No access token found in localStorage"
- **Cause:** Not logged in locally
- **Fix:** Go to `/login` and authenticate

## 📊 Current Database State

### Server (Production)
```
Users: 2
Topics: 0
Posts: 0
Categories: 0 ← This is why you're getting errors!
Articles: 0
Trainings: 0
Comments: 0
```

### Local (Development)
```
MongoDB: NOT RUNNING
Database: Empty
```

## ⚠️ Important Notes

### Why Categories API is Failing
The `/forum/categories` endpoint is returning 500 because:
- It's trying to query the database for categories
- Your local MongoDB is not running
- Even if it was running, there are NO categories (server has 0 too)

### You Need to Add Categories!
Both your local AND server databases need categories for the forum to work properly. After logging in as admin:

1. Go to `/admin/categories`
2. Create some forum categories (e.g., "General Discussion", "Support", "Announcements")
3. The forum home page will then load properly

## 🎯 Recommended Next Steps

1. **Start local MongoDB:**
   ```bash
   ./start-mongodb-local.sh
   ```

2. **Sync data from server:**
   ```bash
   ./sync-from-server.sh
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

4. **Log in:**
   - Go to http://localhost:3000/login
   - Use: `pochtmanrca@gmail.com` (or create new admin)

5. **Create categories:**
   - Go to http://localhost:3000/admin/categories
   - Add forum categories

6. **Test the forum:**
   - Go to http://localhost:3000
   - Forum should load without errors

## 🔧 Useful Commands

### Check MongoDB Status
```bash
nc -z localhost 27017 && echo "Running" || echo "Not running"
```

### View Local Database
```bash
mongosh "mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin"
```

### Check Server Database
```bash
./fetch-server-data.sh
```

### Export Server Data
```bash
./export-server-data.sh
```

## 📝 Summary

**Server:** ✅ Working perfectly, no duplicates to clean up!  
**Local:** ❌ MongoDB not running, needs setup  
**Solution:** Run the sync script or create a local admin user  

The errors you're seeing are **expected** for a fresh local development environment. Just follow Option 1 or Option 2 above to get everything working! 🚀

