import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');

// Create database connection
export const db = new sqlite3.Database(dbPath);

// Promisify database methods for easier async/await usage
export const dbGet = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
export const dbAll = promisify(db.all.bind(db)) as (sql: string, params?: any[]) => Promise<any[]>;
export const dbRun = promisify(db.run.bind(db)) as (sql: string, params?: any[]) => Promise<any>;

// Custom insert function that returns lastID
export const dbInsert = (sql: string, params?: any[]): Promise<{ lastID: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID });
      }
    });
  });
};

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Categories table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        slug TEXT UNIQUE NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Topics table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_name TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        media_links TEXT DEFAULT '',
        slug TEXT,
        views INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT 0,
        is_locked BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_post_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reply_count INTEGER DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Posts table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic_id INTEGER NOT NULL,
        parent_post_id INTEGER DEFAULT NULL,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        user_name TEXT NOT NULL,
        content TEXT NOT NULL,
        media_links TEXT DEFAULT '',
        is_edited BOOLEAN DEFAULT 0,
        edited_at DATETIME NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES topics(id),
        FOREIGN KEY (parent_post_id) REFERENCES posts(id)
      )
    `);

    // Likes table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        target_type TEXT NOT NULL, -- 'topic' or 'post'
        target_id INTEGER NOT NULL,
        like_type TEXT NOT NULL, -- 'like' or 'dislike'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, target_type, target_id)
      )
    `);

    // Insert default categories if they don't exist
    const categoryCount = await dbGet('SELECT COUNT(*) as count FROM categories') as any;
    if (categoryCount.count === 0) {
      const defaultCategories = [
        { name: 'Новости и соревнования', description: 'Все новости бодибилдинга, пауэрлифтинга и других видов спорта.', slug: 'news', order_index: 1 },
        { name: 'Новичкам', description: 'Раздел для начинающих, содержащий схемы тренировок для новичков', slug: 'beginners', order_index: 2 },
        { name: 'Питание', description: 'Все о питании в бодибилдинге, диеты, рецепты', slug: 'nutrition', order_index: 3 },
        { name: 'Спортивное питание', description: 'Протеины, гейнеры, аминокислоты, креатин и другие добавки', slug: 'sports-nutrition', order_index: 4 },
        { name: 'Фармакология', description: 'Обсуждение фармакологических препаратов в спорте', slug: 'pharmacology', order_index: 5 },
        { name: 'Тренировки', description: 'Программы тренировок, методики, техника выполнения упражнений', slug: 'training', order_index: 6 }
      ];

      for (const category of defaultCategories) {
        await dbRun(
          'INSERT INTO categories (name, description, slug, order_index) VALUES (?, ?, ?, ?)',
          [category.name, category.description, category.slug, category.order_index]
        );
      }
    }

    // Add media_links column to existing tables if they don't exist
    try {
      await dbRun('ALTER TABLE topics ADD COLUMN media_links TEXT DEFAULT ""');
      console.log('✅ Added media_links column to topics table');
    } catch (error: any) {
      if (!error.message?.includes('duplicate column name')) {
        console.log('ℹ️ media_links column already exists in topics table');
      }
    }

    try {
      await dbRun('ALTER TABLE posts ADD COLUMN media_links TEXT DEFAULT ""');
      console.log('✅ Added media_links column to posts table');
    } catch (error: any) {
      if (!error.message?.includes('duplicate column name')) {
        console.log('ℹ️ media_links column already exists in posts table');
      }
    }

    // Add parent_post_id column to existing posts table if it doesn't exist
    try {
      await dbRun('ALTER TABLE posts ADD COLUMN parent_post_id INTEGER DEFAULT NULL');
      console.log('✅ Added parent_post_id column to posts table');
    } catch (error: any) {
      if (!error.message?.includes('duplicate column name')) {
        console.log('ℹ️ parent_post_id column already exists in posts table');
      }
    }

    // Articles table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE,
        content TEXT NOT NULL,
        media_links TEXT DEFAULT '',
        cover_image_url TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        status TEXT DEFAULT 'published',
        author_user_id TEXT,
        author_user_email TEXT,
        author_user_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Trainings table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS trainings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        slug TEXT UNIQUE,
        content TEXT NOT NULL,
        media_links TEXT DEFAULT '',
        cover_image_url TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        status TEXT DEFAULT 'published',
        level TEXT DEFAULT '',
        duration_minutes INTEGER DEFAULT NULL,
        author_user_id TEXT,
        author_user_email TEXT,
        author_user_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ SQLite database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Get forum statistics
export const getForumStats = async () => {
  try {
    const topics = await dbGet('SELECT COUNT(*) as count FROM topics WHERE is_active = 1') as any;
    const posts = await dbGet('SELECT COUNT(*) as count FROM posts WHERE is_active = 1') as any;
    const users = await dbGet('SELECT COUNT(DISTINCT user_id) as count FROM topics') as any;

    return {
      total_topics: topics.count,
      total_posts: posts.count,
      total_users: users.count,
      latest_username: null
    };
  } catch (error) {
    console.error('Error getting forum stats:', error);
    return {
      total_topics: 0,
      total_posts: 0,
      total_users: 0,
      latest_username: null
    };
  }
};
