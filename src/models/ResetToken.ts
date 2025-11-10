import mongoose, { Document, Schema } from 'mongoose'

export interface IResetToken extends Document {
  userId: string
  token: string
  type: 'password_reset' | 'email_verification'
  expiresAt: Date
  used: boolean
  createdAt: Date
}

const ResetTokenSchema = new Schema<IResetToken>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['password_reset', 'email_verification']
  },
  expiresAt: {
    type: Date,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index for automatic cleanup of expired tokens
ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.ResetToken || mongoose.model<IResetToken>('ResetToken', ResetTokenSchema)

