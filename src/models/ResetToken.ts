import mongoose, { Document, Schema } from 'mongoose'

export interface IResetToken extends Document {
  _id: string
  userId: string
  token: string
  type: 'password_reset' | 'email_verification' | 'email_change'
  email?: string // For email change requests - the new email
  expiresAt: Date
  used: boolean
  createdAt: Date
}

const ResetTokenSchema = new Schema<IResetToken>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['password_reset', 'email_verification', 'email_change']
  },
  email: {
    type: String,
    required: false // Only for email change requests
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
ResetTokenSchema.index({ userId: 1, type: 1 })
ResetTokenSchema.index({ token: 1, used: 1 })

// Ensure virtual fields are serialized
ResetTokenSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc: any, ret: any) {
    ret.id = ret._id
    if (ret._id) delete ret._id
    if (ret.__v) delete ret.__v
    return ret
  }
})

export default mongoose.models.ResetToken || mongoose.model<IResetToken>('ResetToken', ResetTokenSchema)
