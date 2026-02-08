import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { LikeButtonGroup } from '@/components/UI/LikeButton';
import { QuoteBlock } from '@/components/UI/QuoteBlock';
import { VideoEmbed, isVideoUrl } from '@/components/UI/VideoEmbed';
import { MediaGallery } from './MediaAttachment';
import { AuthorSidebar } from './AuthorSidebar';
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
  reply_to_post_id?: string | null;
  reply_to_excerpt?: { author_name: string; excerpt: string } | null;
}

interface PostItemProps {
  post: Post;
  index: number;
  originalIndex: number; // Original index for post numbering (not affected by sorting)
  userVote: 'like' | 'dislike' | null;
  onLike: (likeType: 'like' | 'dislike') => void;
  onDelete: () => void;
  onEdit?: () => void;
  onFlag?: () => void;
  onQuote?: () => void;
  onScrollToPost?: (postId: string) => void;
  formatDate: (dateString: string) => string;
  currentUser: any;
  canDelete: boolean;
  canEdit?: boolean;
  remainingEditTime?: string;
  isCurrentUserTopicAuthor?: boolean; // Is the current logged-in user the topic author (for flagging)
  topicAuthorId: string; // Topic author's user ID to show "Автор темы" badge
  onImageClick?: (src: string) => void;
}

export const PostItem: React.FC<PostItemProps> = ({
  post,
  index,
  originalIndex,
  userVote,
  onLike,
  onDelete,
  onEdit,
  onFlag,
  onQuote,
  onScrollToPost,
  formatDate,
  currentUser,
  canDelete,
  canEdit = true,
  remainingEditTime = '',
  isCurrentUserTopicAuthor = false,
  topicAuthorId,
  onImageClick
}) => {
  const isPostAuthor = currentUser && String(post.user_id) === String(currentUser.id);

  // Check if this post's author is the topic author (for "Автор темы" badge)
  const isPostByTopicAuthor = String(post.user_id) === String(topicAuthorId);

  // Post number starts at 2 since topic content is #1, use originalIndex for consistent numbering
  const postNumber = originalIndex + 2;

  return (
    <div data-post-id={post.id} className="border border-gray-300 bg-white flex flex-col sm:flex-row">
      {/* Author Sidebar (Left Column on desktop, Header on mobile) */}
      <AuthorSidebar
        userId={post.user_id}
        userName={post.user_name}
        userPhoto={post.user_photo}
        isTopicAuthor={isPostByTopicAuthor}
        postNumber={postNumber}
        createdAt={post.created_at}
        formatDate={formatDate}
      />

      {/* Content Area (Right Column) */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Action bar - desktop only shows post info, mobile only shows actions */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-gray-200 bg-gray-50">
          {/* Post info - hidden on mobile since it's in the mobile header */}
          <div className="hidden sm:block text-xs text-gray-500">
            #{postNumber} · {formatDate(post.created_at)}
          </div>

          {/* Spacer for mobile */}
          <div className="sm:hidden" />

          <div className="flex items-center gap-1">
            {/* Edit and Delete buttons if post author or admin */}
            {currentUser && (isPostAuthor || currentUser.isAdmin) && (
              <>
                {onEdit && (
                  <button
                    onClick={onEdit}
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
                  onClick={onDelete}
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
              </>
            )}

            {/* Topic author can flag inappropriate comments */}
            {currentUser && isCurrentUserTopicAuthor && !isPostAuthor && onFlag && (
              <button
                onClick={onFlag}
                className="px-2 py-1 text-xs text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                title="Пожаловаться"
              >
                Жалоба
              </button>
            )}

            {/* Quote/Reply button */}
            {currentUser && onQuote && (
              <button
                onClick={onQuote}
                className="px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Ответить с цитатой"
                aria-label={`Ответить на сообщение ${post.user_name}`}
              >
                Ответить
              </button>
            )}
          </div>
        </div>

        {/* Post content */}
        <div className="p-4 flex-1">
          {/* Quoted post block */}
          {post.reply_to_excerpt && (
            <QuoteBlock
              authorName={post.reply_to_excerpt.author_name}
              excerpt={post.reply_to_excerpt.excerpt}
              sourceId={post.reply_to_post_id}
              onClickSource={onScrollToPost}
            />
          )}
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
              {groupConsecutiveImages(post.content)}
            </ReactMarkdown>
          </div>

          {/* Display media links if any */}
          {post.media_links && post.media_links.length > 0 && (
            <MediaGallery links={post.media_links} onImageClick={onImageClick} />
          )}
        </div>

        {/* Post footer with likes */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
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
  );
};
