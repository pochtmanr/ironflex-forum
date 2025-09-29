// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('ironblog');

// Create a dedicated user for the ironblog database
db.createUser({
  user: 'ironblog_user',
  pwd: 'IronBlogPass456!',
  roles: [
    {
      role: 'readWrite',
      db: 'ironblog'
    }
  ]
});

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('categories');
db.createCollection('topics');
db.createCollection('posts');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.topics.createIndex({ "categoryId": 1 });
db.topics.createIndex({ "createdAt": -1 });
db.posts.createIndex({ "topicId": 1 });
db.posts.createIndex({ "createdAt": -1 });

print('MongoDB initialization completed successfully');
