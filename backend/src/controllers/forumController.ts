import { Request, Response } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const [categories] = await pool.execute(`
      SELECT 
        c.*,
        COUNT(DISTINCT t.id) as topic_count,
        COUNT(DISTINCT p.id) as post_count,
        MAX(COALESCE(p.created_at, t.created_at)) as last_activity
      FROM categories c
      LEFT JOIN topics t ON c.id = t.category_id AND t.is_active = TRUE
      LEFT JOIN posts p ON t.id = p.topic_id AND p.is_active = TRUE
      WHERE c.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.order_index ASC
    `);

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single category with topics
export const getCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get category info
    const [categoryRows] = await pool.execute(
      'SELECT * FROM categories WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (!Array.isArray(categoryRows) || categoryRows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = categoryRows[0];

    // Get topics count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM topics WHERE category_id = ? AND is_active = TRUE',
      [id]
    );
    const totalTopics = (countResult as any)[0].total;

    // Get topics with pagination
    const [topics] = await pool.execute(`
      SELECT 
        t.*,
        u.username as author_username,
        u.display_name as author_display_name,
        last_user.username as last_post_username,
        last_user.display_name as last_post_display_name
      FROM topics t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN users last_user ON t.last_post_user_id = last_user.id
      WHERE t.category_id = ? AND t.is_active = TRUE
      ORDER BY t.is_pinned DESC, t.last_post_at DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    res.json({
      category,
      topics,
      pagination: {
        page,
        limit,
        total: totalTopics,
        pages: Math.ceil(totalTopics / limit)
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new topic
export const createTopic = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { categoryId, title, content } = req.body;
    const userId = req.user!.id;

    // Check if category exists
    const [categoryRows] = await pool.execute(
      'SELECT id FROM categories WHERE id = ? AND is_active = TRUE',
      [categoryId]
    );

    if (!Array.isArray(categoryRows) || categoryRows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create slug from title
    const slug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // Insert topic
    const [result] = await pool.execute(
      'INSERT INTO topics (category_id, user_id, title, content, slug) VALUES (?, ?, ?, ?, ?)',
      [categoryId, userId, title, content, slug]
    );

    const topicId = (result as any).insertId;

    res.status(201).json({
      message: 'Topic created successfully',
      topicId
    });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single topic with posts
export const getTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Increment view count
    await pool.execute(
      'UPDATE topics SET views = views + 1 WHERE id = ?',
      [id]
    );

    // Get topic info
    const [topicRows] = await pool.execute(`
      SELECT 
        t.*,
        u.username as author_username,
        u.display_name as author_display_name,
        u.avatar_url as author_avatar,
        c.name as category_name,
        c.slug as category_slug
      FROM topics t
      JOIN users u ON t.user_id = u.id
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ? AND t.is_active = TRUE
    `, [id]);

    if (!Array.isArray(topicRows) || topicRows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const topic = topicRows[0];

    // Get posts count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM posts WHERE topic_id = ? AND is_active = TRUE',
      [id]
    );
    const totalPosts = (countResult as any)[0].total;

    // Get posts with pagination
    const [posts] = await pool.execute(`
      SELECT 
        p.*,
        u.username,
        u.display_name,
        u.avatar_url,
        u.created_at as user_created_at,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as user_post_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.topic_id = ? AND p.is_active = TRUE
      ORDER BY p.created_at ASC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    res.json({
      topic,
      posts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        pages: Math.ceil(totalPosts / limit)
      }
    });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new post (reply)
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topicId } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    // Check if topic exists and is not locked
    const [topicRows] = await pool.execute(
      'SELECT id, is_locked FROM topics WHERE id = ? AND is_active = TRUE',
      [topicId]
    );

    if (!Array.isArray(topicRows) || topicRows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const topic = topicRows[0] as any;
    if (topic.is_locked) {
      return res.status(403).json({ error: 'Topic is locked' });
    }

    // Insert post
    const [result] = await pool.execute(
      'INSERT INTO posts (topic_id, user_id, content) VALUES (?, ?, ?)',
      [topicId, userId, content]
    );

    const postId = (result as any).insertId;

    res.status(201).json({
      message: 'Post created successfully',
      postId
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search topics and posts
export const search = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    if (!q || typeof q !== 'string' || q.trim().length < 3) {
      return res.status(400).json({ error: 'Search query must be at least 3 characters' });
    }

    const searchTerm = `%${q.trim()}%`;

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM (
        SELECT t.id FROM topics t
        WHERE (t.title LIKE ? OR t.content LIKE ?) AND t.is_active = TRUE
        UNION DISTINCT
        SELECT t.id FROM posts p
        JOIN topics t ON p.topic_id = t.id
        WHERE p.content LIKE ? AND p.is_active = TRUE AND t.is_active = TRUE
      ) as results
    `, [searchTerm, searchTerm, searchTerm]);

    const total = (countResult as any)[0].total;

    // Get search results
    const [results] = await pool.execute(`
      SELECT DISTINCT
        t.id,
        t.title,
        t.created_at,
        t.reply_count,
        t.views,
        u.username as author_username,
        c.name as category_name,
        SUBSTRING(
          CASE 
            WHEN t.title LIKE ? THEN t.title
            WHEN t.content LIKE ? THEN t.content
            ELSE p.content
          END, 1, 200
        ) as excerpt
      FROM topics t
      JOIN users u ON t.user_id = u.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN posts p ON t.id = p.topic_id AND p.content LIKE ?
      WHERE (
        (t.title LIKE ? OR t.content LIKE ?) 
        OR p.content LIKE ?
      ) 
      AND t.is_active = TRUE
      AND (p.is_active = TRUE OR p.id IS NULL)
      ORDER BY t.last_post_at DESC
      LIMIT ? OFFSET ?
    `, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limit, offset]);

    res.json({
      results,
      query: q,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get forum statistics
export const getStats = async (req: Request, res: Response) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        total_users,
        total_topics,
        total_posts,
        (SELECT username FROM users WHERE id = latest_user_id) as latest_username
      FROM forum_stats
      WHERE id = 1
    `);

    const [onlineUsers] = await pool.execute(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_activity
      WHERE last_activity > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    `);

    res.json({
      stats: stats[0],
      onlineUsers: (onlineUsers as any)[0].count
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
