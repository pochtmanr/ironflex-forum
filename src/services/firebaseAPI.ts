import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  increment,
  serverTimestamp,
  Timestamp,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { auth, db } from '../firebase/config';
import { getStorage } from 'firebase/storage';

const storage = getStorage();

// Types
interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: Timestamp;
  topicCount?: number;
  postCount?: number;
  lastActivity?: Timestamp;
}

interface ForumStats {
  totalTopics: number;
  totalPosts: number;
  totalUsers: number;
  latestUsername: string | null;
}

// Helper function to get current user
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user;
};

// Categories API
export const categoriesAPI = {
  // Get all categories with stats
  getAll: async (): Promise<{ categories: Category[] }> => {
    try {
      const categoriesRef = collection(db, 'categories');
      const q = query(categoriesRef, where('isActive', '==', true), orderBy('orderIndex'));
      const snapshot = await getDocs(q);

      const categories = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          const categoryId = docSnapshot.id;

          // Get topic count for this category
          const topicsRef = collection(db, 'topics');
          const topicsQuery = query(
            topicsRef,
            where('categoryId', '==', categoryId),
            where('isActive', '==', true)
          );
          const topicsSnapshot = await getDocs(topicsQuery);
          const topicCount = topicsSnapshot.size;

          // Get post count for this category (posts in topics of this category)
          let postCount = 0;
          for (const topicDoc of topicsSnapshot.docs) {
            const postsRef = collection(db, 'posts');
            const postsQuery = query(
              postsRef,
              where('topicId', '==', topicDoc.id),
              where('isActive', '==', true)
            );
            const postsSnapshot = await getDocs(postsQuery);
            postCount += postsSnapshot.size;
          }

          return {
            id: categoryId,
            ...data,
            topicCount,
            postCount
          } as Category;
        })
      );

      return { categories };
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  },

  // Get single category with topics
  getOne: async (categoryId: string, page = 1, limitCount = 20) => {
    try {
      // Validate categoryId
      if (!categoryId || categoryId === 'NaN' || categoryId === 'undefined') {
        throw new Error('Invalid category ID');
      }

      // Get category
      const categoryRef = doc(db, 'categories', categoryId);
      const categorySnap = await getDoc(categoryRef);

      if (!categorySnap.exists()) {
        throw new Error('Category not found');
      }

      const categoryData = categorySnap.data();
      const category = {
        id: categorySnap.id,
        name: categoryData?.name || 'Unknown Category',
        description: categoryData?.description || '',
        slug: categoryData?.slug || categorySnap.id,
        orderIndex: categoryData?.orderIndex || 0,
        isActive: categoryData?.isActive || true,
        ...categoryData
      };

      // Get topics for this category with pagination
      const topicsRef = collection(db, 'topics');
      const q = query(
        topicsRef,
        where('categoryId', '==', categoryId),
        where('isActive', '==', true),
        orderBy('isPinned', 'desc'),
        orderBy('lastPostAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const topicsSnapshot = await getDocs(q);
      const topics = topicsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total count
      const totalQuery = query(
        topicsRef,
        where('categoryId', '==', categoryId),
        where('isActive', '==', true)
      );
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      return {
        category,
        topics,
        pagination: {
          page,
          limit: limitCount,
          total,
          pages: Math.ceil(total / limitCount)
        }
      };
    } catch (error) {
      console.error('Error getting category:', error);
      throw error;
    }
  }
};

// Topics API
export const topicsAPI = {
  // Create new topic
  create: async (data: {
    categoryId: string;
    title: string;
    content: string;
    mediaLinks?: string[];
  }) => {
    try {
      const user = getCurrentUser();

      // Update user's lastActive timestamp
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { lastActive: serverTimestamp() }, { merge: true });

      // Get category information to store with topic
      let categoryName = 'Unknown Category';
      try {
        const categoryRef = doc(db, 'categories', data.categoryId);
        const categorySnap = await getDoc(categoryRef);
        if (categorySnap.exists()) {
          categoryName = categorySnap.data()?.name || 'Unknown Category';
        }
      } catch (error) {
        console.warn('Could not fetch category name:', error);
      }

      const topicData = {
        categoryId: data.categoryId,
        categoryName: categoryName,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userEmail: user.email || '',
        title: data.title,
        content: data.content,
        mediaLinks: data.mediaLinks || [],
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        views: 0,
        likes: 0,
        dislikes: 0,
        isPinned: false,
        isLocked: false,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastPostAt: serverTimestamp(),
        replyCount: 0
      };

      const docRef = await addDoc(collection(db, 'topics'), topicData);

      return {
        message: 'Topic created successfully',
        topicId: docRef.id
      };
    } catch (error) {
      console.error('Error creating topic:', error);
      throw error;
    }
  },

  // Get single topic with posts
  getOne: async (topicId: string, page = 1, limitCount = 20) => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Update user's lastActive timestamp if logged in
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { lastActive: serverTimestamp() }, { merge: true });
      }
      
      // Get topic first
      const topicRef = doc(db, 'topics', topicId);
      const topicSnap = await getDoc(topicRef);
      if (!topicSnap.exists()) {
        throw new Error('Topic not found');
      }

      // Increment view count (only if topic exists)
      try {
        await updateDoc(topicRef, { views: increment(1) });
      } catch (error) {
        console.warn('Could not update view count:', error);
      }

      const topic = { id: topicSnap.id, ...topicSnap.data() };

      // Get posts for this topic
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('topicId', '==', topicId),
        where('isActive', '==', true),
        orderBy('createdAt', 'asc'),
        firestoreLimit(limitCount)
      );

      const postsSnapshot = await getDocs(q);
      const posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get total posts count
      const totalQuery = query(
        postsRef,
        where('topicId', '==', topicId),
        where('isActive', '==', true)
      );
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      return {
        topic,
        posts,
        pagination: {
          page,
          limit: limitCount,
          total,
          pages: Math.ceil(total / limitCount)
        }
      };
    } catch (error) {
      console.error('Error getting topic:', error);
      throw error;
    }
  },

  // Get all topics (for debugging and admin purposes)
  getAll: async (page = 1, limitCount = 50) => {
    try {
      const topicsRef = collection(db, 'topics');
      const q = query(
        topicsRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const topicsSnapshot = await getDocs(q);
      const topics = topicsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        topics,
        pagination: {
          page,
          limit: limitCount,
          total: topics.length,
          pages: 1
        }
      };
    } catch (error) {
      console.error('Error getting all topics:', error);
      throw error;
    }
  },

  // Get topics with invalid category IDs
  getTopicsWithInvalidCategories: async () => {
    try {
      const topicsRef = collection(db, 'topics');
      const q = query(
        topicsRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const topicsSnapshot = await getDocs(q);
      const allTopics = topicsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter topics with invalid category IDs
      const invalidTopics = allTopics.filter((topic: any) =>
        !topic.categoryId ||
        topic.categoryId === 'NaN' ||
        topic.categoryId === 'undefined' ||
        topic.categoryId === ''
      );

      return invalidTopics;
    } catch (error) {
      console.error('Error getting topics with invalid categories:', error);
      throw error;
    }
  },

  // Get top topics
  getTopTopics: async (period: 'day' | 'week' | 'all' = 'all', limitCount = 5) => {
    try {
      const topicsRef = collection(db, 'topics');
      let q;
      const now = Timestamp.now();
      let startTime: Timestamp | null = null;

      if (period === 'day') {
        startTime = Timestamp.fromMillis(now.toMillis() - 24 * 60 * 60 * 1000);
      } else if (period === 'week') {
        startTime = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
      }

      if (startTime) {
        q = query(
          topicsRef,
          where('isActive', '==', true),
          where('createdAt', '>=', startTime), // Or lastPostAt, depending on what 'top' means
          orderBy('views', 'desc'), // Assuming 'top' is based on views
          firestoreLimit(limitCount)
        );
      } else {
        // All time
        q = query(
          topicsRef,
          where('isActive', '==', true),
          orderBy('views', 'desc'),
          firestoreLimit(limitCount)
        );
      }
      
      const topicsSnapshot = await getDocs(q);
      const topics = topicsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { topics };
    } catch (error) {
      console.error('Error getting top topics:', error);
      throw error;
    }
  },

  // Like/Dislike a topic
  like: async (topicId: string, likeType: 'like' | 'dislike') => {
    try {
      const user = getCurrentUser();
      const likesRef = collection(db, 'likes');
      const topicRef = doc(db, 'topics', topicId);

      // Check if user already liked/disliked this topic
      const existingLikeQuery = query(
        likesRef,
        where('userId', '==', user.uid),
        where('targetId', '==', topicId),
        where('targetType', '==', 'topic')
      );
      const existingLikeSnap = await getDocs(existingLikeQuery);

      if (!existingLikeSnap.empty) {
        const existingLike = existingLikeSnap.docs[0];
        const existingLikeData = existingLike.data();
        
        if (existingLikeData.likeType === likeType) {
          // User is clicking the same button - remove the like/dislike
          await deleteDoc(existingLike.ref);
          
          // Update the topic count
          if (likeType === 'like') {
            await updateDoc(topicRef, { likes: increment(-1) });
          } else {
            await updateDoc(topicRef, { dislikes: increment(-1) });
          }
        } else {
          // User is switching from like to dislike or vice versa
          await updateDoc(existingLike.ref, {
            likeType,
            updatedAt: serverTimestamp()
          });
          
          // Update both counts
          if (likeType === 'like') {
            await updateDoc(topicRef, { 
              likes: increment(1),
              dislikes: increment(-1)
            });
          } else {
            await updateDoc(topicRef, { 
              likes: increment(-1),
              dislikes: increment(1)
            });
          }
        }
      } else {
        // No existing like/dislike - create new one
        await addDoc(likesRef, {
          userId: user.uid,
          targetId: topicId,
          targetType: 'topic',
          likeType,
          createdAt: serverTimestamp()
        });
        
        // Update the topic count
        if (likeType === 'like') {
          await updateDoc(topicRef, { likes: increment(1) });
        } else {
          await updateDoc(topicRef, { dislikes: increment(1) });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error liking topic:', error);
      throw error;
    }
  }
};

// Posts API
export const postsAPI = {
  // Create new post (reply)
  create: async (topicId: string, content: string, mediaLinks: string[] = [], parentPostId?: string) => {
    try {
      const user = getCurrentUser();

      const postData = {
        topicId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userEmail: user.email || '',
        content,
        mediaLinks,
        likes: 0,
        dislikes: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(parentPostId && { parentPostId })
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);

      // Update topic's reply count and last post time
      const topicRef = doc(db, 'topics', topicId);
      await updateDoc(topicRef, {
        replyCount: increment(1),
        lastPostAt: serverTimestamp()
      });

      return {
        message: 'Post created successfully',
        postId: docRef.id
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Like/Dislike a post
  like: async (postId: string, likeType: 'like' | 'dislike') => {
    try {
      const user = getCurrentUser();
      const likesRef = collection(db, 'likes');
      const postRef = doc(db, 'posts', postId);

      // Check if user already liked/disliked this post
      const existingLikeQuery = query(
        likesRef,
        where('userId', '==', user.uid),
        where('targetId', '==', postId),
        where('targetType', '==', 'post')
      );
      const existingLikeSnap = await getDocs(existingLikeQuery);

      if (!existingLikeSnap.empty) {
        const existingLike = existingLikeSnap.docs[0];
        const existingLikeData = existingLike.data();
        
        if (existingLikeData.likeType === likeType) {
          // User is clicking the same button - remove the like/dislike
          await deleteDoc(existingLike.ref);
          
          // Update the post count
          if (likeType === 'like') {
            await updateDoc(postRef, { likes: increment(-1) });
          } else {
            await updateDoc(postRef, { dislikes: increment(-1) });
          }
        } else {
          // User is switching from like to dislike or vice versa
          await updateDoc(existingLike.ref, {
            likeType,
            updatedAt: serverTimestamp()
          });
          
          // Update both counts
          if (likeType === 'like') {
            await updateDoc(postRef, { 
              likes: increment(1),
              dislikes: increment(-1)
            });
          } else {
            await updateDoc(postRef, { 
              likes: increment(-1),
              dislikes: increment(1)
            });
          }
        }
      } else {
        // No existing like/dislike - create new one
        await addDoc(likesRef, {
          userId: user.uid,
          targetId: postId,
          targetType: 'post',
          likeType,
          createdAt: serverTimestamp()
        });
        
        // Update the post count
        if (likeType === 'like') {
          await updateDoc(postRef, { likes: increment(1) });
        } else {
          await updateDoc(postRef, { dislikes: increment(1) });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }
};

// Articles API
export const articlesAPI = {
  // Create new article
  create: async (data: {
    title: string;
    subheader?: string;
    content: string;
    excerpt?: string;
    coverImageUrl?: string;
    mediaLinks?: string[];
    status?: 'draft' | 'published';
    tags?: string;
  }) => {
    try {
      const user = getCurrentUser();

      const articleData = {
        title: data.title,
        subheader: data.subheader || '',
        content: data.content,
        excerpt: data.excerpt || data.content.replace(/<[^>]*>/g, '').substring(0, 200) + '...',
        coverImageUrl: data.coverImageUrl || '',
        mediaLinks: data.mediaLinks || [],
        status: data.status || 'published',
        tags: data.tags || '',
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email || '',
        views: 0,
        likes: 0,
        dislikes: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('DEBUG: Creating article with data:', {
        ...articleData,
        subheader: data.subheader
      });

      const docRef = await addDoc(collection(db, 'articles'), articleData);

      return {
        message: 'Article created successfully',
        articleId: docRef.id
      };
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  },

  // Get all articles with pagination
  getAll: async (page = 1, limitCount = 20) => {
    try {
      const articlesRef = collection(db, 'articles');
      
      // First try with filters
      let q = query(
        articlesRef,
        where('isActive', '==', true),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      let articlesSnapshot = await getDocs(q);
      console.log('DEBUG: First query (with filters) found', articlesSnapshot.size, 'articles');
      
      // If no results with filters, try without filters for debugging
      if (articlesSnapshot.empty) {
        console.log('No articles found with filters, trying without...');
        q = query(
          articlesRef,
          orderBy('createdAt', 'desc'),
          firestoreLimit(limitCount)
        );
        articlesSnapshot = await getDocs(q);
        console.log('DEBUG: Second query (no filters) found', articlesSnapshot.size, 'articles');
        
        // Debug: List all articles in collection
        const allArticlesQuery = query(collection(db, 'articles'), firestoreLimit(5));
        const allArticles = await getDocs(allArticlesQuery);
        console.log('DEBUG: All articles in collection:');
        allArticles.forEach(doc => {
          const data = doc.data();
          console.log(`- ID: ${doc.id}, Title: ${data.title}, Status: ${data.status}, IsActive: ${data.isActive}`);
        });
      }
      const articles = await Promise.all(
        articlesSnapshot.docs.map(async (doc) => {
          const articleData = doc.data();
          
          // Get real comment count
          let commentCount = 0;
          try {
            const commentsRef = collection(db, 'articleComments');
            const commentsQuery = query(commentsRef, where('articleId', '==', doc.id));
            const commentsSnapshot = await getDocs(commentsQuery);
            commentCount = commentsSnapshot.size;
          } catch (error) {
            console.warn(`Could not fetch comment count for article ${doc.id}:`, error);
          }

          return {
            id: doc.id,
            ...articleData,
            commentCount,
            created_at: articleData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          };
        })
      );

      return {
        articles,
        pagination: {
          page,
          pages: Math.ceil(articles.length / limitCount),
          total: articles.length
        }
      };
    } catch (error) {
      console.error('Error getting articles:', error);
      throw error;
    }
  },

  // Get single article by ID or slug
  getOne: async (idOrSlug: string) => {
    try {
      console.log('DEBUG: Looking for article with ID or slug:', idOrSlug);
      let articleDoc;
      
      // First try to get by document ID
      try {
        const articleRef = doc(db, 'articles', idOrSlug);
        articleDoc = await getDoc(articleRef);
        console.log('DEBUG: Tried by ID, exists:', articleDoc.exists());
      } catch (error) {
        console.log('DEBUG: Failed to get by ID, trying slug...');
        // If ID fails, try to find by slug
        const articlesRef = collection(db, 'articles');
        
        // First try with all filters
        let q = query(
          articlesRef,
          where('slug', '==', idOrSlug),
          where('isActive', '==', true),
          firestoreLimit(1)
        );
        let querySnapshot = await getDocs(q);
        
        // If not found, try without isActive filter
        if (querySnapshot.empty) {
          console.log('DEBUG: Not found with isActive filter, trying without...');
          q = query(
            articlesRef,
            where('slug', '==', idOrSlug),
            firestoreLimit(1)
          );
          querySnapshot = await getDocs(q);
        }
        
        if (!querySnapshot.empty) {
          articleDoc = querySnapshot.docs[0];
          console.log('DEBUG: Found article by slug');
        }
      }

      if (!articleDoc || !articleDoc.exists()) {
        // List all articles for debugging
        const allArticlesQuery = query(collection(db, 'articles'), firestoreLimit(10));
        const allArticles = await getDocs(allArticlesQuery);
        console.log('DEBUG: Available articles:');
        allArticles.forEach(doc => {
          const data = doc.data();
          console.log(`- ID: ${doc.id}, Slug: ${data.slug}, Title: ${data.title}`);
        });
        throw new Error('Article not found');
      }

      // Increment view count
      try {
        await updateDoc(articleDoc.ref, {
          views: increment(1)
        });
      } catch (error) {
        console.warn('Could not update article view count:', error);
      }

      const docData = articleDoc.data() || {};
      const articleData = {
        id: articleDoc.id,
        ...docData,
        created_at: docData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: docData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };

          // Check user's vote if authenticated
      let userVote = null;
      try {
        const user = getCurrentUser();
        if (user) {
          const voteRef = doc(db, 'articleVotes', `${articleDoc.id}_${user.uid}`);
          const voteDoc = await getDoc(voteRef);
          if (voteDoc.exists()) {
            userVote = voteDoc.data().type;
          }
        }
      } catch (voteError) {
        // User not authenticated or error checking vote - that's ok
        console.log('No user authentication or vote check failed');
      }

      return { 
        article: {
          ...articleData,
          userVote
        }
      };
    } catch (error) {
      console.error('Error getting article:', error);
      throw error;
    }
  },

  // Delete article
  delete: async (articleId: string) => {
    try {
      const user = getCurrentUser();
      const articleRef = doc(db, 'articles', articleId);
      
      // Check if article exists and user has permission
      const articleSnap = await getDoc(articleRef);
      if (!articleSnap.exists()) {
        throw new Error('Article not found');
      }

      const articleData = articleSnap.data();
      if (articleData.authorId !== user.uid) {
        // TODO: Add admin role check here
        console.warn('User attempting to delete article they did not create');
      }

      await deleteDoc(articleRef);
      return { message: 'Article deleted successfully' };
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  },

  // Get comments for article
  getComments: async (articleId: string) => {
    try {
      const commentsRef = collection(db, 'articleComments');
      const q = query(
        commentsRef,
        where('articleId', '==', articleId),
        orderBy('createdAt', 'desc')
      );
      
      const commentsSnapshot = await getDocs(q);
      const comments = commentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }));

      return { comments };
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  },

  // Like/Dislike comment
  likeComment: async (commentId: string, likeType: 'like' | 'dislike') => {
    try {
      const user = getCurrentUser();
      const voteRef = doc(db, 'commentVotes', `${commentId}_${user.uid}`);
      const commentRef = doc(db, 'articleComments', commentId);

      // Check existing vote
      const existingVote = await getDoc(voteRef);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const commentData = commentDoc.data();
      let likeDelta = 0;
      let dislikeDelta = 0;

      if (existingVote.exists()) {
        const currentVote = existingVote.data().type;
        
        if (currentVote === likeType) {
          // Remove vote if clicking same button
          await deleteDoc(voteRef);
          if (likeType === 'like') likeDelta = -1;
          else dislikeDelta = -1;
        } else {
          // Change vote
          await setDoc(voteRef, {
            commentId,
            userId: user.uid,
            type: likeType,
            createdAt: serverTimestamp()
          });
          if (likeType === 'like') {
            likeDelta = 1;
            dislikeDelta = -1;
          } else {
            likeDelta = -1;
            dislikeDelta = 1;
          }
        }
      } else {
        // New vote
        await setDoc(voteRef, {
          commentId,
          userId: user.uid,
          type: likeType,
          createdAt: serverTimestamp()
        });
        if (likeType === 'like') likeDelta = 1;
        else dislikeDelta = 1;
      }

      const newLikes = Math.max(0, (commentData.likes || 0) + likeDelta);
      const newDislikes = Math.max(0, (commentData.dislikes || 0) + dislikeDelta);

      // Update comment counts
      await updateDoc(commentRef, {
        likes: newLikes,
        dislikes: newDislikes,
        updatedAt: serverTimestamp()
      });

      return {
        message: 'Comment vote recorded successfully',
        likes: newLikes,
        dislikes: newDislikes
      };
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw error;
    }
  },

  // Create comment
  createComment: async (data: {
    articleId: string;
    content: string;
    mediaLinks?: string[];
  }) => {
    try {
      const user = getCurrentUser();

      const commentData = {
        articleId: data.articleId,
        content: data.content,
        mediaLinks: data.mediaLinks || [],
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userEmail: user.email || '',
        likes: 0,
        dislikes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'articleComments'), commentData);

      return {
        message: 'Comment created successfully',
        commentId: docRef.id
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  // Like/Dislike article
  like: async (articleId: string, likeType: 'like' | 'dislike') => {
    try {
      console.log('DEBUG: articlesAPI.like called with:', articleId, likeType);
      const user = getCurrentUser();
      console.log('DEBUG: Current user:', user?.uid);
      
      const voteRef = doc(db, 'articleVotes', `${articleId}_${user.uid}`);
      const articleRef = doc(db, 'articles', articleId);

      // Check existing vote
      const existingVote = await getDoc(voteRef);
      const articleDoc = await getDoc(articleRef);
      
      console.log('DEBUG: Article exists:', articleDoc.exists());
      console.log('DEBUG: Existing vote exists:', existingVote.exists());
      
      if (!articleDoc.exists()) {
        throw new Error('Article not found');
      }

      const articleData = articleDoc.data();
      console.log('DEBUG: Current article likes/dislikes:', articleData.likes, articleData.dislikes);
      
      let likeDelta = 0;
      let dislikeDelta = 0;

      if (existingVote.exists()) {
        const currentVote = existingVote.data().type;
        console.log('DEBUG: User has existing vote:', currentVote);
        
        if (currentVote === likeType) {
          // Remove vote if clicking same button
          await deleteDoc(voteRef);
          if (likeType === 'like') likeDelta = -1;
          else dislikeDelta = -1;
          console.log('DEBUG: Removing vote, deltas:', likeDelta, dislikeDelta);
        } else {
          // Change vote
          await setDoc(voteRef, {
            articleId,
            userId: user.uid,
            type: likeType,
            createdAt: serverTimestamp()
          });
          if (likeType === 'like') {
            likeDelta = 1;
            dislikeDelta = -1;
          } else {
            likeDelta = -1;
            dislikeDelta = 1;
          }
          console.log('DEBUG: Changing vote, deltas:', likeDelta, dislikeDelta);
        }
      } else {
        // New vote
        await setDoc(voteRef, {
          articleId,
          userId: user.uid,
          type: likeType,
          createdAt: serverTimestamp()
        });
        if (likeType === 'like') likeDelta = 1;
        else dislikeDelta = 1;
        console.log('DEBUG: New vote, deltas:', likeDelta, dislikeDelta);
      }

      const newLikes = Math.max(0, (articleData.likes || 0) + likeDelta);
      const newDislikes = Math.max(0, (articleData.dislikes || 0) + dislikeDelta);
      
      console.log('DEBUG: Updating article with new counts:', newLikes, newDislikes);

      // Update article counts
      await updateDoc(articleRef, {
        likes: newLikes,
        dislikes: newDislikes,
        updatedAt: serverTimestamp()
      });

      console.log('DEBUG: Article updated successfully');

      return {
        message: 'Vote recorded successfully',
        likes: newLikes,
        dislikes: newDislikes
      };
    } catch (error) {
      console.error('ERROR in articlesAPI.like:', error);
      throw error;
    }
  }
};

// Trainings API (similar structure to articles)
export const trainingsAPI = {
  // Create new training
  create: async (data: {
    title: string;
    subheader?: string;
    content: string;
    level: string;
    durationMinutes?: number;
    coverImageUrl?: string;
    mediaLinks?: string[];
    status?: 'draft' | 'published';
  }) => {
    try {
      const user = getCurrentUser();

      const trainingData = {
        title: data.title,
        subheader: data.subheader || '',
        content: data.content,
        level: data.level,
        durationMinutes: data.durationMinutes || null,
        coverImageUrl: data.coverImageUrl || '',
        mediaLinks: data.mediaLinks || [],
        status: data.status || 'published',
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        authorEmail: user.email || '',
        views: 0,
        likes: 0,
        dislikes: 0,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'trainings'), trainingData);

      return {
        message: 'Training created successfully',
        trainingId: docRef.id
      };
    } catch (error) {
      console.error('Error creating training:', error);
      throw error;
    }
  },

  // Get all trainings
  getAll: async (page = 1, limitCount = 20) => {
    try {
      const trainingsRef = collection(db, 'trainings');
      
      // First try with filters
      let q = query(
        trainingsRef,
        where('isActive', '==', true),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      let trainingsSnapshot = await getDocs(q);
      console.log('DEBUG: First query (with filters) found', trainingsSnapshot.size, 'trainings');
      
      // If no results with filters, try without filters for debugging
      if (trainingsSnapshot.empty) {
        console.log('No trainings found with filters, trying without...');
        q = query(
          trainingsRef,
          orderBy('createdAt', 'desc'),
          firestoreLimit(limitCount)
        );
        trainingsSnapshot = await getDocs(q);
        console.log('DEBUG: Second query (no filters) found', trainingsSnapshot.size, 'trainings');
      }
      
      // Debug: List all trainings in collection
      const allTrainingsQuery = query(collection(db, 'trainings'), firestoreLimit(5));
      const allTrainings = await getDocs(allTrainingsQuery);
      console.log('DEBUG: All trainings in collection:');
      allTrainings.forEach(doc => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}, Title: ${data.title}, Status: ${data.status}, IsActive: ${data.isActive}`);
      });
      
      const trainings = await Promise.all(
        trainingsSnapshot.docs.map(async (doc) => {
          const trainingData = doc.data();
          
          // Get real comment count for trainings
          let commentCount = 0;
          try {
            const commentsRef = collection(db, 'trainingComments');
            const commentsQuery = query(commentsRef, where('trainingId', '==', doc.id));
            const commentsSnapshot = await getDocs(commentsQuery);
            commentCount = commentsSnapshot.size;
          } catch (error) {
            console.warn(`Could not fetch comment count for training ${doc.id}:`, error);
          }

          return {
            id: doc.id,
            ...trainingData,
            commentCount,
            created_at: trainingData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          };
        })
      );

      return {
        trainings,
        pagination: {
          page,
          pages: Math.ceil(trainings.length / limitCount),
          total: trainings.length
        }
      };
    } catch (error) {
      console.error('Error getting trainings:', error);
      throw error;
    }
  },

  // Get single training by ID or slug
  getOne: async (idOrSlug: string) => {
    try {
      console.log('DEBUG: Looking for training with ID or slug:', idOrSlug);
      let trainingDoc;
      
      // First try to get by document ID
      try {
        const trainingRef = doc(db, 'trainings', idOrSlug);
        trainingDoc = await getDoc(trainingRef);
        console.log('DEBUG: Tried by ID, exists:', trainingDoc.exists());
      } catch (error) {
        console.log('DEBUG: Failed to get by ID, trying slug...');
        // If ID fails, try to find by slug
        const trainingsRef = collection(db, 'trainings');
        
        // First try with all filters
        let slugQuery = query(
          trainingsRef,
          where('slug', '==', idOrSlug),
          where('isActive', '==', true),
          where('status', '==', 'published')
        );
        let slugSnapshot = await getDocs(slugQuery);
        
        // If not found, try without filters
        if (slugSnapshot.empty) {
          console.log('DEBUG: Not found with filters, trying without...');
          slugQuery = query(
            trainingsRef,
            where('slug', '==', idOrSlug)
          );
          slugSnapshot = await getDocs(slugQuery);
        }
        
        if (!slugSnapshot.empty) {
          trainingDoc = slugSnapshot.docs[0];
          console.log('DEBUG: Found training by slug');
        }
      }

      if (!trainingDoc || !trainingDoc.exists()) {
        // List all trainings for debugging
        const allTrainingsQuery = query(collection(db, 'trainings'), firestoreLimit(10));
        const allTrainings = await getDocs(allTrainingsQuery);
        console.log('DEBUG: Available trainings:');
        allTrainings.forEach(doc => {
          const data = doc.data();
          console.log(`- ID: ${doc.id}, Slug: ${data.slug}, Title: ${data.title}`);
        });
        throw new Error('Training not found');
      }

      // Increment view count
      try {
        await setDoc(trainingDoc.ref, {
          views: increment(1),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.warn('Could not update training view count:', error);
      }

      const docData = trainingDoc.data() || {};
      const trainingData = {
        id: trainingDoc.id,
        ...docData,
        created_at: docData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: docData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };

      return { training: trainingData };
    } catch (error) {
      console.error('Error getting training:', error);
      throw error;
    }
  },

  // Like/Dislike training
  like: async (trainingId: string, likeType: 'like' | 'dislike') => {
    try {
      const user = getCurrentUser();
      const voteRef = doc(db, 'trainingVotes', `${trainingId}_${user.uid}`);
      const trainingRef = doc(db, 'trainings', trainingId);

      // Check existing vote
      const existingVote = await getDoc(voteRef);
      const trainingDoc = await getDoc(trainingRef);
      
      if (!trainingDoc.exists()) {
        throw new Error('Training not found');
      }

      const trainingData = trainingDoc.data();
      let likeDelta = 0;
      let dislikeDelta = 0;

      if (existingVote.exists()) {
        const currentVote = existingVote.data().type;
        
        if (currentVote === likeType) {
          // Remove vote if clicking same button
          await deleteDoc(voteRef);
          if (likeType === 'like') likeDelta = -1;
          else dislikeDelta = -1;
        } else {
          // Change vote
          await setDoc(voteRef, {
            trainingId,
            userId: user.uid,
            type: likeType,
            createdAt: serverTimestamp()
          });
          if (likeType === 'like') {
            likeDelta = 1;
            dislikeDelta = -1;
          } else {
            likeDelta = -1;
            dislikeDelta = 1;
          }
        }
      } else {
        // New vote
        await setDoc(voteRef, {
          trainingId,
          userId: user.uid,
          type: likeType,
          createdAt: serverTimestamp()
        });
        if (likeType === 'like') likeDelta = 1;
        else dislikeDelta = 1;
      }

      // Update training counts
      await updateDoc(trainingRef, {
        likes: Math.max(0, (trainingData.likes || 0) + likeDelta),
        dislikes: Math.max(0, (trainingData.dislikes || 0) + dislikeDelta),
        updatedAt: serverTimestamp()
      });

      return {
        message: 'Vote recorded successfully',
        likes: Math.max(0, (trainingData.likes || 0) + likeDelta),
        dislikes: Math.max(0, (trainingData.dislikes || 0) + dislikeDelta)
      };
    } catch (error) {
      console.error('Error voting on training:', error);
      throw error;
    }
  }
};

// Upload API (Firebase Storage)
export const uploadAPI = {
  // Upload multiple files to Firebase Storage
  uploadMultipleFiles: async (files: File[], data?: { topicId?: string; postId?: string }) => {
    try {
      const user = getCurrentUser();
      const uploadPromises = files.map(async (file) => {
        // Create unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        const filepath = `uploads/${user.uid}/${filename}`;

        // Upload to Firebase Storage
        const storageRef = ref(storage, filepath);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
          id: snapshot.ref.fullPath,
          url: downloadURL,
          filename: file.name,
          size: file.size,
          mimeType: file.type
        };
      });

      const attachments = await Promise.all(uploadPromises);

      return {
        message: 'Files uploaded successfully',
        attachments
      };
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  // Upload a single file to Firebase Storage
  uploadSingleFile: async (file: File) => {
    try {
      const user = getCurrentUser();
      const timestamp = Date.now();
      const filename = `${timestamp}-${file.name}`;
      const filepath = `uploads/${user.uid}/${filename}`;

      const storageRef = ref(storage, filepath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return {
        message: 'File uploaded successfully',
        imageUrl: downloadURL,
        filename: file.name,
        size: file.size,
        mimeType: file.type
      };
    } catch (error) {
      console.error('Error uploading single file:', error);
      throw error;
    }
  },

  // Delete file from Firebase Storage
  deleteFile: async (filepath: string) => {
    try {
      const storageRef = ref(storage, filepath);
      await deleteObject(storageRef);
      return { message: 'File deleted successfully' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
};

// Stats API
export const statsAPI = {
  // Get forum statistics
  getStats: async (): Promise<{ stats: ForumStats; onlineUsers: number }> => {
    try {
      // Get total topics
      const topicsRef = collection(db, 'topics');
      const topicsQuery = query(topicsRef, where('isActive', '==', true));
      const topicsSnapshot = await getDocs(topicsQuery);
      const totalTopics = topicsSnapshot.size;

      // Get total posts
      const postsRef = collection(db, 'posts');
      const postsQuery = query(postsRef, where('isActive', '==', true));
      const postsSnapshot = await getDocs(postsQuery);
      const totalPosts = postsSnapshot.size;

      // Get total users from the 'users' collection
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const totalUsers = usersSnapshot.size;

      // Calculate online users (active in the last 5 minutes)
      const fiveMinutesAgo = Timestamp.fromMillis(Date.now() - 5 * 60 * 1000);
      const onlineUsersQuery = query(
        usersRef,
        where('lastActive', '>=', fiveMinutesAgo)
      );
      const onlineUsersSnapshot = await getDocs(onlineUsersQuery);
      const onlineUsersCount = onlineUsersSnapshot.size;

      const stats: ForumStats = {
        totalTopics,
        totalPosts,
        totalUsers,
        latestUsername: null
      };

      return {
        stats,
        onlineUsers: onlineUsersCount
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
};

// Search API
export const searchAPI = {
  search: async (searchQuery: string, page = 1, limitCount = 20) => {
    try {
      // Firebase doesn't have full-text search, so we'll do a simple title search
      // For production, consider using Algolia or similar
      const topicsRef = collection(db, 'topics');
      const q = query(
        topicsRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const snapshot = await getDocs(q);
      const allTopics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Client-side filtering (not ideal for large datasets)
      const filteredTopics = allTopics.filter((topic: any) =>
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.content.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return {
        topics: filteredTopics,
        pagination: {
          page,
          limit: limitCount,
          total: filteredTopics.length,
          pages: Math.ceil(filteredTopics.length / limitCount)
        }
      };
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  }
};

// Export the new Firebase API
export const firebaseAPI = {
  categories: categoriesAPI,
  topics: topicsAPI,
  posts: postsAPI,
  upload: uploadAPI,
  stats: statsAPI,
  search: searchAPI
};
