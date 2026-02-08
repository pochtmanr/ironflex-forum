#!/usr/bin/env node

/**
 * Check if a user is admin by email
 * Usage: node check-admin-status.js <email>
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironblog';

async function checkAdminStatus(email) {
  if (!email) {
    console.error('❌ Ошибка: Email адрес обязателен');
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
checkAdminStatus(email);



