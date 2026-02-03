import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { LikeButtonGroup } from '@/components/UI/LikeButton';
import { DeleteButton } from '@/components/UI';
import { VideoEmbed, isVideoUrl } from '@/components/UI/VideoEmbed';
import { MediaGallery } from './MediaAttachment';
import { groupConsecutiveImages } from '@/lib/markdownUtils';

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

interface PostItemProps {
  post: Post;
  index: number;
  userVote: 'like' | 'dislike' | null;
  onLike: (likeType: 'like' | 'dislike') => void;
  onDelete: () => void;
  onEdit?: () => void;
  onFlag?: () => void;
  formatDate: (dateString: string) => string;
  currentUser: any;
  canDelete: boolean;
  canEdit?: boolean;
  remainingEditTime?: string;
  isTopicAuthor?: boolean;
  onImageClick?: (src: string) => void;
}

export const PostItem: React.FC<PostItemProps> = ({
  post,
  index,
  userVote,
  onLike,
  onDelete,
  onEdit,
  onFlag,
  formatDate,
  currentUser,
  canDelete,
  canEdit = true,
  remainingEditTime = '',
  isTopicAuthor = false,
  onImageClick
}) => {
  // Check if current user is the post author
  const isPostAuthor = currentUser && String(post.user_id) === String(currentUser.id);
  return (
    <div className="bg-white ml-2 border-2 border-gray-200/50 mb-4 rounded-sm">
      {/* Post Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* User Photo */}
          <Link href={`/profile/${post.user_id}`} className="flex-shrink-0">
            {post.user_photo ? (
              <Image
                src={post.user_photo}
                alt={post.user_name || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-base font-bold text-white hover:opacity-80 transition-opacity">
                {(post.user_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          
          {/* User info and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/profile/${post.user_id}`}
                className="font-semibold text-blue-500 hover:text-blue-700 text-sm"
              >
                {post.user_name || 'Unknown'}
              </Link>
              {post.is_author && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                  Автор
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>#{index + 1}</span>
              <span>•</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
          
          {/* Edit and Delete buttons if authorized */}
          {currentUser && isPostAuthor && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  disabled={!canEdit}
                  className={`p-2 rounded-md transition-colors ${
                    canEdit 
                      ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                  title={canEdit ? "Редактировать комментарий" : "Время редактирования истекло"}
                  aria-label="Редактировать комментарий"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
              <button
                onClick={onDelete}
                disabled={!canEdit}
                className={`p-2 rounded-md transition-colors ${
                  canEdit 
                    ? 'text-gray-600 hover:text-red-600 hover:bg-red-50' 
                    : 'text-gray-400 cursor-not-allowed opacity-50'
                }`}
                title={canEdit ? "Удалить комментарий" : "Время удаления истекло"}
                aria-label="Удалить комментарий"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
          {/* Topic author can flag inappropriate comments */}
          {currentUser && isTopicAuthor && !isPostAuthor && onFlag && (
            <button
              onClick={onFlag}
              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
              title="Пожаловаться на комментарий"
              aria-label="Пожаловаться на комментарий"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="gray"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 2zm9-13.5V9"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      
      {/* Post Content */}
      <div className="p-4">
        <div className="flex-1 min-w-0">
          {/* Post Content */}
          <div className="prose max-w-none text-gray-900 text-base">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                p: ({node, children, ...props}) => {
                  const hasBlockChild = Array.isArray(children)
                    ? children.some(child => typeof child === 'object' && child !== null && 'type' in child && (child as React.ReactElement).type === 'div')
                    : typeof children === 'object' && children !== null && 'type' in children && (children as React.ReactElement).type === 'div';
                  if (hasBlockChild) {
                    return <div {...props}>{children}</div>;
                  }
                  return <p {...props}>{children}</p>;
                },
                a: ({node, href, children, ...props}) => {
                  if (href && isVideoUrl(href)) {
                    return <VideoEmbed url={href} />;
                  }
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline" {...props}>
                      {children}
                    </a>
                  );
                },
                img: ({node, ...props}) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.src as string}
                    alt={props.alt || ''}
                    className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onImageClick?.(props.src as string)}
                  />
                ),
              }}
            >
              {groupConsecutiveImages(post.content)}
            </ReactMarkdown>
          </div>
          
          {/* Display media links if any */}
          {post.media_links && post.media_links.length > 0 && (
            <MediaGallery links={post.media_links} onImageClick={onImageClick} />
          )}
          
          {/* Post Actions */}
          <div className="mt-10 pt-2 border-t border-gray-200/50">
            <LikeButtonGroup
              likes={post.likes}
              dislikes={post.dislikes}
              userVote={userVote}
              onLike={onLike}
              disabled={!currentUser}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};



