import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All upload routes require authentication
router.post(
  '/single',
  authenticateToken,
  uploadController.upload.single('file'),
  uploadController.uploadFile
);

router.post(
  '/multiple',
  authenticateToken,
  uploadController.upload.array('files', 10),
  uploadController.uploadMultipleFiles
);

router.delete('/:id', authenticateToken, uploadController.deleteFile);
router.get('/my-files', authenticateToken, uploadController.getUserAttachments);

export default router;
