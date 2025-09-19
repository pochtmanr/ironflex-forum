import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MediaRenderer from './MediaRenderer';
import FormattedText from './FormattedText';
import SimpleReplyForm from './SimpleReplyForm';
import RichHtml from './RichHtml';

interface Topic {
  id: number;
  title: string;
  content: string;
  media_links: string;
  user_name: string;
  user_email: string;
  user_id: string;
  category_name: string;
  category_slug: string;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
  is_locked: boolean;
}

interface Post {
  id: number;
  content: string;
  media_links: string;
  user_name: string;
  user_email: string;
  user_id: string;
  likes: number;
  dislikes: number;
  created_at: string;
  is_edited: boolean;
  edited_at: string | null;
  parent_post_id: number | null;
  reply_count: number;
  replies?: Post[];
}

const TopicView: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const { currentUser } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [replyingToPost, setReplyingToPost] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [replySortBy, setReplySortBy] = useState<'newest' | 'popular'>('newest');
  const [mainReplySortBy, setMainReplySortBy] = useState<'newest' | 'popular'>('newest');
  const [showMainReplyForm, setShowMainReplyForm] = useState(false);

  useEffect(() => {
    loadTopicData();
  }, [topicId, page]);

  const loadTopicData = async () => {
    if (!topicId) return;

    try {
      const response = await fetch(`https://blog.theholylabs.com/api/forum/topics/${topicId}?page=${page}`);
      if (response.ok) {
        const data = await response.json();
        setTopic(data.topic);
        setPosts(data.posts);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Error loading topic');
      }
    } catch (error) {
      console.error('Error loading topic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (targetType: 'topic' | 'post', targetId: number, likeType: 'like' | 'dislike') => {
    if (!currentUser) return;

    try {
      const response = await fetch('https://blog.theholylabs.com/api/forum/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          likeType,
          userId: currentUser.uid
        })
      });

      if (response.ok) {
        // Reload data to get updated like counts
        loadTopicData();
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleReply = async (content: string, uploadedImages: string[], parentPostId: number | null = null) => {
    if (!currentUser || !content.trim()) return;

    setSubmitting(true);

    try {
      const mediaLinks = uploadedImages.join('\n').trim();
      
      const response = await fetch(`https://blog.theholylabs.com/api/forum/topics/${topicId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          mediaLinks,
          parentPostId,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email?.split('@')[0]
        })
      });

      if (response.ok) {
        setReplyingToPost(null);
        setShowMainReplyForm(false);
        loadTopicData(); // Reload to show new post
      } else {
        const errorData = await response.json();
        console.error('Error creating reply:', errorData.error);
      }
    } catch (error) {
      console.error('Error creating reply:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRepliesExpanded = (postId: number) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const getSortedReplies = (replies: Post[], limit: number = 3) => {
    if (!replies || replies.length === 0) return [];
    
    const sorted = [...replies].sort((a, b) => {
      if (replySortBy === 'popular') {
        const aScore = a.likes - a.dislikes;
        const bScore = b.likes - b.dislikes;
        return bScore - aScore; // Higher score first
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Newest first
      }
    });
    
    return sorted.slice(0, limit);
  };

  const getSortedMainPosts = (posts: Post[]) => {
    if (!posts || posts.length === 0) return [];
    
    return [...posts].sort((a, b) => {
      if (mainReplySortBy === 'popular') {
        const aScore = a.likes - a.dislikes;
        const bScore = b.likes - b.dislikes;
        return bScore - aScore; // Higher score first
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); // Newest first
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const shareToVK = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(topic?.title || '');
    const shareUrl = `https://vk.com/share.php?url=${url}&title=${title}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${topic?.title || ''} - Обсуждение на форуме`);
    const shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="max-w-9xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Загрузка темы...</div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-9xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Тема не найдена</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-9xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Mobile-Optimized Breadcrumb */}
      <nav className="mb-4 sm:mb-6">
        <ol className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm overflow-x-auto pb-2">
          <li className="flex-shrink-0">
            <Link to="/" className="text-blue-600 hover:text-blue-700">Форум</Link>
          </li>
          <li className="text-gray-500 flex-shrink-0">/</li>
          <li className="flex-shrink-0">
            <Link to={`/category/${topic.id}`} className="text-blue-600 hover:text-blue-700 max-w-[100px] sm:max-w-none truncate block">
              {topic.category_name}
            </Link>
          </li>
          <li className="text-gray-500 flex-shrink-0">/</li>
          <li className="text-gray-700 truncate min-w-0">{topic.title}</li>
        </ol>
      </nav>

      {/* Mobile-Optimized Topic Header */}
      <div className="bg-white shadow-md mb-4 sm:mb-6">
        <div className="bg-gray-600 text-white px-3 sm:px-6 py-3 sm:py-4 ">
          <h1 className="text-lg sm:text-2xl font-bold leading-tight">{topic.title}</h1>
          <div className="flex items-center justify-between mt-2 text-xs sm:text-sm text-gray-200 flex-wrap gap-2">
            <span>Просмотров: {topic.views}</span>
            {topic.is_locked && (
              <span className="bg-red-600 px-2 py-1  text-xs flex-shrink-0">Заблокировано</span>
            )}
          </div>
        </div>

        {/* Mobile-Optimized Original Post */}
        <div className="p-3 sm:p-6">
          <div className="flex items-start space-x-2 sm:space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 text-white  flex items-center justify-center font-bold shadow-md text-sm sm:text-base">
                {getUserInitials(topic.user_name)}
              </div>
              <div className="w-10 sm:w-12 text-center mt-1 sm:mt-2">
                
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="truncate">{topic.user_name}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
                        Автор темы
                      </span>
                    </div>
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{formatDate(topic.created_at)}</p>
                </div>
                {/* Mobile Like/Dislike Buttons */}
                {currentUser && (
                  <div className="flex items-center space-x-3 sm:space-x-4 self-start sm:self-center">
                    <button
                      onClick={() => handleLike('topic', topic.id, 'like')}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700 transition-colors touch-manipulation"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      <span className="font-medium text-sm">{topic.likes}</span>
                    </button>
                    <button
                      onClick={() => handleLike('topic', topic.id, 'dislike')}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors touch-manipulation"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20" transform="rotate(180)">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      <span className="font-medium text-sm">{topic.dislikes}</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
                {(topic.content && topic.content.includes('<')) ? (
                  <RichHtml html={topic.content} className="text-sm sm:text-base" />
                ) : (
                  <FormattedText 
                    content={topic.content} 
                    className="text-sm sm:text-base"
                  />
                )}
                <MediaRenderer mediaLinks={topic.media_links} size="large" />
              </div>
            </div>
          </div>
          
          {/* Social Sharing */}
          <div className="bg-gray-50 px-4 sm:px-6 py-3">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">Поделиться:</span>
              <button
                onClick={shareToVK}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-.907-1.49.402v1.608c0 .435-.138.69-1.276.69-1.966 0-4.142-1.189-5.676-3.402-2.301-3.27-2.94-5.739-2.94-6.246 0-.435.174-.628.46-.628h1.744c.345 0 .475.154.608.513.675 1.846 1.818 3.461 2.285 2.154.375-1.054.29-3.398-.174-3.841-.347-.33-.99-.513-1.273-.543.264-.417.68-.665 1.24-.665h2.79c.435 0 .592.23.592.612v3.468c0 .435.196.612.32.612.264 0 .478-.177.964-.665 1.477-1.478 2.521-3.764 2.521-3.764.152-.33.39-.513.742-.513h1.744c.522 0 .644.268.522.612 0 0-1.257 3.044-2.647 4.624-.264.302-.367.458 0 .797 1.307 1.206 2.647 2.363 2.647 3.137 0 .422-.345.628-.628.628z"/>
                </svg>
                <span>ВКонтакте</span>
              </button>
              <button
                onClick={shareToTwitter}
                className="flex items-center space-x-1 text-blue-400 hover:text-blue-500 transition-colors text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span>Twitter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reply Button and Form - Right after main topic */}
      {currentUser && !topic.is_locked && (
        <div className="mb-4 sm:mb-6">
          {!showMainReplyForm ? (
            <button
              onClick={() => setShowMainReplyForm(true)}
              className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors py-3 border-2 border-dashed border-blue-300 hover:border-blue-400 rounded-lg bg-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="font-medium">Написать комментарий к теме</span>
            </button>
          ) : (
            <div className="bg-white shadow-md p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Написать комментарий к теме
              </h3>
              <SimpleReplyForm
                onSubmit={(content, images) => handleReply(content, images)}
                onCancel={() => setShowMainReplyForm(false)}
                placeholder="Напишите ваш комментарий..."
                submitLabel="Отправить комментарий"
                
                isSubmitting={submitting}
                size="large"
                showFormatting={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Forum-Style Replies Section */}
      {posts.length > 0 && (
        <div className="space-y-4 mb-4 sm:mb-6">
          <div className="bg-white shadow-md">
            <div className="bg-gray-100 px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                  </svg>
                  Ответы ({posts.length})
                </h3>
                
                {posts.length > 1 && (
                  <select
                    value={mainReplySortBy}
                    onChange={(e) => setMainReplySortBy(e.target.value as 'newest' | 'popular')}
                    className="text-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="newest">Новые</option>
                    <option value="popular">Популярные</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {getSortedMainPosts(posts).map((post, index) => (
            <div key={post.id}>
              {/* Main Post */}
              <div className="bg-white shadow-md hover:shadow-lg transition-shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start space-x-4">
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-400 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {getUserInitials(post.user_name)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* User Info Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {post.user_name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <span>{formatDate(post.created_at)}</span>
                            {post.is_edited && post.edited_at && (
                              <>
                                <span>•</span>
                                <span className="italic">изменено {formatDate(post.edited_at)}</span>
                              </>
                            )}
                            <span className="ml-auto bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Post Content */}
                      <div className="mb-4">
                        {(post.content && post.content.includes('<')) ? (
                          <RichHtml html={post.content} className="text-sm sm:text-base leading-relaxed" />
                        ) : (
                          <FormattedText 
                            content={post.content} 
                            className="text-sm sm:text-base leading-relaxed"
                          />
                        )}
                        <MediaRenderer mediaLinks={post.media_links} size="medium" />
                      </div>
                      
                      {/* Action Bar */}
                      {currentUser && (
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <div className="flex items-center space-x-4 text-sm">
                            <button
                              onClick={() => handleLike('post', post.id, 'like')}
                              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors touch-manipulation"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                              <span className="font-medium">{post.likes}</span>
                            </button>
                            <button
                              onClick={() => handleLike('post', post.id, 'dislike')}
                              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors touch-manipulation"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" transform="rotate(180)">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                              <span className="font-medium">{post.dislikes}</span>
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => setReplyingToPost(replyingToPost === post.id ? null : post.id)}
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            <span>Написать комментарий</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Reply Form */}
                  {replyingToPost === post.id && currentUser && (
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <SimpleReplyForm
                        onSubmit={(content, images) => handleReply(content, images, post.id)}
                        onCancel={() => setReplyingToPost(null)}
                        placeholder={`Ответить ${post.user_name}...`}
                        isSubmitting={submitting}
                        autoFocus={true}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Collapsible Replies Section */}
              {post.replies && post.replies.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {/* Replies Header with Toggle and Sort */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => toggleRepliesExpanded(post.id)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${expandedReplies.has(post.id) ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span>
                        {expandedReplies.has(post.id) ? 'Скрыть' : 'Показать'} комментарии ({post.replies.length})
                      </span>
                    </button>
                    
                    {expandedReplies.has(post.id) && post.replies.length > 1 && (
                      <select
                        value={replySortBy}
                        onChange={(e) => setReplySortBy(e.target.value as 'newest' | 'popular')}
                        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="newest">Новые</option>
                        <option value="popular">Популярные</option>
                      </select>
                    )}
                  </div>

                  {/* Expanded Replies */}
                  {expandedReplies.has(post.id) && (
                    <div className="ml-4 sm:ml-6 space-y-3">
                      {getSortedReplies(post.replies, expandedReplies.has(post.id) ? post.replies.length : 3).map((reply) => (
                        <div key={reply.id} className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                          <div className="p-3 sm:p-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {getUserInitials(reply.user_name)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                                  <span className="font-medium text-gray-900">{reply.user_name}</span>
                                  <span>•</span>
                                  <span>{formatDate(reply.created_at)}</span>
                                  {reply.is_edited && reply.edited_at && (
                                    <>
                                      <span>•</span>
                                      <span className="italic">изменено</span>
                                    </>
                                  )}
                                </div>
                                
                                <div className="mb-3">
                                  {(reply.content && reply.content.includes('<')) ? (
                                    <RichHtml html={reply.content} className="text-sm leading-relaxed" />
                                  ) : (
                                    <FormattedText 
                                      content={reply.content} 
                                      className="text-sm leading-relaxed"
                                    />
                                  )}
                                  <MediaRenderer mediaLinks={reply.media_links} size="small" />
                                </div>
                                
                                {currentUser && (
                                  <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                                    <div className="flex items-center space-x-3 text-xs">
                                      <button
                                        onClick={() => handleLike('post', reply.id, 'like')}
                                        className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                        <span>{reply.likes}</span>
                                      </button>
                                      <button
                                        onClick={() => handleLike('post', reply.id, 'dislike')}
                                        className="flex items-center space-x-1 text-gray-500 hover:text-red-600 transition-colors"
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" transform="rotate(180)">
                                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                        <span>{reply.dislikes}</span>
                                      </button>
                                    </div>
                                    
                                    <button
                                      onClick={() => setReplyingToPost(replyingToPost === reply.id ? null : reply.id)}
                                      className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                      Ответить
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mobile-Optimized Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-500">
              Страница {page} из {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                Назад
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                Вперед
              </button>
            </div>
          </div>
        </div>
      )}


      {!currentUser && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center">
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Войдите в аккаунт, чтобы оставить ответ</p>
          <Link
            to="/login"
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 touch-manipulation"
          >
            Войти
          </Link>
        </div>
      )}
    </div>
  );
};

export default TopicView;
