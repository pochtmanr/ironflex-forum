// Firebase Integration Layer
// This file provides the same API interface as the original REST API
// but uses Firebase services underneath

import { firebaseAPI, articlesAPI, trainingsAPI } from './firebaseAPI';
import { initializeFirestore, testFirestoreConnection } from './initializeFirebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Initialize Firebase when this module loads
let isInitialized = false;

const initializeIfNeeded = async () => {
  if (!isInitialized) {
    console.log('🔥 Initializing Firebase integration...');
    
    // Test connection
    const connected = await testFirestoreConnection();
    if (!connected) {
      throw new Error('Failed to connect to Firestore');
    }
    
    // Initialize default data
    await initializeFirestore();
    
    isInitialized = true;
    console.log('✅ Firebase integration initialized');
  }
};

// Convert Firestore Timestamp to ISO string for compatibility
const convertTimestamp = (timestamp: any) => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp;
};

// Format data to match the original REST API response format
const formatCategoryData = (categories: any[]) => {
  return categories.map(cat => ({
    id: parseInt(cat.id) || cat.id,
    name: cat.name,
    description: cat.description,
    slug: cat.slug,
    topic_count: cat.topicCount || 0,
    post_count: cat.postCount || 0,
    last_activity: convertTimestamp(cat.lastActivity)
  }));
};

const formatTopicData = async (topics: any[]) => {
  const topicsWithPhotos = await Promise.all(
    topics.map(async topic => {
      let userPhotoURL: string | undefined = undefined;
      if (topic.userId) {
        try {
          const userRef = doc(db, 'users', topic.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            userPhotoURL = userData?.photoURL;
            console.log(`DEBUG formatTopicData: User ${topic.userId} data:`, userData);
            console.log(`DEBUG formatTopicData: photoURL = ${userPhotoURL}`);
          } else {
            console.log(`DEBUG formatTopicData: No user document found for ${topic.userId}`);
          }
        } catch (error) {
          console.warn(`Could not fetch photo for user ${topic.userId}:`, error);
        }
      }
      return {
        id: parseInt(topic.id) || topic.id,
        title: topic.title,
        content: topic.content,
        user_name: topic.userName,
        user_email: topic.userEmail,
        user_id: topic.userId,
        user_photo_url: userPhotoURL, // Include user photo URL
        category_id: topic.categoryId || topic.category_id || '',
        category_name: topic.categoryName || topic.category_name || 'Unknown Category',
        category_slug: topic.categorySlug || topic.category_slug || topic.categoryId || topic.category_id || '',
        reply_count: topic.replyCount || 0,
        views: topic.views || 0,
        likes: topic.likes || 0,
        dislikes: topic.dislikes || 0,
        created_at: convertTimestamp(topic.createdAt),
        last_post_at: convertTimestamp(topic.lastPostAt),
        is_pinned: topic.isPinned || false,
        is_locked: topic.isLocked || false,
        media_links: Array.isArray(topic.mediaLinks) ? topic.mediaLinks.join('\n') : (topic.mediaLinks || '')
      };
    })
  );
  return topicsWithPhotos;
};

const formatPostData = async (posts: any[]) => {
  const postsWithPhotos = await Promise.all(
    posts.map(async post => {
      let userPhotoURL: string | undefined = undefined;
      if (post.userId) {
        try {
          const userRef = doc(db, 'users', post.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            userPhotoURL = userData?.photoURL;
            console.log(`DEBUG formatPostData: User ${post.userId} data:`, userData);
            console.log(`DEBUG formatPostData: photoURL = ${userPhotoURL}`);
          } else {
            console.log(`DEBUG formatPostData: No user document found for ${post.userId}`);
          }
        } catch (error) {
          console.warn(`Could not fetch photo for user ${post.userId}:`, error);
        }
      }
      return {
        id: parseInt(post.id) || post.id,
        content: post.content,
        media_links: Array.isArray(post.mediaLinks) ? post.mediaLinks.join('\n') : (post.mediaLinks || ''),
        user_name: post.userName,
        user_email: post.userEmail,
        user_id: post.userId,
        user_photo_url: userPhotoURL, // Include user photo URL
        likes: post.likes || 0,
        dislikes: post.dislikes || 0,
        created_at: convertTimestamp(post.createdAt),
        is_edited: false,
        edited_at: null,
        parent_post_id: post.parentPostId || null,
        reply_count: 0,
        replies: []
      };
    })
  );
  return postsWithPhotos;
};

