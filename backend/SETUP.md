# Backend Setup Guide

## Prerequisites

- Node.js 16+ installed
- MySQL 8.0+ installed and running
- npm or yarn package manager

## Database Setup

1. **Create MySQL Database**

   Connect to MySQL as root or a user with database creation privileges:

   ```bash
   mysql -u root -p
   ```

   Then run:
   ```sql
   source database/schema.sql
   ```

   Or manually:
   ```sql
   CREATE DATABASE ironflex_forum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Configure Environment**

   Copy the example environment file:
   ```bash
   cp env.example .env
   ```

   Edit `.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=ironflex_forum
   
   JWT_SECRET=generate_a_random_secret_key_here
   JWT_REFRESH_SECRET=generate_another_random_secret_key_here
   ```

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create upload directory**
   ```bash
   mkdir uploads
   ```

3. **Run database migrations**
   ```bash
   mysql -u your_user -p ironflex_forum < database/schema.sql
   ```

## Running the Server

### Development mode (with auto-reload)
```bash
npm run dev
```

### Production mode
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info (protected)

### Forum
- `GET /api/forum/categories` - Get all categories
- `GET /api/forum/categories/:id` - Get category with topics
- `POST /api/forum/topics` - Create new topic (protected)
- `GET /api/forum/topics/:id` - Get topic with posts
- `POST /api/forum/topics/:topicId/posts` - Create new post (protected)
- `GET /api/forum/search?q=query` - Search topics and posts
- `GET /api/forum/stats` - Get forum statistics

### File Upload
- `POST /api/upload/single` - Upload single file (protected)
- `POST /api/upload/multiple` - Upload multiple files (protected)
- `DELETE /api/upload/:id` - Delete file (protected)
- `GET /api/upload/my-files` - Get user's files (protected)

## Frontend Integration

Update your React app to use the MySQL backend instead of Firebase:

1. Create an API service file in your React app
2. Update authentication to use JWT tokens
3. Store tokens in localStorage or cookies
4. Add token to Authorization header for protected routes
5. Update all Firebase calls to use the new API endpoints

## Security Notes

1. Always use HTTPS in production
2. Keep JWT secrets secure and rotate them periodically
3. Implement rate limiting for production
4. Add input sanitization for user-generated content
5. Configure proper CORS settings for production
6. Use prepared statements (already implemented) to prevent SQL injection

## Troubleshooting

### Database Connection Failed
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `.env` file
- Ensure database exists
- Check MySQL user has proper permissions

### File Upload Issues
- Verify `uploads` directory exists and is writable
- Check file size limits in `.env`
- Ensure multer middleware is properly configured

### CORS Errors
- Update `CLIENT_URL` in `.env` to match your React app URL
- Check CORS configuration in `server.ts`
