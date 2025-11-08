import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment extends Document {
  contentType: 'article' | 'training' | 'forum';
  contentId: string;
  userId: string;
  content: string;
  likes: number;
  created_at: Date;
  updated_at?: Date;
}

const commentSchema = new Schema<IComment>({
  contentType: {
    type: String,
    enum: ['article', 'training', 'forum'],
    required: true,
    index: true
  },
  contentId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date
  }
});

// Compound index for efficient queries
commentSchema.index({ contentType: 1, contentId: 1, created_at: -1 });

const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);

export default Comment;