// Firebase-powered Forum API with REST API compatibility
export const forumAPI = {
  getCategories: async () => {
    await initializeIfNeeded();
    const result = await firebaseAPI.categories.getAll();
    return {
      categories: formatCategoryData(result.categories)
    };
  },

  getCategory: async (id: string, page = 1, limit = 20) => {
    await initializeIfNeeded();
    const result = await firebaseAPI.categories.getOne(id, page, limit);
    const categoryData = result.category as any; // Type assertion for Firebase data
    return {
      category: {
        id: parseInt(categoryData.id) || categoryData.id,
        name: categoryData.name || 'Unknown Category',
        description: categoryData.description || '',
        slug: categoryData.slug || categoryData.id
      },
      topics: await formatTopicData(result.topics),
      pagination: result.pagination
    };
  },

  createTopic: async (data: {
    categoryId: number;
    title: string;
    content: string;
    mediaLinks?: string[];
  }) => {
    await initializeIfNeeded();
    
    // Validate categoryId
    if (!data.categoryId || isNaN(data.categoryId) || data.categoryId <= 0) {
      throw new Error('Invalid category ID. Please select a valid category.');
    }
    
    return await firebaseAPI.topics.create({
      categoryId: data.categoryId.toString(),
      title: data.title,
      content: data.content,
      mediaLinks: data.mediaLinks
    });
  },

  getTopic: async (id: string, page = 1, limit = 20) => {
    await initializeIfNeeded();
    const result = await firebaseAPI.topics.getOne(id, page, limit);
    const formattedTopics = await formatTopicData([result.topic]);
    console.log('DEBUG: Formatted topic with photo:', formattedTopics[0]);
    return {
      topic: formattedTopics[0],
      posts: await formatPostData(result.posts),
      pagination: result.pagination
    };
  },

  createPost: async (topicId: string, content: string, mediaLinks?: string[]) => {
    await initializeIfNeeded();
    return await firebaseAPI.posts.create(topicId, content, mediaLinks || []);
  },

  search: async (query: string, page = 1, limit = 20) => {
    await initializeIfNeeded();
    const result = await firebaseAPI.search.search(query, page, limit);
    return {
      topics: await formatTopicData(result.topics),
      pagination: result.pagination
    };
  },

  getStats: async () => {
    await initializeIfNeeded();
    const result = await firebaseAPI.stats.getStats();
    return {
      stats: {
        total_topics: result.stats.totalTopics,
        total_posts: result.stats.totalPosts,
        total_users: result.stats.totalUsers,
        latest_username: result.stats.latestUsername
      },
      onlineUsers: result.onlineUsers
    };
  },

  getTopTopics: async (limit = 5, period: 'day' | 'week' | 'all' = 'all') => {
    await initializeIfNeeded();
    const result = await firebaseAPI.topics.getTopTopics(period, limit);
    return {
      topics: await formatTopicData(result.topics)
    };
  },

  likeTopic: async (topicId: string, likeType: 'like' | 'dislike') => {
    await initializeIfNeeded();
    return await firebaseAPI.topics.like(topicId, likeType);
  },

  likePost: async (postId: string, likeType: 'like' | 'dislike') => {
    await initializeIfNeeded();
    return await firebaseAPI.posts.like(postId, likeType);
  }
};

