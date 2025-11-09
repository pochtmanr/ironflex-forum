import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LikeButtonGroup } from '@/components/UI/LikeButton';
import { DeleteButton } from '@/components/UI';
import { MediaAttachment } from './MediaAttachment';

interface Topic {
  id: number | string;
  title: string;
  content: string;
  user_name: string;
  user_email: string;
  user_id: string;
  user_photo?: string;
  category_id: string;
  category_name: string;
  reply_count: number;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
  last_post_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  media_links: string[];
  is_author: boolean;
}

interface TopicHeaderProps {
  topic: Topic;
  postsCount: number;
  topicVote: 'like' | 'dislike' | null;
  onLikeTopic: (likeType: 'like' | 'dislike') => void;
  onDeleteTopic: () => void;
  onEditTopic?: () => void;
  formatDate: (dateString: string) => string;
  currentUser: any;
  onImageClick?: (src: string) => void;
}

export const TopicHeader: React.FC<TopicHeaderProps> = ({
  topic,
  postsCount,
  topicVote,
  onLikeTopic,
  onDeleteTopic,
  onEditTopic,
  formatDate,
  currentUser,
  onImageClick
}) => {
  return (
    <div className="bg-white border-2 border-gray-200/50 mb-4 rounded-sm">
      {/* Header with user info */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {/* User Photo */}
          <Link href={`/profile/${topic.user_id}`} className="flex-shrink-0">
            {topic.user_photo ? (
              <Image
                src={topic.user_photo}
                alt={topic.user_name || 'User'}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-400 flex items-center justify-center text-lg font-bold text-white hover:opacity-80 transition-opacity">
                {(topic.user_name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          
          {/* User info and metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href={`/profile/${topic.user_id}`}
                className="text-blue-500 hover:text-blue-700 font-semibold text-base"
              >
                {topic.user_name || 'Unknown'}
              </Link>
              {topic.is_author && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                  Автор
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{formatDate(topic.created_at)}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{postsCount}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{topic.views}</span>
              </div>
            </div>
          </div>
          
          {/* Edit and Delete buttons if author */}
          {topic.is_author && (
            <div className="flex items-center gap-2">
              {onEditTopic && (
                <button
                  onClick={onEditTopic}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Редактировать тему"
                  aria-label="Редактировать тему"
                >
                  <svg
                    className="w-5 h-5"
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
              <DeleteButton
                onClick={onDeleteTopic}
                title="Удалить тему"
              />
            </div>
          )}
        </div>
      </div>

      {/* Topic Content */}
      <div className="p-4">
        <div className="flex-1 min-w-0">
          {/* Topic Content */}
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
              {topic.content}
            </ReactMarkdown>
          </div>
          
          {/* Display topic media links if any */}
          {topic.media_links && topic.media_links.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Прикрепленные файлы:</h4>
              <div className="space-y-3">
                {topic.media_links.map((link, linkIndex) => (
                  <MediaAttachment key={linkIndex} link={link} index={linkIndex} onImageClick={onImageClick} />
                ))}
              </div>
            </div>
          )}
          
          {/* Topic Actions */}
          <div className="mt-10 pt-2 border-t border-gray-200">
            <LikeButtonGroup
              likes={topic.likes}
              dislikes={topic.dislikes}
              userVote={topicVote}
              onLike={onLikeTopic}
              disabled={!currentUser}
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

