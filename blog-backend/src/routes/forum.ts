import { Router } from 'express';
import * as forumController from '../controllers/forumController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateCreateTopic, validateCreatePost } from '../middleware/validation';

const router = Router();

// Public routes (with optional auth for user-specific data)
router.get('/categories', optionalAuth, forumController.getCategories);
router.get('/categories/:id', optionalAuth, forumController.getCategory);
router.get('/topics/:id', optionalAuth, forumController.getTopic);
router.get('/search', optionalAuth, forumController.search);
router.get('/stats', forumController.getStats);

// Protected routes
router.post('/topics', authenticateToken, validateCreateTopic, forumController.createTopic);
router.post('/topics/:topicId/posts', authenticateToken, validateCreatePost, forumController.createPost);

export default router;
