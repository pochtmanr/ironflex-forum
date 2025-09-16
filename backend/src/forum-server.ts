import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase, dbAll, dbGet, dbRun, dbInsert, getForumStats } from './config/database-sqlite';
import { verifyIdToken } from './config/firebase';
import { 
  uploadSingle, 
  uploadMultiple, 
  handleImageUpload, 
  handleMultipleImageUpload 
} from './services/imageUpload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Initialize database
initializeDatabase().catch(console.error);

// Serve uploaded images statically
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Image upload routes
app.post('/api/upload/image', uploadSingle, handleImageUpload);
app.post('/api/upload/images', uploadMultiple, handleMultipleImageUpload);

// Get all categories with topic/post counts
app.get('/api/forum/categories', async (req, res) => {
  try {
    const categories = await dbAll(`
      SELECT 
        c.*,
        COUNT(DISTINCT t.id) as topic_count,
        COUNT(DISTINCT p.id) as post_count,
        MAX(COALESCE(p.created_at, t.created_at)) as last_activity
      FROM categories c
      LEFT JOIN topics t ON c.id = t.category_id AND t.is_active = 1
      LEFT JOIN posts p ON t.id = p.topic_id AND p.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.order_index ASC
    `);

    res.json({ categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single category with topics
app.get('/api/forum/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get category info
    const category = await dbGet('SELECT * FROM categories WHERE id = ? AND is_active = 1', [id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get topics count
    const countResult = await dbGet(
      'SELECT COUNT(*) as total FROM topics WHERE category_id = ? AND is_active = 1',
      [id]
    ) as any;

    // Get topics with pagination
    const topics = await dbAll(`
      SELECT 
        t.*,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'topic' AND target_id = t.id AND like_type = 'like') as likes,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'topic' AND target_id = t.id AND like_type = 'dislike') as dislikes
      FROM topics t
      WHERE t.category_id = ? AND t.is_active = 1
      ORDER BY t.is_pinned DESC, t.last_post_at DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    res.json({
      category,
      topics,
      pagination: {
        page,
        limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new topic
app.post('/api/forum/topics', async (req, res) => {
  try {
    const { categoryId, title, content, mediaLinks, userId, userEmail, userName } = req.body;

    if (!categoryId || !title || !content || !userId || !userEmail || !userName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if category exists
    const category = await dbGet('SELECT id FROM categories WHERE id = ? AND is_active = 1', [categoryId]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create slug from title
    const slug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // Insert topic
    const result = await dbInsert(
      'INSERT INTO topics (category_id, user_id, user_email, user_name, title, content, media_links, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [categoryId, userId, userEmail, userName, title, content, mediaLinks || '', slug]
    );

    res.status(201).json({
      message: 'Topic created successfully',
      topicId: result.lastID
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single topic with posts
app.get('/api/forum/topics/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Increment view count
    await dbRun('UPDATE topics SET views = views + 1 WHERE id = ?', [id]);

    // Get topic info
    const topic = await dbGet(`
      SELECT 
        t.*,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'topic' AND target_id = t.id AND like_type = 'like') as likes,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'topic' AND target_id = t.id AND like_type = 'dislike') as dislikes
      FROM topics t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ? AND t.is_active = 1
    `, [id]);

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get posts count
    const countResult = await dbGet(
      'SELECT COUNT(*) as total FROM posts WHERE topic_id = ? AND is_active = 1',
      [id]
    ) as any;

    // Get posts with pagination - only root level posts for now, nested will be handled by frontend
    const posts = await dbAll(`
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id AND like_type = 'like') as likes,
        (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id AND like_type = 'dislike') as dislikes,
        (SELECT COUNT(*) FROM posts WHERE parent_post_id = p.id AND is_active = 1) as reply_count
      FROM posts p
      WHERE p.topic_id = ? AND p.is_active = 1 AND p.parent_post_id IS NULL
      ORDER BY p.created_at ASC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    // Get replies for each post
    for (let post of posts) {
      const replies = await dbAll(`
        SELECT 
          p.*,
          (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id AND like_type = 'like') as likes,
          (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = p.id AND like_type = 'dislike') as dislikes
        FROM posts p
        WHERE p.parent_post_id = ? AND p.is_active = 1
        ORDER BY p.created_at ASC
      `, [post.id]);
      post.replies = replies;
    }

    res.json({
      topic,
      posts,
      pagination: {
        page,
        limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting topic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new post (reply)
app.post('/api/forum/topics/:topicId/posts', async (req, res) => {
  try {
    const { topicId } = req.params;
    const { content, mediaLinks, userId, userEmail, userName, parentPostId } = req.body;

    if (!content || !userId || !userEmail || !userName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if topic exists and is not locked
    const topic = await dbGet('SELECT id, is_locked FROM topics WHERE id = ? AND is_active = 1', [topicId]);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    if (topic.is_locked) {
      return res.status(403).json({ error: 'Topic is locked' });
    }

    // If parentPostId is provided, verify it exists and belongs to this topic
    if (parentPostId) {
      const parentPost = await dbGet('SELECT id FROM posts WHERE id = ? AND topic_id = ? AND is_active = 1', [parentPostId, topicId]);
      if (!parentPost) {
        return res.status(404).json({ error: 'Parent post not found' });
      }
    }

    // Insert post
    const result = await dbInsert(
      'INSERT INTO posts (topic_id, parent_post_id, user_id, user_email, user_name, content, media_links) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [topicId, parentPostId || null, userId, userEmail, userName, content, mediaLinks || '']
    );

    // Update topic stats
    await dbRun(
      'UPDATE topics SET reply_count = reply_count + 1, last_post_at = CURRENT_TIMESTAMP WHERE id = ?',
      [topicId]
    );

    res.status(201).json({
      message: 'Post created successfully',
      postId: result.lastID
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/Unlike topic or post
app.post('/api/forum/like', async (req, res) => {
  try {
    const { targetType, targetId, likeType, userId } = req.body;

    if (!targetType || !targetId || !likeType || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['topic', 'post'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    if (!['like', 'dislike'].includes(likeType)) {
      return res.status(400).json({ error: 'Invalid like type' });
    }

    // Check if user already liked/disliked
    const existing = await dbGet(
      'SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
      [userId, targetType, targetId]
    );

    if (existing) {
      if ((existing as any).like_type === likeType) {
        // Remove like/dislike
        await dbRun(
          'DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
          [userId, targetType, targetId]
        );
        res.json({ message: 'Like removed', action: 'removed' });
      } else {
        // Update like type
        await dbRun(
          'UPDATE likes SET like_type = ? WHERE user_id = ? AND target_type = ? AND target_id = ?',
          [likeType, userId, targetType, targetId]
        );
        res.json({ message: 'Like updated', action: 'updated' });
      }
    } else {
      // Insert new like
      await dbRun(
        'INSERT INTO likes (user_id, target_type, target_id, like_type) VALUES (?, ?, ?, ?)',
        [userId, targetType, targetId, likeType]
      );
      res.json({ message: 'Like added', action: 'added' });
    }
  } catch (error) {
    console.error('Error handling like:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get forum stats
app.get('/api/forum/stats', async (req, res) => {
  try {
    const stats = await getForumStats();
    res.json({
      stats,
      onlineUsers: 1 // Placeholder
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top topics (most active today)
app.get('/api/forum/top-topics', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const period = req.query.period as string || 'today'; // today, week, month, all
    
    let dateFilter = '';
    const now = new Date();
    
    switch (period) {
      case 'today':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = `AND t.created_at >= '${startOfDay.toISOString()}'`;
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND t.created_at >= '${weekAgo.toISOString()}'`;
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `AND t.created_at >= '${monthAgo.toISOString()}'`;
        break;
      default:
        dateFilter = '';
    }

    const topTopics = await dbAll(`
      SELECT 
        t.id,
        t.title,
        t.slug,
        t.user_name,
        t.created_at,
        t.views,
        c.name as category_name,
        c.slug as category_slug,
        COUNT(DISTINCT p.id) as reply_count,
        COUNT(CASE WHEN l.like_type = 'like' THEN 1 END) as likes,
        COUNT(CASE WHEN l.like_type = 'dislike' THEN 1 END) as dislikes,
        MAX(COALESCE(p.created_at, t.created_at)) as last_activity
      FROM topics t
      LEFT JOIN posts p ON t.id = p.topic_id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN likes l ON l.target_type = 'topic' AND l.target_id = t.id
      WHERE 1=1 ${dateFilter}
      GROUP BY t.id, t.title, t.slug, t.user_name, t.created_at, t.views, c.name, c.slug
      ORDER BY reply_count DESC, t.views DESC, likes DESC
      LIMIT ?
    `, [limit]);

    res.json({ topTopics });
  } catch (error) {
    console.error('Error getting top topics:', error);
    res.status(500).json({ error: 'Failed to get top topics' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Content: Articles
app.get('/api/content/articles', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const totalRow = await dbGet('SELECT COUNT(*) as total FROM articles WHERE status = "published"') as any;
    const articles = await dbAll(
      `SELECT id, title, slug, substr(content,1,300) as excerpt, cover_image_url, tags, created_at, updated_at
       FROM articles WHERE status = 'published'
       ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]
    );

    res.json({
      articles,
      pagination: { page, limit, total: totalRow.total, pages: Math.ceil(totalRow.total / limit) }
    });
  } catch (error) {
    console.error('Error getting articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/content/articles/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const article = await dbGet(
      isNaN(Number(slugOrId))
        ? 'SELECT * FROM articles WHERE slug = ?'
        : 'SELECT * FROM articles WHERE id = ?',
      [slugOrId]
    );
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json({ article });
  } catch (error) {
    console.error('Error getting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin guard via Firebase ID token; user will configure admin in Firebase custom claims
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const idToken = (req.headers.authorization || '').replace('Bearer ', '');
    if (!idToken) return res.status(401).json({ error: 'Unauthorized' });
    const decoded = await verifyIdToken(idToken);
    if (!(decoded as any).admin) return res.status(403).json({ error: 'Forbidden' });
    (req as any).decodedUser = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/api/content/articles', requireAdmin, async (req, res) => {
  try {
    const { title, content, mediaLinks, coverImageUrl, tags, slug, status } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Missing required fields' });
    const safeSlug = (slug || title).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 120);
    const user = (req as any).decodedUser;
    const result = await dbInsert(
      'INSERT INTO articles (title, slug, content, media_links, cover_image_url, tags, status, author_user_id, author_user_email, author_user_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, safeSlug, content, mediaLinks || '', coverImageUrl || '', tags || '', status || 'published', user.uid, user.email || '', user.name || user.email || '']
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/content/articles/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, mediaLinks, coverImageUrl, tags, slug, status } = req.body;
    const safeSlug = slug ? slug.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 120) : null;
    await dbRun(
      `UPDATE articles SET 
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        media_links = COALESCE(?, media_links),
        cover_image_url = COALESCE(?, cover_image_url),
        tags = COALESCE(?, tags),
        slug = COALESCE(?, slug),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [title, content, mediaLinks, coverImageUrl, tags, safeSlug, status, id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/content/articles/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM articles WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Content: Trainings
app.get('/api/content/trainings', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const totalRow = await dbGet('SELECT COUNT(*) as total FROM trainings WHERE status = "published"') as any;
    const trainings = await dbAll(
      `SELECT id, title, slug, substr(content,1,300) as excerpt, cover_image_url, tags, level, duration_minutes, created_at, updated_at
       FROM trainings WHERE status = 'published'
       ORDER BY created_at DESC LIMIT ? OFFSET ?`, [limit, offset]
    );
    res.json({ trainings, pagination: { page, limit, total: totalRow.total, pages: Math.ceil(totalRow.total / limit) } });
  } catch (error) {
    console.error('Error getting trainings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/content/trainings/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const training = await dbGet(
      isNaN(Number(slugOrId))
        ? 'SELECT * FROM trainings WHERE slug = ?'
        : 'SELECT * FROM trainings WHERE id = ?',
      [slugOrId]
    );
    if (!training) return res.status(404).json({ error: 'Training not found' });
    res.json({ training });
  } catch (error) {
    console.error('Error getting training:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/content/trainings', requireAdmin, async (req, res) => {
  try {
    const { title, content, mediaLinks, coverImageUrl, tags, slug, status, level, durationMinutes } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Missing required fields' });
    const safeSlug = (slug || title).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 120);
    const user = (req as any).decodedUser;
    const result = await dbInsert(
      'INSERT INTO trainings (title, slug, content, media_links, cover_image_url, tags, status, level, duration_minutes, author_user_id, author_user_email, author_user_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, safeSlug, content, mediaLinks || '', coverImageUrl || '', tags || '', status || 'published', level || '', durationMinutes || null, user.uid, user.email || '', user.name || user.email || '']
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    console.error('Error creating training:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/content/trainings/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, mediaLinks, coverImageUrl, tags, slug, status, level, durationMinutes } = req.body;
    const safeSlug = slug ? slug.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 120) : null;
    await dbRun(
      `UPDATE trainings SET 
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        media_links = COALESCE(?, media_links),
        cover_image_url = COALESCE(?, cover_image_url),
        tags = COALESCE(?, tags),
        slug = COALESCE(?, slug),
        status = COALESCE(?, status),
        level = COALESCE(?, level),
        duration_minutes = COALESCE(?, duration_minutes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [title, content, mediaLinks, coverImageUrl, tags, safeSlug, status, level, durationMinutes, id]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating training:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/content/trainings/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM trainings WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting training:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`🚀 Forum server running on http://localhost:${PORT}`);
  console.log(`📝 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  console.log(`💾 Using SQLite database`);
});
