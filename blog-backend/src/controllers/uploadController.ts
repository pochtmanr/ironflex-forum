import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../config/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req: AuthRequest, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const userDir = path.join(uploadDir, req.user!.id.toString());
    
    try {
      await fs.mkdir(userDir, { recursive: true });
      cb(null, userDir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, ZIP files, and text files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  }
});

// Upload single file
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { topicId, postId } = req.body;
    const userId = req.user!.id;
    const file = req.file;

    // Generate public URL
    const publicUrl = `/uploads/${userId}/${file.filename}`;

    // Save file info to database
    const [result] = await pool.execute(
      `INSERT INTO attachments (user_id, topic_id, post_id, filename, original_name, mime_type, size, url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        topicId || null,
        postId || null,
        file.filename,
        file.originalname,
        file.mimetype,
        file.size,
        publicUrl
      ]
    );

    const attachmentId = (result as any).insertId;

    res.json({
      message: 'File uploaded successfully',
      attachment: {
        id: attachmentId,
        url: publicUrl,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { topicId, postId } = req.body;
    const userId = req.user!.id;
    const uploadedFiles = [];

    for (const file of req.files) {
      const publicUrl = `/uploads/${userId}/${file.filename}`;

      const [result] = await pool.execute(
        `INSERT INTO attachments (user_id, topic_id, post_id, filename, original_name, mime_type, size, url) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          topicId || null,
          postId || null,
          file.filename,
          file.originalname,
          file.mimetype,
          file.size,
          publicUrl
        ]
      );

      uploadedFiles.push({
        id: (result as any).insertId,
        url: publicUrl,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      });
    }

    res.json({
      message: 'Files uploaded successfully',
      attachments: uploadedFiles
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Files upload failed' });
  }
};

// Delete file
export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Get file info
    const [files] = await pool.execute(
      'SELECT * FROM attachments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[0] as any;

    // Delete physical file
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', userId.toString(), file.filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }

    // Delete from database
    await pool.execute('DELETE FROM attachments WHERE id = ?', [id]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

// Get user's attachments
export const getUserAttachments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM attachments WHERE user_id = ?',
      [userId]
    );
    const total = (countResult as any)[0].total;

    const [attachments] = await pool.execute(
      `SELECT * FROM attachments 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      attachments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user attachments error:', error);
    res.status(500).json({ error: 'Failed to get attachments' });
  }
};
