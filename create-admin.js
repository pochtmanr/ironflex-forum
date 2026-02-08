const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema (simplified for this script)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, trim: true },
  photoURL: { type: String },
  bio: { type: String, maxlength: 500 },
  isActive: { type: Boolean, default: true },
  isAdmin: { type: Boolean, default: false },
  lastLogin: { type: Date }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://admin:password@localhost:27017/ironblog?authSource=admin');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      email: 'admin@example.com',
      username: 'admin',
      passwordHash: passwordHash,
      displayName: 'Administrator',
      isActive: true,
      isAdmin: true
    });

    await adminUser.save();

  } catch (error) {
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
