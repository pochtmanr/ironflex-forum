import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LikeButtonGroup } from '@/components/UI/LikeButton';
import { DeleteButton } from '@/components/UI';
import { MediaAttachment } from './MediaAttachment';

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
  formatDate: (dateString: string) => string;
  currentUser: any;
  canDelete: boolean;
  onImageClick?: (src: string) => void;
}

export const PostItem: React.FC<PostItemProps> = ({
  post,
  index,
  userVote,
  onLike,
  onDelete,
  formatDate,
  currentUser,
  canDelete,
  onImageClick
}) => {
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
          
          {/* Delete button if authorized */}
          {currentUser && canDelete && (
            <DeleteButton
              onClick={onDelete}
              title={post.is_author ? "Удалить комментарий" : "Удалить комментарий (вы автор темы)"}
            />
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
              components={{
                img: ({node, ...props}) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.src as string}
                    alt={props.alt || ''}
                    className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ objectFit: 'contain', maxHeight: '400px' }}
                    onClick={() => onImageClick?.(props.src as string)}
                  />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
          
          {/* Display media links if any */}
          {post.media_links && post.media_links.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Прикрепленные файлы:</h4>
              <div className="space-y-3">
                {post.media_links.map((link, linkIndex) => (
                  <MediaAttachment key={linkIndex} link={link} index={linkIndex} onImageClick={onImageClick} />
                ))}
              </div>
            </div>
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



