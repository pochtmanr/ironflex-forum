import mongoose, { Schema, Document } from 'mongoose'

export interface ITraining extends Document {
  title: string
  slug: string
  subheader: string
  content: string
  coverImageUrl: string
  level: string
  durationMinutes: number | null
  authorName: string
  likes: number
  views: number
  commentCount: number
  created_at: Date
  updated_at: Date
}

const TrainingSchema = new Schema<ITraining>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  subheader: { type: String, default: '' },
  content: { type: String, required: true },
  coverImageUrl: { type: String, default: '' },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  durationMinutes: { type: Number, default: null },
  authorName: { type: String, required: true },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Update the updated_at timestamp on save
TrainingSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

export default mongoose.models.Training || mongoose.model<ITraining>('Training', TrainingSchema)

