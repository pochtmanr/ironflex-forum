import mongoose from 'mongoose';

/**
 * Like Service
 * Handles all like/dislike logic with vote tracking to prevent multiple votes per user
 */

export interface VoteResult {
  success: boolean;
  message: string;
  likes?: number;
  dislikes?: number;
  userVote?: 'like' | 'dislike' | null;
}

/**
 * Process a like/dislike vote on a document (Topic or Post)
 * Prevents duplicate voting - user can only vote once
 * If user votes again with same type, it removes the vote
 * If user votes with different type, it changes the vote
 */
export async function processVote(
  Model: mongoose.Model<any>,
  documentId: string,
  userId: string,
  voteType: 'like' | 'dislike'
): Promise<VoteResult> {
  try {
    // Find the document
    const document = await Model.findById(documentId);
    if (!document) {
      return {
        success: false,
        message: 'Document not found'
      };
    }

    // Initialize vote tracking arrays if they don't exist
    if (!document.likedBy) document.likedBy = [];
    if (!document.dislikedBy) document.dislikedBy = [];

    const hasLiked = document.likedBy.includes(userId);
    const hasDisliked = document.dislikedBy.includes(userId);

    let updateOperation: any = {};

    if (voteType === 'like') {
      if (hasLiked) {
        // User already liked - remove the like
        updateOperation = {
          $pull: { likedBy: userId },
          $inc: { likes: -1 }
        };
      } else {
        // Add like
        updateOperation = {
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 }
        };
        
        // If user had disliked, remove the dislike
        if (hasDisliked) {
          updateOperation.$pull = { dislikedBy: userId };
          updateOperation.$inc.dislikes = -1;
        }
      }
    } else { // dislike
      if (hasDisliked) {
        // User already disliked - remove the dislike
        updateOperation = {
          $pull: { dislikedBy: userId },
          $inc: { dislikes: -1 }
        };
      } else {
        // Add dislike
        updateOperation = {
          $addToSet: { dislikedBy: userId },
          $inc: { dislikes: 1 }
        };
        
        // If user had liked, remove the like
        if (hasLiked) {
          updateOperation.$pull = { likedBy: userId };
          updateOperation.$inc.likes = -1;
        }
      }
    }

    // Apply the update
    const updatedDoc = await Model.findByIdAndUpdate(
      documentId,
      updateOperation,
      { new: true }
    );

    if (!updatedDoc) {
      return {
        success: false,
        message: 'Failed to update document'
      };
    }

    // Determine current user vote state
    let userVote: 'like' | 'dislike' | null = null;
    if (updatedDoc.likedBy.includes(userId)) {
      userVote = 'like';
    } else if (updatedDoc.dislikedBy.includes(userId)) {
      userVote = 'dislike';
    }

    return {
      success: true,
      message: 'Vote processed successfully',
      likes: updatedDoc.likes,
      dislikes: updatedDoc.dislikes,
      userVote
    };

  } catch (error) {
    console.error('Error processing vote:', error);
    return {
      success: false,
      message: 'Internal error processing vote'
    };
  }
}

/**
 * Get user's current vote on a document
 */
export async function getUserVote(
  Model: mongoose.Model<any>,
  documentId: string,
  userId: string
): Promise<'like' | 'dislike' | null> {
  try {
    const document = await Model.findById(documentId);
    if (!document) return null;

    if (document.likedBy && document.likedBy.includes(userId)) {
      return 'like';
    }
    if (document.dislikedBy && document.dislikedBy.includes(userId)) {
      return 'dislike';
    }
    return null;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
}

/**
 * Get vote counts for a document
 */
export async function getVoteCounts(
  Model: mongoose.Model<any>,
  documentId: string
): Promise<{ likes: number; dislikes: number } | null> {
  try {
    const document = await Model.findById(documentId);
    if (!document) return null;

    return {
      likes: document.likes || 0,
      dislikes: document.dislikes || 0
    };
  } catch (error) {
    console.error('Error getting vote counts:', error);
    return null;
  }
}

