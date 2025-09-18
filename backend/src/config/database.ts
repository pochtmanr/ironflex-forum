import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create the connection pool
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ironflex_forum',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Create tables if they don't exist (using the schema from schema.sql)
    const connection = await pool.getConnection();
    
    // Check if categories table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'categories'");
    
    if (!Array.isArray(tables) || tables.length === 0) {
      console.log('📝 Creating database tables...');
      
      // Create categories table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          slug VARCHAR(255) UNIQUE NOT NULL,
          order_index INT DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_slug (slug),
          INDEX idx_order (order_index)
        )
      `);

      // Create topics table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS topics (
          id INT PRIMARY KEY AUTO_INCREMENT,
          category_id INT NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          media_links TEXT DEFAULT '',
          slug VARCHAR(255),
          views INT DEFAULT 0,
          is_pinned BOOLEAN DEFAULT FALSE,
          is_locked BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_post_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reply_count INT DEFAULT 0,
          INDEX idx_category (category_id),
          INDEX idx_user (user_id),
          INDEX idx_created (created_at),
          INDEX idx_last_post (last_post_at),
          FULLTEXT idx_search (title, content)
        )
      `);

      // Create posts table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS posts (
          id INT PRIMARY KEY AUTO_INCREMENT,
          topic_id INT NOT NULL,
          parent_post_id INT DEFAULT NULL,
          user_id VARCHAR(255) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          media_links TEXT DEFAULT '',
          is_edited BOOLEAN DEFAULT FALSE,
          edited_at TIMESTAMP NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_topic (topic_id),
          INDEX idx_user (user_id),
          INDEX idx_created (created_at),
          FULLTEXT idx_content (content),
          FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_post_id) REFERENCES posts(id) ON DELETE CASCADE
        )
      `);

      // Create likes table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS likes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id VARCHAR(255) NOT NULL,
          target_type VARCHAR(20) NOT NULL,
          target_id INT NOT NULL,
          like_type VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_target (user_id, target_type, target_id)
        )
      `);

      // Create articles table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS articles (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE,
          content TEXT NOT NULL,
          media_links TEXT DEFAULT '',
          cover_image_url VARCHAR(500) DEFAULT '',
          tags TEXT DEFAULT '',
          status VARCHAR(20) DEFAULT 'published',
          author_user_id VARCHAR(255),
          author_user_email VARCHAR(255),
          author_user_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create trainings table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS trainings (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE,
          content TEXT NOT NULL,
          media_links TEXT DEFAULT '',
          cover_image_url VARCHAR(500) DEFAULT '',
          tags TEXT DEFAULT '',
          status VARCHAR(20) DEFAULT 'published',
          level VARCHAR(50) DEFAULT '',
          duration_minutes INT DEFAULT NULL,
          author_user_id VARCHAR(255),
          author_user_email VARCHAR(255),
          author_user_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Insert default categories
      const defaultCategories = [
        { name: 'Новости и соревнования', description: 'Все новости бодибилдинга, пауэрлифтинга и других видов спорта.', slug: 'news-competitions', order_index: 1 },
        { name: 'Новичкам', description: 'Раздел для начинающих, содержащий схемы тренировок для новичков', slug: 'beginners', order_index: 2 },
        { name: 'Питание', description: 'Все о питании в бодибилдинге, диеты, рецепты', slug: 'nutrition', order_index: 3 },
        { name: 'Спортивное питание', description: 'Протеины, гейнеры, аминокислоты, креатин и другие добавки', slug: 'sports-nutrition', order_index: 4 },
        { name: 'Фармакология', description: 'Обсуждение фармакологических препаратов в спорте', slug: 'pharmacology', order_index: 5 },
        { name: 'Тренировки', description: 'Программы тренировок, методики, техника выполнения упражнений', slug: 'training', order_index: 6 }
      ];

      for (const category of defaultCategories) {
        await connection.execute(
          'INSERT INTO categories (name, description, slug, order_index) VALUES (?, ?, ?, ?)',
          [category.name, category.description, category.slug, category.order_index]
        );
      }

      console.log('✅ Database tables created successfully');
    } else {
      console.log('✅ Database tables already exist');
    }

    connection.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Initialize database tables
    await initializeDatabase();
    
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};
