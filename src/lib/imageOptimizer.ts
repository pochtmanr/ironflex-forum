/**
 * Client-side image optimization utility
 * Converts images to AVIF format for better compression and faster loading
 */

export interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1, default 0.8
  format?: 'avif' | 'webp' | 'jpeg';
}

/**
 * Check if browser supports AVIF format
 */
export const supportsAVIF = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // Create a tiny AVIF image to test support
  const avif = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = avif;
  });
};

/**
 * Optimize and convert image to specified format (default AVIF)
 * @param file - The original image file
 * @param options - Optimization options
 * @returns Optimized image as File object
 */
export const optimizeImage = async (
  file: File,
  options: OptimizeOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'avif'
  } = options;

  return new Promise((resolve, reject) => {
    // Check if format is supported
    if (format === 'avif') {
      supportsAVIF().then(supported => {
        if (!supported) {
          console.warn('AVIF not supported, falling back to WebP');
          return optimizeImage(file, { ...options, format: 'webp' })
            .then(resolve)
            .catch(reject);
        }
      });
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to desired format
      const mimeType = format === 'avif' ? 'image/avif' : 
                       format === 'webp' ? 'image/webp' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'));
            return;
          }

          // Create new file with optimized image
          const optimizedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, `.${format}`),
            { type: mimeType }
          );

          console.log(`Image optimized: ${(file.size / 1024).toFixed(2)}KB → ${(optimizedFile.size / 1024).toFixed(2)}KB (${((1 - optimizedFile.size / file.size) * 100).toFixed(1)}% reduction)`);
          
          resolve(optimizedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Optimize multiple images
 * @param files - Array of image files
 * @param options - Optimization options
 * @returns Array of optimized image files
 */
export const optimizeImages = async (
  files: File[],
  options: OptimizeOptions = {}
): Promise<File[]> => {
  const promises = files.map(file => optimizeImage(file, options));
  return Promise.all(promises);
};

/**
 * Check if file is an image
 */
export const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Get image dimensions without loading the full image
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

