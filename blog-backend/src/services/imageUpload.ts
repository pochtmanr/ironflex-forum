import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Request, Response } from 'express';

// Configure multer for memory storage (we'll process and save manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Function to generate unique filename
const generateFileName = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}.webp`;
};

// Function to convert and save image as WebP
export const processAndSaveImage = async (
  imageBuffer: Buffer,
  originalName: string
): Promise<{ filename: string; url: string; size: number }> => {
  try {
    const filename = generateFileName();
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'images');
    const filepath = path.join(uploadDir, filename);

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Process image with sharp: resize and convert to WebP
    const processedImage = await sharp(imageBuffer)
      .resize(1200, 1200, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .webp({ 
        quality: 85,
        effort: 4 // Better compression
      })
      .toBuffer();

    // Save processed image
    await fs.writeFile(filepath, processedImage);

    // Generate URL for accessing the image
    const url = `/api/uploads/images/${filename}`;

    return {
      filename,
      url,
      size: processedImage.length
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

// Multer middleware for single image upload
export const uploadSingle = upload.single('image');

// Multer middleware for multiple image uploads
export const uploadMultiple = upload.array('images', 5); // Max 5 images

// Image upload handler
export const handleImageUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const result = await processAndSaveImage(req.file.buffer, req.file.originalname);

    res.json({
      message: 'Image uploaded successfully',
      image: result
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};

// Multiple images upload handler
export const handleMultipleImageUpload = async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const results = await Promise.all(
      req.files.map(file => processAndSaveImage(file.buffer, file.originalname))
    );

    res.json({
      message: 'Images uploaded successfully',
      images: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
};

// Function to delete image file
export const deleteImage = async (filename: string): Promise<void> => {
  try {
    const filepath = path.join(__dirname, '..', '..', 'uploads', 'images', filename);
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error, just log it
  }
};
