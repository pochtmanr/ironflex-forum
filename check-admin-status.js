#!/usr/bin/env node

/**
 * Check if a user is admin by email
 * Usage: node check-admin-status.js <email>
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironblog';

async function checkAdminStatus(email) {
  if (!email) {
    console.error('❌ Error: Email is required');
    console.log('\nUsage: node check-admin-status.js <email>');
    console.log('Example: node check-admin-status.js user@example.com');
    process.exit(1);
  }

  console.log(`🔍 Checking admin status for: ${email}\n`);

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

    console.log('👤 User Details:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Display Name: ${user.displayName || 'N/A'}`);
    console.log(`   Is Admin: ${user.isAdmin ? '✅ YES' : '❌ NO'}`);
    console.log(`   Is Verified: ${user.isVerified ? '✅ YES' : '❌ NO'}`);
    console.log(`   Is Active: ${user.isActive ? '✅ YES' : '❌ NO'}`);
    console.log(`   Created At: ${user.createdAt}`);
    console.log(`   Last Login: ${user.lastLogin || 'Never'}\n`);

    if (!user.isAdmin) {
      console.log('💡 To make this user an admin, run:');
      console.log(`   node make-admin.js ${email}`);
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
checkAdminStatus(email);



