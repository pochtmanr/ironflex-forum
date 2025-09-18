# IronFlex Forum - Deployment Guide

## Database Configuration

Your project is now configured to use MySQL database at:
- **Host**: `69.197.134.25`
- **Port**: `3306`
- **Database**: `ironflex_forum`
- **User**: `ironflex_user`

## Environment Variables Setup

### For Local Development
1. Copy `backend/env.example` to `backend/.env`
2. Update the database password:
```bash
DB_PASSWORD=your_actual_mysql_password_here
```

### For Vercel Deployment
Set these environment variables in your Vercel dashboard:

```bash
# Database
DB_HOST=69.197.134.25
DB_PORT=3306
DB_USER=ironflex_user
DB_PASSWORD=your_actual_mysql_password_here
DB_NAME=ironflex_forum

# Server
PORT=5000
NODE_ENV=production

# JWT (Generate secure keys)
JWT_SECRET=your_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_secure_jwt_refresh_secret_here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# CORS (Update with your Vercel domain)
CLIENT_URL=https://your-app-name.vercel.app

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

## Deployment Steps

### 1. Database Setup
Your MySQL database is already configured with the `ironflex_forum` database. The application will automatically create tables on first connection.

### 2. Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set the environment variables in Vercel dashboard
4. Deploy

### 3. Frontend Configuration
Update your frontend API configuration to point to your Vercel backend URL:

```typescript
// In src/services/api.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-app.vercel.app/api'
  : 'http://localhost:5000/api';
```

## Project Structure

```
ironflex-forum/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts  # MySQL configuration
│   │   ├── controllers/     # API controllers
│   │   ├── routes/         # API routes
│   │   └── forum-server.ts # Main server file
│   └── package.json
├── src/                    # React frontend
├── public/                 # Static files
├── vercel.json            # Vercel configuration
└── package.json           # Root package.json
```

## Features

- ✅ MySQL database connection
- ✅ User authentication with Firebase
- ✅ Forum categories, topics, and posts
- ✅ Image upload support
- ✅ Like/dislike system
- ✅ Articles and training content
- ✅ Responsive design with Tailwind CSS

## API Endpoints

- `GET /api/forum/categories` - Get all categories
- `GET /api/forum/categories/:id` - Get category with topics
- `POST /api/forum/topics` - Create new topic
- `GET /api/forum/topics/:id` - Get topic with posts
- `POST /api/forum/topics/:topicId/posts` - Create reply
- `POST /api/forum/like` - Like/unlike topic or post
- `GET /api/content/articles` - Get articles
- `GET /api/content/trainings` - Get training content

## Troubleshooting

### Database Connection Issues
1. Verify MySQL server is running on `69.197.134.25:3306`
2. Check database credentials
3. Ensure `ironflex_forum` database exists
4. Verify user `ironflex_user` has proper permissions

### Vercel Deployment Issues
1. Check environment variables are set correctly
2. Verify build logs for any errors
3. Ensure all dependencies are in package.json

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique passwords for database
- Generate secure JWT secrets for production
- Enable HTTPS in production
- Regularly update dependencies