// Firebase-powered Content API
export const contentAPI = {             
  // Articles
  createArticle: async (data: {
    title: string;
    subheader?: string;
    content: string;
    status?: 'draft' | 'published';
    coverImageUrl?: string;
    mediaLinks?: string[];
    tags?: string;
  }) => {
    await initializeIfNeeded();
    const allMediaLinks = data.mediaLinks || [];
    return await articlesAPI.create({
      title: data.title,
      subheader: data.subheader,
      content: data.content,
      status: data.status || 'published',
      coverImageUrl: data.coverImageUrl || '',
      mediaLinks: allMediaLinks,
      tags: data.tags
    });
  },

  getArticles: async (page = 1, limit = 20) => {
    await initializeIfNeeded();
    console.log('DEBUG: contentAPI.getArticles called with page:', page, 'limit:', limit);
    const result = await articlesAPI.getAll(page, limit);
    console.log('DEBUG: Raw articles result from articlesAPI:', result);
    
    // Transform articles to match expected interface
    const transformedArticles = result.articles.map((article: any) => {
      // Generate excerpt from content if not present
      const content = article.content || '';
      const excerpt = article.excerpt || (content ? content.replace(/<[^>]*>/g, '').substring(0, 150) + (content.length > 150 ? '...' : '') : '');
      
      return {
        id: article.id,
        title: article.title || '',
        slug: article.slug || article.id,
        subheader: article.subheader || excerpt,
        coverImageUrl: article.coverImageUrl || '',
        tags: article.tags || '',
        created_at: article.created_at,
        likes: article.likes || 0,
        views: article.views || 0,
        commentCount: article.commentCount || 0
      };
    });
    
    console.log('DEBUG: Transformed articles:', transformedArticles);
    
    return {
      articles: transformedArticles,
      pagination: result.pagination
    };
  },

  getArticle: async (idOrSlug: string): Promise<{ article: any } | null> => {
    await initializeIfNeeded();
    const result = await articlesAPI.getOne(idOrSlug);
    
    if (result && result.article) {
      // Transform article data to match expected interface
      const article = result.article as any; // Type assertion for Firebase data
      console.log('DEBUG: Raw article data from Firebase:', article);
      
      // Fetch author photo URL if available
      let authorPhotoURL: string | undefined = undefined;
      if (article.authorId) {
        try {
          const userRef = doc(db, 'users', article.authorId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            authorPhotoURL = userData?.photoURL;
            console.log(`DEBUG getArticle: Author ${article.authorId} photoURL = ${authorPhotoURL}`);
          }
        } catch (error) {
          console.warn(`Could not fetch photo for author ${article.authorId}:`, error);
        }
      }
      
      const transformedArticle = {
        id: String(article.id || ''),
        title: String(article.title || ''),
        subheader: String(article.subheader || ''),
        slug: String(article.slug || article.id || ''),
        content: String(article.content || ''),
        mediaLinks: Array.isArray(article.mediaLinks) ? article.mediaLinks : [],
        coverImageUrl: String(article.coverImageUrl || ''),
        authorName: String(article.authorName || 'Anonymous'),
        authorPhotoURL: authorPhotoURL,
        tags: String(article.tags || ''),
        status: String(article.status || 'published'),
        likes: Number(article.likes || 0),
        dislikes: Number(article.dislikes || 0),
        userVote: article.userVote || null,
        created_at: String(article.created_at || new Date().toISOString()),
        updated_at: String(article.updated_at || article.created_at || new Date().toISOString())
      };
      
      return { article: transformedArticle };
    }
    
    return null;
  },

  deleteArticle: async (articleId: string) => {
    await initializeIfNeeded();
    return await articlesAPI.delete(articleId);
  },

  likeArticle: async (articleId: string, likeType: 'like' | 'dislike') => {
    await initializeIfNeeded();
    return await articlesAPI.like(articleId, likeType);
  },

  getArticleComments: async (articleId: string) => {
    await initializeIfNeeded();
    return await articlesAPI.getComments(articleId);
  },

  createArticleComment: async (data: { articleId: string; content: string; mediaLinks?: string[] }) => {
    await initializeIfNeeded();
    return await articlesAPI.createComment(data);
  },

  likeArticleComment: async (commentId: string, likeType: 'like' | 'dislike') => {
    await initializeIfNeeded();
    return await articlesAPI.likeComment(commentId, likeType);
  },

  // Trainings
  createTraining: async (data: {
    title: string;
    subheader?: string;
    content: string;
    level: string;
    durationMinutes?: number;
    status?: 'draft' | 'published';
    coverImageUrl?: string;
    mediaLinks?: string[];
  }) => {
    await initializeIfNeeded();
    const allMediaLinks = data.mediaLinks || [];
    return await trainingsAPI.create({
      title: data.title,
      subheader: data.subheader,
      content: data.content,
      level: data.level,
      durationMinutes: data.durationMinutes,
      status: data.status || 'published',
      coverImageUrl: data.coverImageUrl || '',
      mediaLinks: allMediaLinks
    });
  },

  getTrainings: async (page = 1, limit = 20) => {
    await initializeIfNeeded();
    console.log('DEBUG: contentAPI.getTrainings called with page:', page, 'limit:', limit);
    const result = await trainingsAPI.getAll(page, limit);
    console.log('DEBUG: Raw trainings result from trainingsAPI:', result);
    
    // Transform trainings to match expected interface
    const transformedTrainings = result.trainings?.map((training: any) => {
      // Generate subheader from content if not present
      const content = training.content || '';
      const subheader = training.subheader || (content ? content.replace(/<[^>]*>/g, '').substring(0, 150) + (content.length > 150 ? '...' : '') : '');
      
      return {
        id: training.id,
        title: training.title || '',
        slug: training.slug || training.id,
        subheader: subheader,
        content: training.content || '',
        level: training.level || '',
        durationMinutes: training.durationMinutes || 0,
        coverImageUrl: training.coverImageUrl || '',
        authorName: training.authorName || 'Anonymous',
        views: training.views || 0,
        likes: training.likes || 0,
        commentCount: training.commentCount || 0,
        created_at: training.created_at || new Date().toISOString()
      };
    }) || [];
    
    console.log('DEBUG: Transformed trainings:', transformedTrainings);
    
    return {
      trainings: transformedTrainings,
      pagination: result.pagination
    };
  },

  getTraining: async (idOrSlug: string): Promise<{ training: any } | null> => {
    await initializeIfNeeded();
    const result = await trainingsAPI.getOne(idOrSlug);
    
    if (result && result.training) {
      // Transform training data to match expected interface
      const training = result.training as any; // Type assertion for Firebase data
      const transformedTraining = {
        id: String(training.id || ''),
        title: String(training.title || ''),
        subheader: String(training.subheader || ''),
        slug: String(training.slug || training.id || ''),
        content: String(training.content || ''),
        mediaLinks: Array.isArray(training.mediaLinks) ? training.mediaLinks : [],
        coverImageUrl: String(training.coverImageUrl || ''),
        authorName: String(training.authorName || 'Anonymous'),
        level: String(training.level || ''),
        durationMinutes: training.durationMinutes || null,
        status: String(training.status || 'published'),
        likes: Number(training.likes || 0),
        dislikes: Number(training.dislikes || 0),
        created_at: String(training.created_at || new Date().toISOString()),
        updated_at: String(training.updated_at || training.created_at || new Date().toISOString())
      };
      
      return { training: transformedTraining };
    }
    
    return null;
  },

  likeTraining: async (trainingId: string, likeType: 'like' | 'dislike') => {
    await initializeIfNeeded();
    return await trainingsAPI.like(trainingId, likeType);
  }
};

