import React, { useState, useEffect } from 'react';
import { uploadAPI } from '../../services/api';

interface FileInfo {
  filename: string;
  size: number;
  modified: number;
  url: string;
}

interface FileManagerProps {
  onFileSelect?: (fileUrl: string, filename: string) => void;
  showDeleteButton?: boolean;
  refreshTrigger?: number; // External trigger to refresh the file list
}

const FileManager: React.FC<FileManagerProps> = ({
  onFileSelect,
  showDeleteButton = true,
  refreshTrigger
}) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await uploadAPI.getFiles();
      setFiles(response.files || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      await uploadAPI.deleteFile(filename);
      setFiles(files.filter(file => file.filename !== filename));
      if (selectedFile === filename) {
        setSelectedFile(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      alert(errorMessage);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return '🖼️';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
        return '🎥';
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'aac':
        return '🎵';
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'zip':
      case 'rar':
      case '7z':
        return '📦';
      default:
        return '📁';
    }
  };

  if (loading) {
    return (
      <div className="file-manager">
        <div className="file-manager-header">
          <h3>Files</h3>
        </div>
        <div className="file-list-loading">
          <div className="loading-spinner"></div>
          <p>Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-manager">
        <div className="file-manager-header">
          <h3>Files</h3>
          <button onClick={loadFiles} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
        <div className="file-list-error">
          <p>❌ {error}</p>
          <button onClick={loadFiles} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <h3>Files ({files.length})</h3>
        <button onClick={loadFiles} className="refresh-button">
          🔄 Refresh
        </button>
      </div>
      
      {files.length === 0 ? (
        <div className="file-list-empty">
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <div
              key={file.filename}
              className={`file-item ${selectedFile === file.filename ? 'selected' : ''}`}
              onClick={() => {
                setSelectedFile(file.filename);
                onFileSelect?.(file.url, file.filename);
              }}
            >
              <div className="file-icon">
                {getFileIcon(file.filename)}
              </div>
              
              <div className="file-info">
                <div className="file-name" title={file.filename}>
                  {file.filename}
                </div>
                <div className="file-details">
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  <span className="file-date">{formatDate(file.modified)}</span>
                </div>
              </div>
              
              <div className="file-actions">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  🔗
                </a>
                {showDeleteButton && (
                  <button
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.filename);
                    }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileManager;
