import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  _id: string
  email: string
  username: string
  passwordHash?: string
  displayName?: string
  photoURL?: string
  bio?: string
  isActive: boolean
  isAdmin: boolean
  isVerified: boolean
  googleId?: string
  githubId?: string
  refreshToken?: string
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: false
  },
  displayName: {
    type: String,
    trim: true
  },
  photoURL: {
    type: String
  },
  bio: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    sparse: true
  },
  githubId: {
    type: String,
    sparse: true
  },
  refreshToken: {
    type: String
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
})

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    delete ret.passwordHash
    return ret
  }
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
