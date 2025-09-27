export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            IronFlex Forum - MongoDB Migration Guide
          </h1>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">1. MongoDB Setup</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Option A: Local MongoDB</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`# Install MongoDB locally
brew install mongodb-community
# or
sudo apt-get install mongodb

# Start MongoDB
mongod`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Option B: MongoDB Atlas (Recommended)</h3>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`# 1. Create account at https://cloud.mongodb.com
# 2. Create a new cluster
# 3. Get connection string
# 4. Use in .env.local:
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/ironflex_forum"`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">2. Environment Configuration</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`cp env.example .env.local

# Edit .env.local with your MongoDB connection:
MONGODB_URI="mongodb://localhost:27017/ironflex_forum"
JWT_SECRET="your_jwt_secret_key_here"
JWT_REFRESH_SECRET="your_jwt_refresh_secret_key_here"`}
              </pre>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">3. Install Dependencies</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`npm install`}
              </pre>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">4. Initialize Database</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`# Run migration script to create default categories
node migrate-from-firestore.js`}
              </pre>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4">5. Start Development Server</h2>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`npm run dev`}
              </pre>
              <p className="mt-2 text-gray-600">
                The application will be available at <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000</code>
              </p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h2 className="text-2xl font-semibold mb-4 text-blue-800">🔄 Data Migration from Firebase</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-blue-700 mb-2">Export from Firestore:</h3>
                  <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
{`# Use Firebase Admin SDK or Firebase Console
# Export collections: users, categories, topics, posts`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold text-blue-700 mb-2">Transform Data:</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Convert Firestore documents to MongoDB format</li>
                    <li>Map field names to match new schema</li>
                    <li>Handle nested objects and arrays</li>
                    <li>Convert timestamps to Date objects</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-blue-700 mb-2">Import to MongoDB:</h3>
                  <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
{`# Use mongoimport or MongoDB Compass
mongoimport --db ironflex_forum --collection users --file users.json
mongoimport --db ironflex_forum --collection topics --file topics.json
mongoimport --db ironflex_forum --collection posts --file posts.json`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-2xl font-semibold mb-4 text-green-800">✅ Migration Advantages</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-green-700">
                  <li>• Same NoSQL structure as Firestore</li>
                  <li>• Easier data migration process</li>
                  <li>• Full data ownership</li>
                  <li>• Better performance</li>
                  <li>• More flexible queries</li>
                </ul>
                <ul className="space-y-2 text-green-700">
                  <li>• No vendor lock-in</li>
                  <li>• Self-hosted option</li>
                  <li>• Better cost control</li>
                  <li>• Advanced indexing</li>
                  <li>• Aggregation pipelines</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h2 className="text-2xl font-semibold mb-4 text-yellow-800">🚀 Deployment Options</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-yellow-700 mb-2">Vercel + MongoDB Atlas:</h3>
                  <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
{`# 1. Deploy to Vercel
npx vercel

# 2. Set environment variables in Vercel dashboard
# 3. Use MongoDB Atlas connection string
# 4. Deploy with --prod flag`}
                  </pre>
                </div>
                
                <div>
                  <h3 className="font-semibold text-yellow-700 mb-2">Other MongoDB Hosting:</h3>
                  <ul className="list-disc list-inside space-y-1 text-yellow-700">
                    <li>MongoDB Atlas (Cloud)</li>
                    <li>Railway</li>
                    <li>DigitalOcean Managed Database</li>
                    <li>AWS DocumentDB</li>
                    <li>Self-hosted MongoDB</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
