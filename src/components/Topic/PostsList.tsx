import React, { useMemo } from 'react';
import { PostItem } from './PostItem';

interface Post {
  id: number | string;
  content: string;
  user_name: string;
  user_email: string;
  user_id: string;
  user_photo?: string;
  created_at: string;
  likes: number;
  dislikes: number;
  media_links: string[];
  is_author: boolean;
  reply_to_post_id?: string | null;
  reply_to_excerpt?: { author_name: string; excerpt: string } | null;
}

interface PostsListProps {
  posts: Post[];
  sortOrder: string;
  postVotes: Record<string, 'like' | 'dislike' | null>;
  onLikePost: (postId: string, likeType: 'like' | 'dislike') => void;
  onDeletePost: (postId: string) => void;
  onEditPost: (postId: string) => void;
  onFlagPost: (postId: string) => void;
  formatDate: (dateString: string) => string;
  currentUser: any;
  isCurrentUserTopicAuthor: boolean; // Is the current logged-in user the topic author
  topicAuthorId: string; // Topic author's user ID for "Автор темы" badge
  canEditPost: (createdAt: string) => boolean;
  getRemainingEditTime: (createdAt: string) => string;
  onImageClick?: (src: string) => void;
  onQuotePost?: (post: Post) => void;
  onScrollToPost?: (postId: string) => void;
}

export const PostsList: React.FC<PostsListProps> = ({
  posts,
  sortOrder,
  postVotes,
  onLikePost,
  onDeletePost,
  onEditPost,
  onFlagPost,
  formatDate,
  currentUser,
  isCurrentUserTopicAuthor,
  topicAuthorId,
  canEditPost,
  getRemainingEditTime,
  onImageClick,
  onQuotePost,
  onScrollToPost
}) => {
  // Add original index to each post before sorting
  const sortedPosts = useMemo(() => {
    const postsWithIndex = posts.map((post, index) => ({ ...post, originalIndex: index }));

    switch (sortOrder) {
      case 'newest':
        // Sort by date descending (newest first)
        postsWithIndex.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'popular':
        // Sort by popularity (likes - dislikes) descending
        postsWithIndex.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
        break;
      case 'oldest':
      default:
        // Default: chronological order (oldest first) - server order
        break;
    }

    return postsWithIndex;
  }, [posts, sortOrder]);

  return (
    <div className="space-y-2 mb-4 sm:mb-6">
      {sortedPosts.map((post, index) => {
        const isPostAuthor = currentUser && String(post.user_id) === String(currentUser.id);
        return (
          <PostItem
            key={post.id}
            post={post}
            index={index}
            originalIndex={post.originalIndex}
            userVote={postVotes[post.id.toString()] || null}
            onLike={(type) => onLikePost(post.id.toString(), type)}
            onDelete={() => onDeletePost(post.id.toString())}
            onEdit={() => onEditPost(post.id.toString())}
            onFlag={() => onFlagPost(post.id.toString())}
            onQuote={onQuotePost ? () => onQuotePost(post) : undefined}
            onScrollToPost={onScrollToPost}
            formatDate={formatDate}
            currentUser={currentUser}
            canDelete={isPostAuthor}
            canEdit={canEditPost(post.created_at)}
            remainingEditTime={getRemainingEditTime(post.created_at)}
            isCurrentUserTopicAuthor={isCurrentUserTopicAuthor}
            topicAuthorId={topicAuthorId}
            onImageClick={onImageClick}
          />
        );
      })}
    </div>
  );
};



