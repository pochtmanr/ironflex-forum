import mongoose, { Document, Schema } from 'mongoose'

export interface ITopic extends Document {
  _id: string
  categoryId: string
  userId: string
  userName: string
  userEmail: string
  title: string
  content: string
  mediaLinks: string[]
  views: number
  likes: number
  dislikes: number
  isPinned: boolean
  isLocked: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastPostAt: Date
  replyCount: number
}

const TopicSchema = new Schema<ITopic>({
  categoryId: {
    type: String,
    required: true,
    ref: 'Category'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  content: {
    type: String,
    required: true
  },
  mediaLinks: [{
    type: String
  }],
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastPostAt: {
    type: Date,
    default: Date.now
  },
  replyCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Ensure virtual fields are serialized
TopicSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  }
})

export default mongoose.models.Topic || mongoose.model<ITopic>('Topic', TopicSchema)
