import React, { useState } from 'react';
import FileUpload from './FileUpload';
import FileManager from './FileManager';
import { uploadAPI } from '../../services/api';

const FileUploadExample: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<Array<{url: string, filename: string}>>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFile, setSelectedFile] = useState<{url: string, filename: string} | null>(null);

  const handleUploadSuccess = (fileUrl: string, filename: string) => {
    setUploadedFiles(prev => [...prev, { url: fileUrl, filename }]);
    setRefreshTrigger(prev => prev + 1);
    console.log('File uploaded successfully:', { fileUrl, filename });
  };

  const handleUploadError = (error: string) => {
    alert(`Upload failed: ${error}`);
    console.error('Upload error:', error);
  };

  const handleFileSelect = (fileUrl: string, filename: string) => {
    setSelectedFile({ url: fileUrl, filename });
    console.log('File selected:', { fileUrl, filename });
  };

  const handleHealthCheck = async () => {
    try {
      const health = await uploadAPI.healthCheck();
      alert(`File server is healthy: ${JSON.stringify(health)}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`File server health check failed: ${errorMessage}`);
    }
  };

  const handleStorageStats = async () => {
    try {
      const stats = await uploadAPI.getStorageStats();
      alert(`Storage stats: ${JSON.stringify(stats, null, 2)}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to get storage stats: ${errorMessage}`);
    }
  };

  return (
    <div className="file-upload-example">
      <div className="example-header">
        <h2>File Upload System</h2>
        <p>Integration with bucket.theholylabs.com file server</p>
      </div>

      <div className="example-controls">
        <button onClick={handleHealthCheck} className="control-button">
          🏥 Health Check
        </button>
        <button onClick={handleStorageStats} className="control-button">
          📊 Storage Stats
        </button>
      </div>

      <div className="example-sections">
        {/* Image Upload Section */}
        <div className="upload-section">
          <h3>Image Upload</h3>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            accept="image/*"
            maxSize={10}
            uploadType="form"
          />
        </div>

        {/* Audio Upload Section */}
        <div className="upload-section">
          <h3>Audio Recording Upload</h3>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            accept="audio/*"
            maxSize={50}
            uploadType="recording"
          />
        </div>

        {/* Binary Upload Section */}
        <div className="upload-section">
          <h3>Binary File Upload</h3>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            accept="*/*"
            maxSize={100}
            uploadType="binary"
            multiple={true}
          />
        </div>
      </div>

      {/* File Manager */}
      <div className="file-manager-section">
        <h3>File Manager</h3>
        <FileManager
          onFileSelect={handleFileSelect}
          showDeleteButton={true}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Selected File Display */}
      {selectedFile && (
        <div className="selected-file-section">
          <h3>Selected File</h3>
          <div className="selected-file-info">
            <p><strong>Filename:</strong> {selectedFile.filename}</p>
            <p><strong>URL:</strong> {selectedFile.url}</p>
            <div className="file-preview">
              {selectedFile.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img 
                  src={selectedFile.url} 
                  alt={selectedFile.filename}
                  style={{ maxWidth: '200px', maxHeight: '200px' }}
                />
              ) : (
                <p>Preview not available for this file type</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Uploads */}
      {uploadedFiles.length > 0 && (
        <div className="recent-uploads-section">
          <h3>Recent Uploads</h3>
          <div className="recent-uploads-list">
            {uploadedFiles.slice(-5).map((file, index) => (
              <div key={index} className="recent-upload-item">
                <span className="file-name">{file.filename}</span>
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="file-link"
                >
                  🔗 Open
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadExample;
