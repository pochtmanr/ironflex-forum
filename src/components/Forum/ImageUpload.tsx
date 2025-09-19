import React, { useState, useCallback } from 'react';

interface UploadedImage {
  filename: string;
  url: string;
  size: number;
}

interface ImageUploadProps {
  onImagesUploaded: (imageUrls: string[]) => void;
  maxImages?: number;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImagesUploaded, 
  maxImages = 5,
  className = '' 
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      // Add files to form data
      Array.from(files).slice(0, maxImages).forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch('https://blog.theholylabs.com/api/upload/images', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newImages = result.images as UploadedImage[];
        
        setUploadedImages(prev => [...prev, ...newImages]);
        
        // Convert to full URLs for the parent component
        const imageUrls = newImages.map(img => `https://bucket.theholylabs.com${img.url}`);
        onImagesUploaded(imageUrls);
      } else {
        const error = await response.json();
        console.error('Upload failed:', error);
        alert('Ошибка загрузки изображений: ' + (error.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки изображений');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mt-2">
              {uploading ? 'Загрузка изображений...' : 'Загрузить изображения'}
            </h3>
            <p className="text-sm text-gray-500">
              Перетащите изображения сюда или нажмите для выбора
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Поддерживаются: PNG, JPG, GIF, WEBP (макс. {maxImages} файлов, до 10MB каждый)
            </p>
          </div>
          
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
            disabled={uploading}
          />
          
          <label
            htmlFor="image-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Выбрать файлы
          </label>
        </div>
      </div>

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Загруженные изображения:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`https://bucket.theholylabs.com${image.url}`}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => removeImage(index)}
                    className="opacity-0 group-hover:opacity-100 bg-red-600 text-white rounded-full p-2 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-500 text-center">
                  {formatFileSize(image.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mt-4">
          <div className="bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">Загрузка и обработка изображений...</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
