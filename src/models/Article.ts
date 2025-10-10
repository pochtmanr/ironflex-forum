import mongoose, { Schema, Document } from 'mongoose'

export interface IArticle extends Document {
  title: string
  slug: string
  subheader: string
  content: string
  coverImageUrl: string
  tags: string
  likes: number
  views: number
  commentCount: number
  created_at: Date
  updated_at: Date
}

const ArticleSchema = new Schema<IArticle>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  subheader: { type: String, default: '' },
  content: { type: String, required: true },
  coverImageUrl: { type: String, default: '' },
  tags: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})

// Update the updated_at timestamp on save
ArticleSchema.pre('save', function(next) {
  this.updated_at = new Date()
  next()
})

export default mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema)

