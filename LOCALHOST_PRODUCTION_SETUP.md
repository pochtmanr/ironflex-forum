# Localhost Development with Production Database

This document explains the configuration for developing on localhost while connected to the production database and file server.

## What Was Fixed

### Problem
- Localhost was not fetching images, articles, or trainings
- The `api.ts` file had hardcoded production URLs
- Local MongoDB was not running (and not needed)

### Solution
1. **Updated API Service** (`src/services/api.ts`)
   - Changed from hardcoded `https://forum.theholylabs.com/api` to dynamic `window.location.origin/api`
   - This makes API calls go to `http://localhost:3000/api` when developing locally
   - File uploads also use the dynamic origin

2. **Updated Environment Variables** (`.env.local`)
   - `MONGODB_URI` now points to production: `mongodb://admin:StrongPassword123!@forum.theholylabs.com:27017/ironblog?authSource=admin`
   - `FILESERVER_URL` points to production: `https://forum.theholylabs.com/api`
   - This allows localhost to read/write data directly to production database

## How It Works

```
┌─────────────────┐
│  Browser        │
│  localhost:3000 │
└────────┬────────┘
         │ API calls to localhost:3000/api
         ▼
┌─────────────────────────────────┐
│  Next.js Dev Server             │
│  localhost:3000                 │
│                                 │
│  ┌───────────────────────────┐ │
│  │ API Routes                │ │
│  │ /api/forum/*             │ │
│  │ /api/content/*           │ │
│  │ /api/files/*             │ │
│  └───────┬───────────────────┘ │
└──────────┼─────────────────────┘
           │
           ├─────────────────────────────────┐
           │                                 │
           ▼                                 ▼
┌──────────────────────┐        ┌────────────────────────┐
│  Production MongoDB  │        │  Production FileServer │
│  forum.theholylabs   │        │  forum.theholylabs     │
│  :27017              │        │  /api/files/*          │
└──────────────────────┘        └────────────────────────┘
```

## Development Workflow

1. **Start Development Server**
   ```bash
   cd /Users/romanpochtman/Developer/forumnextjs/iron-blog
   npm run dev
   ```

2. **Make Changes**
   - Edit files in `src/`
   - Changes hot-reload automatically
   - All data comes from production database

3. **Test Changes**
   - Open `http://localhost:3000`
   - You'll see real production data
   - Any changes affect production data (be careful!)

4. **Deploy Changes**
   - Commit your changes to git
   - Push to your repository
   - Deploy to production server

## Important Notes

### ⚠️ Production Data Warning
You are working with **LIVE PRODUCTION DATA**. Any changes you make (creating posts, deleting topics, etc.) will affect the live site immediately!

### Environment Files
- `.env.local` - Local development (uses production DB) - **You are here**
- `.env.production` - Production server (uses local DB via Docker)

### If You Need Local Development Database
If you want to use a local MongoDB instead of production:

1. Start local services:
   ```bash
   ./dev-start.sh
   ```

2. Update `.env.local`:
   ```bash
   MONGODB_URI=mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin
   FILESERVER_URL=http://localhost:3001
   FILESERVER_FALLBACK=http://localhost:3001
   ```

3. Restart dev server

## Troubleshooting

### Images not loading
- Check that production file server is accessible
- Verify `FILESERVER_URL` in `.env.local`
- Check `/api/files/[...path]/route.ts` proxy is working

### Database connection errors
- Verify MongoDB port 27017 is accessible: `nc -zv forum.theholylabs.com 27017`
- Check server firewall allows external MongoDB connections
- Verify credentials in `.env.local`

### API 500 errors
- Check Next.js console for MongoDB connection errors
- Verify `.env.local` is loaded (restart dev server after changes)
- Check production MongoDB is running

## Files Modified

1. `src/services/api.ts`
   - Line 73: Changed to dynamic `window.location.origin/api`
   - Line 196: Changed file server to dynamic origin

2. `.env.local`
   - Updated `MONGODB_URI` to production
   - Updated `FILESERVER_URL` to production

## Backup

Your original `.env.local` is saved as `.env.local.original` if you need to restore it.

