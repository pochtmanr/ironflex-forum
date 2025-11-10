import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFlaggedPost extends Document {
  postId: string;
  topicId: string;
  topicTitle: string;
  postContent: string;
  postAuthorId: string;
  postAuthorName: string;
  flaggedBy: string;
  flaggedByName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

const flaggedPostSchema = new Schema<IFlaggedPost>({
  postId: {
    type: String,
    required: true,
    index: true
  },
  topicId: {
    type: String,
    required: true,
    index: true
  },
  topicTitle: {
    type: String,
    required: true
  },
  postContent: {
    type: String,
    required: true
  },
  postAuthorId: {
    type: String,
    required: true,
    index: true
  },
  postAuthorName: {
    type: String,
    required: true
  },
  flaggedBy: {
    type: String,
    required: true,
    index: true
  },
  flaggedByName: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: String
  }
});

// Compound index for efficient queries
flaggedPostSchema.index({ status: 1, createdAt: -1 });

const FlaggedPost: Model<IFlaggedPost> = mongoose.models.FlaggedPost || mongoose.model<IFlaggedPost>('FlaggedPost', flaggedPostSchema);

export default FlaggedPost;

