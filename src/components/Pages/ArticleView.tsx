import React, { useEffect, useState, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { contentAPI } from '../../services/firebaseIntegration';
import { apiCache } from '../../utils/cache';

// Lazy load components for better performance
const ArticleHeader = React.lazy(() => import('../Article/ArticleHeader'));
const ArticleInfo = React.lazy(() => import('../Article/ArticleInfo'));
const ArticleContent = React.lazy(() => import('../Article/ArticleContent'));
const ArticleLikes = React.lazy(() => import('../Article/ArticleLikes'));
const ArticleComments = React.lazy(() => import('../Article/ArticleComments'));

interface Article {
  id: string;
  title: string;
  subheader?: string;
  slug: string;
  content: string;
  mediaLinks: string[];
  coverImageUrl: string;
  authorName: string;
  authorPhotoURL?: string;
  status?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  likes?: number;
  dislikes?: number;
  userVote?: 'like' | 'dislike' | null;
}


const ArticleView: React.FC = () => {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!slugOrId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Check cache first
        const cacheKey = `article-${slugOrId}`;
        const cachedData = apiCache.get(cacheKey);
        if (cachedData) {
          setArticle(cachedData);
          setLoading(false);
          return;
        }

        const response = await contentAPI.getArticle(slugOrId);
        if (response && response.article) {
          const articleData = response.article;
          const formattedArticle = {
            id: articleData.id || '',
            title: articleData.title || '',
            subheader: articleData.subheader || '',
            slug: articleData.slug || '',
            content: articleData.content || '',
            mediaLinks: articleData.mediaLinks || [],
            coverImageUrl: articleData.coverImageUrl || '',
            authorName: articleData.authorName || '',
            authorPhotoURL: articleData.authorPhotoURL,
            status: articleData.status || '',
            tags: articleData.tags || '',
            likes: articleData.likes || 0,
            dislikes: articleData.dislikes || 0,
            userVote: articleData.userVote || null,
            created_at: articleData.created_at || new Date().toISOString(),
            updated_at: articleData.updated_at || new Date().toISOString()
          };

          // Cache for 5 minutes
          apiCache.set(cacheKey, formattedArticle, 5);
          setArticle(formattedArticle);
        } else {
          setError('Статья не найдена');
        }
      } catch (error) {
        console.error('Error loading article:', error);
        setError('Ошибка загрузки статьи');
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [slugOrId]);

  const handleLike = async (type: 'like' | 'dislike') => {
    if (!article) return;

    try {
      await contentAPI.likeArticle(article.id, type);
      
      // Reload article data to show updated counts
      const response = await contentAPI.getArticle(slugOrId!);
      if (response && response.article) {
        const articleData = response.article;
        const formattedArticle = {
          id: articleData.id || '',
          title: articleData.title || '',
          subheader: articleData.subheader || '',
          slug: articleData.slug || '',
          content: articleData.content || '',
          mediaLinks: articleData.mediaLinks || [],
          coverImageUrl: articleData.coverImageUrl || '',
          authorName: articleData.authorName || '',
          authorPhotoURL: articleData.authorPhotoURL,
          status: articleData.status || '',
          tags: articleData.tags || '',
          userVote: articleData.userVote || null,
          likes: articleData.likes || 0,
          dislikes: articleData.dislikes || 0,
          created_at: articleData.created_at || new Date().toISOString(),
          updated_at: articleData.updated_at || new Date().toISOString()
        };

        setArticle(formattedArticle);
        
        // Update cache
        const cacheKey = `article-${slugOrId}`;
        apiCache.set(cacheKey, formattedArticle, 5);
      }
    } catch (error) {
      console.error('Error voting on article:', error);
      alert('Ошибка при голосовании. Попробуйте еще раз.');
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-gray-500">
          {error || 'Статья не найдена'}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header loads first */}
      <Suspense fallback={<LoadingSkeleton />}>
        <ArticleHeader article={article} />
      </Suspense>

      

      {/* Content loads third */}
      <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-auto max-w-4xl"></div>}>
        <ArticleContent article={article} />
      </Suspense>

      {/* Likes load fourth */}
      <Suspense fallback={<div className="h-16 bg-gray-100 animate-pulse rounded-lg mx-auto max-w-4xl"></div>}>
        <div className="mx-auto max-w-4xl px-6">
          <ArticleLikes article={article} onLike={handleLike} />
        </div>
      </Suspense>

      {/* Info panel loads second */}
      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg mx-auto max-w-4xl"></div>}>
        <ArticleInfo article={article} />
      </Suspense>

      {/* Comments load last */}
      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-auto max-w-4xl"></div>}>
        <ArticleComments articleId={article.id} />
      </Suspense>
    </>
  );
};

export default ArticleView;


