#!/usr/bin/env node

/**
 * Initialize MongoDB database for local development
 * This script creates collections and indexes
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/ironblog';

async function initializeDatabase() {
  console.log('🚀 Initializing MongoDB database...\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('ironblog');

    // Create collections
    console.log('📦 Creating collections...');
    const collections = ['users', 'categories', 'topics', 'posts', 'articles', 'trainings', 'resettokens'];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`  ✓ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.codeName === 'NamespaceExists') {
          console.log(`  ℹ️  Collection already exists: ${collectionName}`);
        } else {
          throw error;
        }
      }
    }

    // Create indexes
    console.log('\n📊 Creating indexes...');
    
    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    console.log('  ✓ Created unique index on users.email');
    
    try {
      await db.collection('users').createIndex({ username: 1 }, { unique: true });
      console.log('  ✓ Created unique index on users.username');
    } catch (error) {
      if (error.code !== 11000) { // Ignore duplicate key error
        console.log('  ℹ️  Index on users.username already exists');
      }
    }

    // Topics indexes
    await db.collection('topics').createIndex({ categoryId: 1 });
    console.log('  ✓ Created index on topics.categoryId');
    
    await db.collection('topics').createIndex({ createdAt: -1 });
    console.log('  ✓ Created index on topics.createdAt');

    // Posts indexes
    await db.collection('posts').createIndex({ topicId: 1 });
    console.log('  ✓ Created index on posts.topicId');
    
    await db.collection('posts').createIndex({ createdAt: -1 });
    console.log('  ✓ Created index on posts.createdAt');

    // Articles indexes
    await db.collection('articles').createIndex({ createdAt: -1 });
    console.log('  ✓ Created index on articles.createdAt');
    
    await db.collection('articles').createIndex({ published: 1 });
    console.log('  ✓ Created index on articles.published');

    // Trainings indexes
    await db.collection('trainings').createIndex({ createdAt: -1 });
    console.log('  ✓ Created index on trainings.createdAt');
    
    await db.collection('trainings').createIndex({ published: 1 });
    console.log('  ✓ Created index on trainings.published');

    // Reset tokens indexes
    await db.collection('resettokens').createIndex({ token: 1 }, { unique: true });
    console.log('  ✓ Created unique index on resettokens.token');
    
    await db.collection('resettokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('  ✓ Created TTL index on resettokens.expiresAt');

    // Get collection stats
    console.log('\n📈 Database Statistics:');
    const stats = await db.stats();
    console.log(`  Collections: ${stats.collections}`);
    console.log(`  Indexes: ${stats.indexes}`);
    console.log(`  Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);

    console.log('\n✅ Database initialization completed successfully!\n');
    console.log('You can now start the development server with: npm run dev\n');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

initializeDatabase();

