import React, { useState, useRef } from 'react';
import { uploadAPI } from '../../services/api';
import './FileUploadWithPreview.css';

interface FileUploadWithPreviewProps {
  onUploadSuccess?: (fileUrl: string, filename: string) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  uploadType?: 'form' | 'binary' | 'recording';
  customFilename?: string;
  showPreview?: boolean;
}

interface FilePreview {
  file: File;
  preview: string;
  id: string;
}

interface UploadingFile {
  id: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  fileUrl?: string;
}

const FileUploadWithPreview: React.FC<FileUploadWithPreviewProps> = ({
  onUploadSuccess,
  onUploadError,
  accept = "*/*",
  maxSize = 100,
  multiple = false,
  uploadType = 'form',
  customFilename,
  showPreview = true
}) => {
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

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

  const createFilePreview = (file: File): Promise<FilePreview> => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substr(2, 9);
      let preview = '';

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview = e.target?.result as string;
          resolve({ file, preview, id });
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        preview = url;
        resolve({ file, preview, id });
      } else {
        // For other file types, create a generic preview
        preview = getFileIcon(file.name);
        resolve({ file, preview, id });
      }
    });
  };

  const getFileIcon = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'zip':
      case 'rar':
      case '7z': return '📦';
      case 'mp3':
      case 'wav':
      case 'flac': return '🎵';
      case 'mp4':
      case 'avi':
      case 'mov': return '🎥';
      default: return '📁';
    }
  };

  const handleFileSelection = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        onUploadError?.(validationError);
        return;
      }
    }

    // Create previews
    if (showPreview) {
      const previews = await Promise.all(fileArray.map(createFilePreview));
      setFilePreviews(prev => [...prev, ...previews]);
    }

    // Start upload process
    await uploadFiles(fileArray);
  };

  const uploadFiles = async (files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      const id = Math.random().toString(36).substr(2, 9);
      
      // Add to uploading files
      setUploadingFiles(prev => [...prev, {
        id,
        filename: file.name,
        progress: 0,
        status: 'uploading'
      }]);

      try {
        let result;
        
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

        // Update status to success
        setUploadingFiles(prev => prev.map(f => 
          f.id === id ? { ...f, status: 'success', progress: 100, fileUrl: result.file_url } : f
        ));

        onUploadSuccess?.(result.file_url, result.filename);
        
        // Remove from previews after successful upload
        setTimeout(() => {
          setFilePreviews(prev => prev.filter(p => p.file !== file));
          setUploadingFiles(prev => prev.filter(f => f.id !== id));
        }, 2000);

      } catch (error: any) {
        // Update status to error
        setUploadingFiles(prev => prev.map(f => 
          f.id === id ? { ...f, status: 'error', error: error.message } : f
        ));
        
        onUploadError?.(error.message || 'Upload failed');
      }
    });

    await Promise.all(uploadPromises);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files);
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

  const removePreview = (id: string) => {
    setFilePreviews(prev => prev.filter(p => p.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="file-upload-with-preview">
      {/* Upload Area */}
      <div
        className={`file-upload-area ${dragActive ? 'drag-active' : ''}`}
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
        
        <div className="upload-content">
          <div className="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <p className="upload-text" style={{ color: '#1f2937' }}>
            {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="upload-hint" style={{ color: '#1f2937' }}>
            Max size: {maxSize}MB
            {accept !== "*/*" && ` • Accepted: ${accept}`}
          </p>
        </div>
      </div>

      {/* File Previews */}
      {showPreview && filePreviews.length > 0 && (
        <div className="file-previews">
          <h4 className="previews-title">Selected Files:</h4>
          <div className="previews-grid">
            {filePreviews.map((preview) => (
              <div key={preview.id} className="file-preview-item">
                <div className="preview-content">
                  {preview.file.type.startsWith('image/') ? (
                    <img 
                      src={preview.preview} 
                      alt={preview.file.name}
                      className="preview-image"
                    />
                  ) : preview.file.type.startsWith('video/') ? (
                    <video 
                      src={preview.preview}
                      className="preview-video"
                      controls
                    />
                  ) : (
                    <div className="preview-icon">
                      {preview.preview}
                    </div>
                  )}
                </div>
                <div className="preview-info">
                  <div className="file-name" title={preview.file.name}>
                    {preview.file.name}
                  </div>
                  <div className="file-size">
                    {formatFileSize(preview.file.size)}
                  </div>
                </div>
                <button
                  onClick={() => removePreview(preview.id)}
                  className="remove-button"
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="upload-progress-section">
          <h4 className="progress-title">Uploading Files:</h4>
          <div className="upload-progress-list">
            {uploadingFiles.map((uploadingFile) => (
              <div key={uploadingFile.id} className="upload-progress-item">
                <div className="progress-info">
                  <div className="progress-filename">{uploadingFile.filename}</div>
                  <div className={`progress-status ${uploadingFile.status}`}>
                    {uploadingFile.status === 'uploading' && 'Uploading...'}
                    {uploadingFile.status === 'success' && '✅ Uploaded successfully!'}
                    {uploadingFile.status === 'error' && `❌ Error: ${uploadingFile.error}`}
                  </div>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${uploadingFile.status}`}
                    style={{ width: `${uploadingFile.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadWithPreview;
