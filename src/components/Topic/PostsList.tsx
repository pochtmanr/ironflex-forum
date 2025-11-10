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
  isTopicAuthor: boolean;
  canEditPost: (createdAt: string) => boolean;
  getRemainingEditTime: (createdAt: string) => string;
  onImageClick?: (src: string) => void;
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
  isTopicAuthor,
  canEditPost,
  getRemainingEditTime,
  onImageClick
}) => {
  const sortedPosts = useMemo(() => {
    const sorted = [...posts];
    if (sortOrder === 'popular') {
      sorted.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
    }
    // 'recent' is default order from server
    return sorted;
  }, [posts, sortOrder]);

  return (
    <div className="space-y-4 mb-4 sm:mb-6">
      {sortedPosts.map((post, index) => {
        const isPostAuthor = currentUser && String(post.user_id) === String(currentUser.id);
        return (
        <PostItem
          key={post.id}
          post={post}
          index={index}
          userVote={postVotes[post.id.toString()] || null}
          onLike={(type) => onLikePost(post.id.toString(), type)}
          onDelete={() => onDeletePost(post.id.toString())}
            onEdit={() => onEditPost(post.id.toString())}
            onFlag={() => onFlagPost(post.id.toString())}
          formatDate={formatDate}
          currentUser={currentUser}
            canDelete={isPostAuthor}
            canEdit={canEditPost(post.created_at)}
            remainingEditTime={getRemainingEditTime(post.created_at)}
            isTopicAuthor={isTopicAuthor}
          onImageClick={onImageClick}
        />
        );
      })}
    </div>
  );
};



