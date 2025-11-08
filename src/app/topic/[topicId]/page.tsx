'use client'

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { forumAPI } from '@/services/api';
import { LoginPrompt } from '@/components/UI/LoginPrompt';
import { PaginationButton } from '@/components/UI';
import { TopicHeader, PostsList, ReplyForm } from '@/components/Topic';
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

const TopicViewPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const topicId = params?.topicId as string;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [sortOrder, setSortOrder] = useState('recent');
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  // Vote tracking
  const [topicVote, setTopicVote] = useState<'like' | 'dislike' | null>(null);
  const [postVotes, setPostVotes] = useState<Record<string, 'like' | 'dislike' | null>>({});

  useEffect(() => {
    if (topicId) {
      loadTopicData();
    }
  }, [topicId, page]);

  // Reload topic data when user changes (login/logout)
  useEffect(() => {
    if (topicId && topic) {
      const topicData = {
        ...topic,
        is_author: currentUser && topic.user_id === currentUser.id ? true : false
      };
      setTopic(topicData);
    }
  }, [currentUser]);

  const loadTopicData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await forumAPI.getTopic(topicId, page) as { 
        topic: Topic & { user_vote?: 'like' | 'dislike' | null }; 
        posts: (Post & { user_vote?: 'like' | 'dislike' | null })[]; 
        pagination: { pages: number } 
      };
      console.log('Topic data received:', response.topic);
      console.log('Topic media_links:', response.topic.media_links);
      console.log('Topic media_links length:', response.topic.media_links?.length);
      console.log('Posts data received:', response.posts);
      
      // Set is_author based on current user for topic
      // Convert both to strings for comparison to ensure consistency
      const topicUserId = String(response.topic.user_id || '');
      const currentUserId = String(currentUser?.id || '');
      
      const topicData = {
        ...response.topic,
        is_author: currentUser && topicUserId === currentUserId ? true : false
      };
      
      // Set initial vote state from backend
      if (response.topic.user_vote) {
        setTopicVote(response.topic.user_vote);
      }
      
      // Set is_author and vote state based on current user for each post
      const postsData = response.posts.map(post => {
        // Convert both to strings for comparison to ensure consistency
        const postUserId = String(post.user_id || '');
        const currentUserId = String(currentUser?.id || '');
        const isAuthor = currentUser && postUserId === currentUserId;
        console.log('Post author check:', {
          postId: post.id,
          postUserId: postUserId,
          currentUserId: currentUserId,
          isAuthor,
          postUserIdType: typeof post.user_id,
          currentUserIdType: typeof currentUser?.id
        });
        
        // Set initial vote state for this post
        if (post.user_vote) {
          setPostVotes(prev => ({ ...prev, [post.id]: post.user_vote as 'like' | 'dislike' }));
        }
        
        return {
          ...post,
          is_author: isAuthor ? true : false
        };
      });
      
      console.log('Current user full:', currentUser);
      console.log('Posts with is_author:', postsData);
      
      setTopic(topicData);
      setPosts(postsData);
      setTotalPages(response.pagination.pages);
    } catch (error: unknown) {
      console.error('Topic loading error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки темы';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeTopic = async (likeType: 'like' | 'dislike') => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Store previous state for rollback
    const previousVote = topicVote;
    const previousTopic = topic;

    // Optimistic UI update - immediate feedback
    const newVote = topicVote === likeType ? null : likeType;
    setTopicVote(newVote);
    
    if (topic) {
      let newLikes = topic.likes;
      let newDislikes = topic.dislikes;
      
      // Remove previous vote counts
      if (previousVote === 'like') newLikes--;
      if (previousVote === 'dislike') newDislikes--;
      
      // Add new vote counts
      if (newVote === 'like') newLikes++;
      if (newVote === 'dislike') newDislikes++;
      
      setTopic({
        ...topic,
        likes: newLikes,
        dislikes: newDislikes
      });
    }

    try {
      // Send request in background
      const response = await forumAPI.likeTopic(topicId, likeType) as {
        likes: number;
        dislikes: number;
        userVote: 'like' | 'dislike' | null;
      };
      
      // Update with actual server response (in case of discrepancy)
      setTopicVote(response.userVote);
      if (topic) {
        setTopic({
          ...topic,
          likes: response.likes,
          dislikes: response.dislikes
        });
      }
    } catch (error: unknown) {
      // Rollback on error
      setTopicVote(previousVote);
      if (previousTopic) {
        setTopic(previousTopic);
      }
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при голосовании';
      setError(errorMessage);
    }
  };

  const handleLikePost = async (postId: string, likeType: 'like' | 'dislike') => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    // Store previous state for rollback
    const previousVote = postVotes[postId] || null;
    const previousPosts = [...posts];

    // Optimistic UI update - immediate feedback
    const newVote = previousVote === likeType ? null : likeType;
    setPostVotes(prev => ({ ...prev, [postId]: newVote }));
    
    // Update post counts immediately
    setPosts(prevPosts => 
      prevPosts.map(p => {
        if (p.id.toString() === postId) {
          let newLikes = p.likes;
          let newDislikes = p.dislikes;
          
          // Remove previous vote counts
          if (previousVote === 'like') newLikes--;
          if (previousVote === 'dislike') newDislikes--;
          
          // Add new vote counts
          if (newVote === 'like') newLikes++;
          if (newVote === 'dislike') newDislikes++;
          
          return { ...p, likes: newLikes, dislikes: newDislikes };
        }
        return p;
      })
    );

    try {
      // Send request in background
      const response = await forumAPI.likePost(postId, likeType) as {
        likes: number;
        dislikes: number;
        userVote: 'like' | 'dislike' | null;
      };
      
      // Update with actual server response (in case of discrepancy)
      setPostVotes(prev => ({ ...prev, [postId]: response.userVote }));
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id.toString() === postId 
            ? { ...p, likes: response.likes, dislikes: response.dislikes }
            : p
        )
      );
    } catch (error: unknown) {
      console.error('Like post error:', error);
      // Rollback on error
      setPostVotes(prev => ({ ...prev, [postId]: previousVote }));
      setPosts(previousPosts);
      
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при голосовании';
      
      // If token is invalid, ask user to re-login
      if (errorMessage.includes('token') || errorMessage.includes('Invalid') || errorMessage.includes('Unauthorized')) {
        setError('Ваша сессия истекла. Пожалуйста, войдите снова.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleDeleteTopic = async () => {
    if (!currentUser || !topic?.is_author) {
      return;
    }

    const confirmed = window.confirm('Вы уверены, что хотите удалить эту тему? Это действие нельзя отменить.');
    if (!confirmed) {
      return;
    }

    try {
      await forumAPI.deleteTopic(topicId);
      // Redirect to the category page after successful deletion
      router.push(`/category/${topic.category_id}`);
    } catch (error: unknown) {
      console.error('Topic deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления темы';
      setError(errorMessage);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) {
      return;
    }

    const confirmed = window.confirm('Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.');
    if (!confirmed) {
      return;
    }

    try {
      await forumAPI.deletePost(postId);
      // Reload the page to show updated posts
      loadTopicData();
    } catch (error: unknown) {
      console.error('Post deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления комментария';
      setError(errorMessage);
    }
  };


  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      setError('Введите текст ответа');
      return;
    }

    setSubmittingReply(true);
    setError('');

    try {
      // Images are now embedded in the markdown content, no separate media links needed
      await forumAPI.createPost(topicId, replyContent.trim());
      setReplyContent('');
      loadTopicData(); // Reload to show new post
    } catch (error: unknown) {
      console.error('Post creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания ответа';
      setError(errorMessage);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Handle image upload for RichTextEditor
  const handleEditorImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      const fileUrl = data.url || data.file_url;
      
      if (!fileUrl) {
        throw new Error('No file URL returned from upload');
      }
      
      // Return the full URL - the image will be embedded in markdown content
      return fileUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(`Ошибка загрузки изображения: ${errorMessage}`);
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Неизвестная дата';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Неверная дата';
    }
    
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <div className="text-gray-500 mt-10">Загрузка темы...</div>
        </div>
      </div>
    );
  }

  if (error && !topic) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <div className="text-red-500">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Вернуться на форум
          </button>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">
          <div className="text-gray-500">Тема не найдена</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-2 sm:px-4 py-4 sm:py-4 max-w-7xl min-h-screen">
      {/* Breadcrumb */}
      <nav className="mb-4 sm:mb-4">
        <ol className="flex items-center space-x-2 text-xs sm:text-sm">
          <li>
            <Link href="/" className="text-gray-500 hover:text-gray-700">Форум</Link>
          </li>
          <li className="text-gray-400">/</li>
          <li>
            <Link href={`/category/${topic.category_id}`} className="text-gray-500 hover:text-gray-700">
              {topic.category_name}
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-blue-500 truncate">{topic.title}</li>
        </ol>
      </nav>

      {/* Topic Header */}
      <TopicHeader
        topic={topic}
        postsCount={posts.length}
        topicVote={topicVote}
        onLikeTopic={handleLikeTopic}
        onDeleteTopic={handleDeleteTopic}
        formatDate={formatDate}
        currentUser={currentUser}
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Comments Header */}
      <div className="flex items-center justify-between mb-2 gap-4">
        <h2 className="text-sm text-gray-900/70">Комментарии: {posts.length}</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="comment-sort" className="text-sm text-gray-900/70">
            Сортировать:
          </label>
          <select
            id="comment-sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="text-sm text-gray-900/70 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="recent" className="text-sm text-gray-900/70">Самые новые</option>
            <option value="popular" className="text-sm text-gray-900/70">Самые популярные</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      <PostsList
        posts={posts}
        sortOrder={sortOrder}
        postVotes={postVotes}
        onLikePost={handleLikePost}
        onDeletePost={handleDeletePost}
        formatDate={formatDate}
        currentUser={currentUser}
        isTopicAuthor={topic.is_author}
      />

      {/* Reply Form */}
      {currentUser && !topic.is_locked && (
        <ReplyForm
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          submittingReply={submittingReply}
          onSubmit={handleSubmitReply}
          onImageUpload={handleEditorImageUpload}
        />
      )}

      {/* Login Prompt for Non-Authenticated Users */}
      {!currentUser && (
        <LoginPrompt 
          message="Войдите в аккаунт, чтобы отвечать на сообщения"
          buttonText="Войти"
          className="mb-4 sm:mb-6"
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-600">
              Страница {page} из {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <PaginationButton
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                direction="prev"
              />
              <PaginationButton
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                direction="next"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicViewPage;


