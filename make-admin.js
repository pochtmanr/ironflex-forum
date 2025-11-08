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
    console.log('\nUsage: node make-admin.js <email>');
    console.log('Example: node make-admin.js user@example.com');
    process.exit(1);
  }

  console.log(`🔧 Making user admin: ${email}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('ironblog');
    const users = db.collection('users');

    // Find the user
    const user = await users.findOne({ email });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log('👤 User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Display Name: ${user.displayName || 'N/A'}`);
    console.log(`   Current Admin Status: ${user.isAdmin ? 'Yes' : 'No'}\n`);

    if (user.isAdmin) {
      console.log('ℹ️  User is already an admin. No changes needed.');
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
      console.log('✅ User successfully promoted to admin!\n');
      console.log('   Admin Status: Yes');
      console.log('   Verified: Yes');
    } else {
      console.error('❌ Failed to update user');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Get email from command line arguments
const email = process.argv[2];
makeAdmin(email);

