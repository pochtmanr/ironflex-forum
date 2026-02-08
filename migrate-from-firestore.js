/**
 * Migration script from Firestore to MongoDB
 * 
 * This script helps migrate your existing Firestore data to MongoDB
 * Run this after setting up your MongoDB database
 */

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Define models directly (since we can't import TypeScript modules in JS)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, trim: true },
  photoURL: { type: String },
  bio: { type: String, maxlength: 500 },
  isActive: { type: Boolean, default: true },
  isAdmin: { type: Boolean, default: false },
  lastLogin: { type: Date }
}, { timestamps: true })

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  orderIndex: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const TopicSchema = new mongoose.Schema({
  categoryId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  title: { type: String, required: true, trim: true, maxlength: 255 },
  content: { type: String, required: true },
  mediaLinks: [{ type: String }],
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastPostAt: { type: Date, default: Date.now },
  replyCount: { type: Number, default: 0 }
}, { timestamps: true })

const PostSchema = new mongoose.Schema({
  topicId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  content: { type: String, required: true },
  mediaLinks: [{ type: String }],
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isActive: { type: Boolean, default: true },
  parentPostId: { type: String }
}, { timestamps: true })

// Create models
const User = mongoose.model('User', UserSchema)
const Category = mongoose.model('Category', CategorySchema)
const Topic = mongoose.model('Topic', TopicSchema)
const Post = mongoose.model('Post', PostSchema)

async function migrateData() {
  try {
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)

    // 1. Create default categories (matching your Firestore structure)
    const defaultCategories = [
      {
        name: 'Новости и соревнования',
        description: 'Все новости бодибилдинга, пауэрлифтинга и других видов спорта.',
        slug: 'news-competitions',
        orderIndex: 1
      },
      {
        name: 'Новичкам',
        description: 'Раздел для начинающих, содержащий схемы тренировок для новичков',
        slug: 'beginners',
        orderIndex: 2
      },
      {
        name: 'Питание',
        description: 'Все о питании в бодибилдинге, диеты, рецепты',
        slug: 'nutrition',
        orderIndex: 3
      },
      {
        name: 'Спортивное питание',
        description: 'Протеины, гейнеры, аминокислоты, креатин и другие добавки',
        slug: 'sports-nutrition',
        orderIndex: 4
      },
      {
        name: 'Фармакология',
        description: 'Обсуждение фармакологических препаратов в спорте',
        slug: 'pharmacology',
        orderIndex: 5
      },
      {
        name: 'Тренировки',
        description: 'Программы тренировок, методики, техника выполнения упражнений',
        slug: 'training',
        orderIndex: 6
      }
    ]

    for (const categoryData of defaultCategories) {
      const existingCategory = await Category.findOne({ slug: categoryData.slug })
      if (!existingCategory) {
        await Category.create(categoryData)
      } else {
      }
    }

  } catch (error) {
  } finally {
    await mongoose.disconnect()
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData()
}

module.exports = { migrateData }
