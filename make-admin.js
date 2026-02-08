#!/usr/bin/env node

/**
 * Make a user admin by email
 * Usage: node make-admin.js <email>
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironblog';

async function makeAdmin(email) {
  if (!email) {
    console.error('❌ Error: Email is required');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();

    const db = client.db('ironblog');
    const users = db.collection('users');

    // Find the user
    const user = await users.findOne({ email });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    if (user.isAdmin) {
      process.exit(0);
    }

    // Update the user to admin
    const result = await users.updateOne(
      { email },
      { 
        $set: { 
          isAdmin: true,
          isVerified: true // Also verify the user
        } 
      }
    );

    if (result.modifiedCount > 0) {
    } else {
      process.exit(1);
    }

  } catch (error) {
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Get email from command line arguments
const email = process.argv[2];
makeAdmin(email);

