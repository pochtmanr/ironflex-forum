import React, { useState, useRef } from 'react';
import { uploadAPI } from '../../services/api';

interface FileUploadProps {
  onUploadSuccess?: (fileUrl: string, filename: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  uploadType?: 'form' | 'binary' | 'recording';
  customFilename?: string;
}

interface UploadedFile {
  filename: string;
  file_url: string;
  size?: number;
  modified?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  accept = "*/*",
  maxSize = 100, // 100MB default
  multiple = false,
  uploadType = 'form',
  customFilename
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type if accept is specified
    if (accept !== "*/*") {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      const isAccepted = acceptedTypes.some(type => 
        type.startsWith('.') ? fileExtension === type : mimeType.includes(type.replace('*', ''))
      );
      
      if (!isAccepted) {
        return `File type not accepted. Allowed types: ${accept}`;
      }
    }

    return null;
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        onUploadError?.(validationError);
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        let result: UploadedFile;
        
        switch (uploadType) {
          case 'binary':
            result = await uploadAPI.uploadBinary(file, customFilename);
            break;
          case 'recording':
            result = await uploadAPI.uploadRecording(file);
            break;
          case 'form':
          default:
            result = await uploadAPI.uploadFile(file, customFilename);
            break;
        }

        // Update progress
        setUploadProgress(((index + 1) / fileArray.length) * 100);
        
        return result;
      });

      const results = await Promise.all(uploadPromises);
      
      // Call success callback for each uploaded file
      results.forEach(result => {
        onUploadSuccess?.(result.file_url, result.filename);
      });

    } catch (error: any) {
      onUploadError?.(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-container">
      <div
        className={`file-upload-area ${dragActive ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {isUploading ? (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="progress-text">Uploading... {Math.round(uploadProgress)}%</p>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <p className="upload-text">
              {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="upload-hint">
              Max size: {maxSize}MB
              {accept !== "*/*" && ` • Accepted: ${accept}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
