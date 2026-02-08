import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { LikeButtonGroup } from '@/components/UI/LikeButton';
import { VideoEmbed, isVideoUrl } from '@/components/UI/VideoEmbed';
import { MediaGallery } from './MediaAttachment';
import { AuthorSidebar } from './AuthorSidebar';
import { TopicRating } from './TopicRating';
import { groupConsecutiveImages } from '@/lib/markdownUtils';

interface Topic {
  id: number | string;
  title: string;
  content: string | null;
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
  canEdit?: boolean;
  remainingEditTime?: string;
  // Rating props
  averageRating: number;
  ratingCount: number;
  userRating: number | null;
  onRateTopic: (rating: number) => void;
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
  onImageClick,
  canEdit = true,
  remainingEditTime = '',
  averageRating,
  ratingCount,
  userRating,
  onRateTopic
}) => {
  return (
    <div className="mb-4">
      {/* Topic Title Bar */}
      <div className="bg-gray-100 border border-gray-300">
        {/* Title row */}
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            {/* Status indicators */}
            {(topic.is_pinned || topic.is_locked) && (
              <div className="flex flex-col gap-1 pt-1">
                {topic.is_pinned && (
                  <span className="text-xs text-orange-700 font-medium">Закреплено</span>
                )}
                {topic.is_locked && (
                  <span className="text-xs text-red-700 font-medium">Закрыто</span>
                )}
              </div>
            )}

            {/* Title and stats */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                {topic.title}
              </h1>
              {/* Topic Rating - under title */}
              <div className="mb-2">
                <TopicRating
                  currentRating={averageRating}
                  totalVotes={ratingCount}
                  userRating={userRating}
                  onRate={onRateTopic}
                  disabled={!currentUser}
                />
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-600 flex-wrap">
                <span>Просмотров: <strong>{topic.views}</strong></span>
                <span className="hidden sm:inline">·</span>
                <span>Ответов: <strong>{topic.reply_count}</strong></span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">Сообщений: <strong>{postsCount + 1}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* First Post - Two Column Layout (only if topic has content) */}
      {topic.content ? (
        <div className="border border-t-0 border-gray-300 bg-white flex flex-col sm:flex-row">
          {/* Author Sidebar (Left Column) */}
          <AuthorSidebar
            userId={topic.user_id}
            userName={topic.user_name}
            userPhoto={topic.user_photo}
            isTopicAuthor={true}
            createdAt={topic.created_at}
            formatDate={formatDate}
          />

          {/* Content Area (Right Column) */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Action bar - desktop shows post info, mobile only shows actions */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50">
              {/* Post info - hidden on mobile since it's in the mobile header */}
              <div className="hidden sm:block text-xs text-gray-500">
                #{1} · {formatDate(topic.created_at)}
              </div>

              {/* Spacer for mobile */}
              <div className="sm:hidden" />

              {/* Edit and Delete buttons if author */}
              {(topic.is_author || currentUser?.isAdmin) && (
                <div className="flex items-center gap-1">
                  {onEditTopic && (
                    <button
                      onClick={onEditTopic}
                      disabled={!canEdit}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        canEdit
                          ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={canEdit ? "Редактировать" : "Время редактирования истекло"}
                    >
                      Изменить
                    </button>
                  )}
                  <button
                    onClick={onDeleteTopic}
                    disabled={!canEdit}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      canEdit
                        ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                    title={canEdit ? "Удалить" : "Время удаления истекло"}
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>

            {/* Post content */}
            <div className="p-4 flex-1">
              {/* Topic Content (First Post) */}
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
                        className="max-w-md max-h-96 w-auto h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => onImageClick?.(props.src as string)}
                      />
                    ),
                  }}
                >
                  {groupConsecutiveImages(topic.content)}
                </ReactMarkdown>
              </div>

              {/* Display topic media links if any */}
              {topic.media_links && topic.media_links.length > 0 && (
                <MediaGallery links={topic.media_links} onImageClick={onImageClick} />
              )}
            </div>

            {/* Post footer with likes */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
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
      ) : (
        /* Empty topic — no first post content, show minimal action bar */
        <div className="border border-t-0 border-gray-300 bg-white">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-50">
            <div className="text-xs text-gray-500">
              {formatDate(topic.created_at)}
            </div>
            <div className="flex items-center gap-2">
              {(topic.is_author || currentUser?.isAdmin) && onEditTopic && (
                <button
                  onClick={onEditTopic}
                  disabled={!canEdit}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    canEdit
                      ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Изменить
                </button>
              )}
              {(topic.is_author || currentUser?.isAdmin) && (
                <button
                  onClick={onDeleteTopic}
                  disabled={!canEdit}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    canEdit
                      ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Удалить
                </button>
              )}
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
      )}
    </div>
  );
};
