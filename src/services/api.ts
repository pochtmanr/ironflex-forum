// Firebase Integration Layer
// This file provides the same API interface as the original REST API
// but uses Firebase services underneath

import { firebaseAPI } from './firebaseAPI';
import { initializeFirestore, testFirestoreConnection } from './initializeFirebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { apiCache } from '../utils/cache';

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
            userPhotoURL = userSnap.data()?.photoURL;
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
    const cacheKey = 'categories';
    const cached = apiCache.get(cacheKey);
    if (cached) return cached;

    await initializeIfNeeded();
    const result = await firebaseAPI.categories.getAll();
    const formatted = {
      categories: formatCategoryData(result.categories)
    };
    
    apiCache.set(cacheKey, formatted, 5); // Cache for 5 minutes
    return formatted;
  },

  getCategory: async (id: string, page = 1, limit = 20) => {
    await initializeIfNeeded();
    const result = await firebaseAPI.categories.getOne(id, page, limit);
    const categoryData = result.category as any; // Type assertion for Firebase data
    return {
      category: {
        id: categoryData.id,
        name: categoryData.name || 'Unknown Category',
        description: categoryData.description || '',
        slug: categoryData.slug || categoryData.id
      },
      topics: await formatTopicData(result.topics),
      pagination: result.pagination
    };
  },

  createTopic: async (data: {
    categoryId: string;
    title: string;
    content: string;
    mediaLinks?: string[];
  }) => {
    await initializeIfNeeded();
    
    // Validate categoryId
    if (!data.categoryId || data.categoryId === 'NaN' || data.categoryId === 'undefined' || data.categoryId === '') {
      throw new Error('Invalid category ID. Please select a valid category.');
    }
    
    return await firebaseAPI.topics.create({
      categoryId: data.categoryId,
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

// Content API (for articles and trainings) - placeholder for future implementation
export const contentAPI = {
  getArticles: async (page = 1, limit = 20) => {
    return { articles: [], pagination: { page, limit, total: 0, pages: 0 } };
  },
  getArticle: async (slugOrId: string) => {
    return null;
  },
  getTrainings: async (page = 1, limit = 20) => {
    return { trainings: [], pagination: { page, limit, total: 0, pages: 0 } };
  },
  getTraining: async (slugOrId: string) => {
    return null;
  },
  // Admin functions would go here...
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