// Firebase-powered Upload API
export const uploadAPI = {
  uploadFile: async (file: File, data?: { topicId?: number; postId?: number }) => {
    await initializeIfNeeded();
    const result = await firebaseAPI.upload.uploadMultipleFiles([file], {
      topicId: data?.topicId?.toString(),
      postId: data?.postId?.toString()
    });
    return {
      message: 'File uploaded successfully',
      attachment: result.attachments[0]
    };
  },

  uploadMultipleFiles: async (files: File[], data?: { topicId?: number; postId?: number }) => {
    await initializeIfNeeded();
    return await firebaseAPI.upload.uploadMultipleFiles(files, {
      topicId: data?.topicId?.toString(),
      postId: data?.postId?.toString()
    });
  },

  deleteFile: async (id: string) => {
    await initializeIfNeeded();
    return await firebaseAPI.upload.deleteFile(id);
  },

  getMyFiles: async (page = 1, limit = 20) => {
    // This would require tracking user files in Firestore
    // For now, return empty result
    return {
      files: [],
      pagination: { page, limit, total: 0, pages: 0 }
    };
  }
};


// Auth API - keep existing Firebase auth, but add compatibility layer
export const authAPI = {
  // These are placeholders since Firebase Auth is already working
  register: async (data: any) => {
    throw new Error('Use Firebase Auth directly via AuthContext');
  },
  login: async (emailOrUsername: string, password: string) => {
    throw new Error('Use Firebase Auth directly via AuthContext');
  },
  logout: async () => {
    throw new Error('Use Firebase Auth directly via AuthContext');
  },
  getMe: async () => {
    throw new Error('Use Firebase Auth directly via AuthContext');
  }
};

// Token manager - not needed with Firebase, but keep for compatibility
export const tokenManager = {
  getAccessToken: () => null,
  getRefreshToken: () => null,
  setTokens: (accessToken: string, refreshToken: string) => {},
  clearTokens: () => {}
};
