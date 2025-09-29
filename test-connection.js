// Test MongoDB connection from any IP
const { MongoClient } = require('mongodb');

async function testConnection() {
  // You can change this IP to your server's IP
  const uri = 'mongodb://admin:StrongPassword123!@localhost:27017/ironblog?authSource=admin';
  
  console.log('Testing MongoDB connection...');
  console.log('Connection URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide password
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB');
    
    // Test database operations
    const db = client.db('ironblog');
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    // Test write operation
    const testCollection = db.collection('connection_test');
    const result = await testCollection.insertOne({
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    console.log('✍️  Test write successful:', result.insertedId);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Test cleanup completed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.close();
    console.log('🔒 Connection closed');
  }
}

// Run the test
testConnection().catch(console.error);
