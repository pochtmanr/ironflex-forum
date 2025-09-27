import mongoose, { Document, Schema } from 'mongoose'

export interface IPost extends Document {
  _id: string
  topicId: string
  userId: string
  userName: string
  userEmail: string
  content: string
  mediaLinks: string[]
  likes: number
  dislikes: number
  isEdited: boolean
  editedAt?: Date
  isActive: boolean
  parentPostId?: string
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<IPost>({
  topicId: {
    type: String,
    required: true,
    ref: 'Topic'
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
  content: {
    type: String,
    required: true
  },
  mediaLinks: [{
    type: String
  }],
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentPostId: {
    type: String,
    ref: 'Post'
  }
}, {
  timestamps: true
})

// Ensure virtual fields are serialized
PostSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  }
})

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema)
