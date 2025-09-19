import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS disabled for testing
app.use(cors({
  origin: '*',  // Allow all origins for testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.use(express.json());

// Simple auth endpoint that works with Firebase on the frontend
app.post('/api/auth/login', (req, res) => {
  // This is just a passthrough - actual Firebase auth happens on frontend
  res.json({ 
    message: 'Login handled by Firebase on frontend',
    success: true 
  });
});

app.post('/api/auth/register', (req, res) => {
  // This is just a passthrough - actual Firebase auth happens on frontend
  res.json({ 
    message: 'Registration handled by Firebase on frontend',
    success: true 
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Forum endpoints (mock data for now)
app.get('/api/forum/categories', (req, res) => {
  res.json({
    categories: [
      {
        id: 1,
        name: 'Новости и соревнования',
        description: 'Все новости бодибилдинга, пауэрлифтинга и других видов спорта.',
        slug: 'news',
        topic_count: 0,
        post_count: 0,
        last_activity: null
      },
      {
        id: 2,
        name: 'Новичкам',
        description: 'Раздел для начинающих, содержащий схемы тренировок для новичков',
        slug: 'beginners',
        topic_count: 0,
        post_count: 0,
        last_activity: null
      },
      {
        id: 3,
        name: 'Питание',
        description: 'Все о питании в бодибилдинге, диеты, рецепты',
        slug: 'nutrition',
        topic_count: 0,
        post_count: 0,
        last_activity: null
      },
      {
        id: 4,
        name: 'Спортивное питание',
        description: 'Протеины, гейнеры, аминокислоты, креатин и другие добавки',
        slug: 'sports-nutrition',
        topic_count: 0,
        post_count: 0,
        last_activity: null
      },
      {
        id: 5,
        name: 'Фармакология',
        description: 'Обсуждение фармакологических препаратов в спорте',
        slug: 'pharmacology',
        topic_count: 0,
        post_count: 0,
        last_activity: null
      },
      {
        id: 6,
        name: 'Тренировки',
        description: 'Программы тренировок, методики, техника выполнения упражнений',
        slug: 'training',
        topic_count: 0,
        post_count: 0,
        last_activity: null
      }
    ]
  });
});

app.get('/api/forum/stats', (req, res) => {
  res.json({
    stats: {
      total_users: 0,
      total_topics: 0,
      total_posts: 0,
      latest_username: null
    },
    onlineUsers: 1
  });
});

// Top topics endpoint
app.get('/api/forum/top-topics', (req, res) => {
  res.json({
    topics: []
  });
});

// Topics by category endpoint
app.get('/api/forum/categories/:slug/topics', (req, res) => {
  res.json({
    topics: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
  });
});

// Single topic endpoint
app.get('/api/forum/topics/:id', (req, res) => {
  res.json({
    topic: null,
    posts: []
  });
});

// Create topic endpoint (basic implementation)
app.post('/api/forum/topics', (req, res) => {
  res.json({
    message: 'Topic creation not implemented in simple mode',
    success: false
  });
});

// Create post endpoint (basic implementation)
app.post('/api/forum/topics/:id/posts', (req, res) => {
  res.json({
    message: 'Post creation not implemented in simple mode',
    success: false
  });
});

// Upload endpoint (basic implementation)
app.post('/api/upload/image', (req, res) => {
  res.json({
    message: 'Image upload not implemented in simple mode',
    success: false
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on http://localhost:${PORT}`);
  console.log(`📝 CORS enabled for: ALL ORIGINS (testing mode)`);
});
