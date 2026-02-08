#!/usr/bin/env node

/**
 * Initialize MongoDB database for local development
 * This script creates collections and indexes
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/ironblog';

async function initializeDatabase() {

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();

    const db = client.db('ironblog');

    // Create collections
    const collections = ['users', 'categories', 'topics', 'posts', 'articles', 'trainings', 'resettokens'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
      } catch (error) {
        if (error.codeName === 'NamespaceExists') {
        } else {
          throw error;
        }
      }
    }

    // Create indexes
    
    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    try {
      await db.collection('users').createIndex({ username: 1 }, { unique: true });
    } catch (error) {
      if (error.code !== 11000) { // Ignore duplicate key error
      }
    }

    // Topics indexes
    await db.collection('topics').createIndex({ categoryId: 1 });
    
    await db.collection('topics').createIndex({ createdAt: -1 });

    // Posts indexes
    await db.collection('posts').createIndex({ topicId: 1 });       
    
    await db.collection('posts').createIndex({ createdAt: -1 });

    // Articles indexes
    await db.collection('articles').createIndex({ createdAt: -1 });
    
    await db.collection('articles').createIndex({ published: 1 });

    // Trainings indexes
    await db.collection('trainings').createIndex({ createdAt: -1 });
    
    await db.collection('trainings').createIndex({ published: 1 });

    // Reset tokens indexes
    await db.collection('resettokens').createIndex({ token: 1 }, { unique: true });
    
    await db.collection('resettokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Get collection stats
    const stats = await db.stats();
  } catch (error) {
    process.exit(1);
  } finally {
    await client.close();
  }
}

initializeDatabase();

