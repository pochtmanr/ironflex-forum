import os
import time
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Configure logging
logging.basicConfig(level=logging.INFO)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Ensure the 'uploads' directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "fileserver"}), 200

@app.route('/upload', methods=['POST'])
def upload_file():
    """Traditional form-data file upload"""
    app.logger.info("Received file upload request")
    
    if 'file' not in request.files:
        app.logger.error("No file part in request")
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        app.logger.error("No selected file")
        return jsonify({"error": "No selected file"}), 400

    # Secure the filename and save the file
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    try:
        file.save(filepath)
        app.logger.info(f"File saved at {filepath}")
    except Exception as e:
        app.logger.error(f"Error saving file: {str(e)}")
        return jsonify({"error": "File upload failed"}), 500

    # Construct the file URL for internal Docker container
    file_url = f"http://fileserver:3001/uploads/{filename}"
    
    return jsonify({
        "message": "File uploaded successfully",
        "file_url": file_url,
        "filename": filename
    }), 200

@app.route('/upload-binary', methods=['POST'])
def upload_binary():
    """Binary data upload endpoint (for n8n and API integrations)"""
    app.logger.info("Received binary upload request")
    app.logger.info(f"Content-Type: {request.headers.get('Content-Type', 'None')}")
    app.logger.info(f"Content-Length: {request.headers.get('Content-Length', 'None')}")
    app.logger.info(f"X-Filename: {request.headers.get('X-Filename', 'None')}")
    app.logger.info(f"Request data length: {len(request.data) if request.data else 0}")
    app.logger.info(f"Request form data: {dict(request.form)}")
    app.logger.info(f"Request files: {dict(request.files)}")
    
    if not request.data:
        app.logger.error("No binary data in request")
        return jsonify({"error": "No binary data"}), 400
        
    # Use filename from header if provided, otherwise generate one
    custom_filename = request.headers.get('X-Filename')
    if custom_filename:
        filename = secure_filename(custom_filename)
        app.logger.info(f"Using custom filename: {filename}")
    else:
        # Generate a filename based on timestamp and content type
        timestamp = int(time.time())
        
        # Determine file extension from content type
        content_type = request.headers.get('Content-Type', '')
        if 'audio/mpeg' in content_type or 'audio/mp3' in content_type:
            extension = 'mp3'
        elif 'audio/wav' in content_type:
            extension = 'wav'
        elif 'audio' in content_type:
            extension = 'audio'
        elif 'image/jpeg' in content_type:
            extension = 'jpg'
        elif 'image/png' in content_type:
            extension = 'png'
        elif 'image' in content_type:
            extension = 'img'
        elif 'video/mp4' in content_type:
            extension = 'mp4'
        elif 'video' in content_type:
            extension = 'video'
        elif 'application/pdf' in content_type:
            extension = 'pdf'
        elif 'text/plain' in content_type:
            extension = 'txt'
        else:
            extension = 'bin'
            
        filename = f"upload_{timestamp}.{extension}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    try:
        with open(filepath, 'wb') as f:
            f.write(request.data)
        app.logger.info(f"Binary file saved at {filepath}")
    except Exception as e:
        app.logger.error(f"Error saving binary file: {str(e)}")
        return jsonify({"error": "File upload failed"}), 500

    # Construct the file URL for internal Docker container
    file_url = f"http://fileserver:3001/uploads/{filename}"
    
    return jsonify({
        "message": "File uploaded successfully",
        "file_url": file_url,
        "filename": filename
    }), 200

@app.route('/upload-recording', methods=['POST'])
def upload_recording():
    """Specific endpoint for recording uploads (from n8n)"""
    app.logger.info("Received recording upload request from n8n")
    
    if not request.data:
        app.logger.error("No binary data in request")
        return jsonify({"error": "No binary data"}), 400
        
    # Generate a filename based on timestamp
    timestamp = int(time.time())
    
    # Determine file extension from content type
    content_type = request.headers.get('Content-Type', '')
    if 'audio/mpeg' in content_type or 'audio/mp3' in content_type:
        extension = 'mp3'
    elif 'audio' in content_type:
        extension = 'audio'
    else:
        extension = 'mp3'  # Default for recordings
        
    filename = f"recording_{timestamp}.{extension}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    try:
        with open(filepath, 'wb') as f:
            f.write(request.data)
        app.logger.info(f"Recording saved at {filepath}")
    except Exception as e:
        app.logger.error(f"Error saving recording: {str(e)}")
        return jsonify({"error": "Recording upload failed"}), 500

    # Construct the file URL for internal Docker container
    file_url = f"http://fileserver:3001/uploads/{filename}"
    
    return jsonify({
        "message": "Recording uploaded successfully",
        "file_url": file_url,
        "filename": filename
    }), 200

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files"""
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

@app.route('/api/files', methods=['GET'])
def list_files():
    """List all uploaded files"""
    try:
        files = []
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.isfile(filepath):
                stat = os.stat(filepath)
                files.append({
                    "filename": filename,
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "url": f"https://bucket.theholylabs.com/uploads/{filename}"
                })
        
        files.sort(key=lambda x: x['modified'], reverse=True)
        return jsonify({"files": files}), 200
        
    except Exception as e:
        app.logger.error(f"Error listing files: {str(e)}")
        return jsonify({"error": "Failed to list files"}), 500

@app.route('/api/files/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Delete a specific file"""
    try:
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
        
        if not os.path.exists(filepath):
            return jsonify({"error": "File not found"}), 404
        
        os.remove(filepath)
        app.logger.info(f"File deleted: {filename}")
        
        return jsonify({"message": f"File {filename} deleted successfully"}), 200
        
    except Exception as e:
        app.logger.error(f"Error deleting file {filename}: {str(e)}")
        return jsonify({"error": "Failed to delete file"}), 500

@app.route('/api/storage-stats', methods=['GET'])
def storage_stats():
    """Get storage usage statistics"""
    try:
        total_size = 0
        file_count = 0
        
        for filename in os.listdir(app.config['UPLOAD_FOLDER']):
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.isfile(filepath):
                total_size += os.path.getsize(filepath)
                file_count += 1
        
        # Get disk usage
        disk_usage = os.statvfs(app.config['UPLOAD_FOLDER'])
        disk_total = disk_usage.f_frsize * disk_usage.f_blocks
        disk_free = disk_usage.f_frsize * disk_usage.f_available
        disk_used = disk_total - disk_free
        
        return jsonify({
            "files": {
                "count": file_count,
                "total_size": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2)
            },
            "disk": {
                "total": disk_total,
                "used": disk_used,
                "free": disk_free,
                "usage_percent": round((disk_used / disk_total) * 100, 2)
            }
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting storage stats: {str(e)}")
        return jsonify({"error": "Failed to get storage statistics"}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=False) 