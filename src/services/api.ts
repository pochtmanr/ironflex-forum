// MongoDB API Service
// This file provides API interface for MongoDB backend

// Token management
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// Token refresh function
async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      tokenManager.setTokens(data.accessToken, data.refreshToken);
      return true;
    } else {
      // Refresh token is invalid, clear all tokens
      tokenManager.clearTokens();
      return false;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    tokenManager.clearTokens();
    return false;
  }
}

// API request helper with automatic token refresh
async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (!skipAuth) {
    const token = tokenManager.getAccessToken();
    console.log('API Request - Auth required:', { endpoint, hasToken: !!token });
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('API Request - Added Bearer token to headers');
    } else {
      console.warn('API Request - No access token found in localStorage!');
    }
  }

  // Use current origin for API requests (works both locally and in production)
  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';

  let response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers
  });

  // If we get a 401 and we have auth enabled, try to refresh the token
  if (!response.ok && response.status === 401 && !skipAuth) {
    console.log('API Request - Got 401, attempting token refresh');
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry the request with the new token
      const newToken = tokenManager.getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        console.log('API Request - Retrying with refreshed token');
        response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers
        });
      }
    } else {
      console.error('API Request - Token refresh failed');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// Forum API
export const forumAPI = {
  getCategories: async () => {
    return apiRequest('/forum/categories');
  },

  getCategory: async (id: string, page = 1, limit = 20) => {
    return apiRequest(`/forum/categories/${id}?page=${page}&limit=${limit}`);
  },

  createTopic: async (data: {
    categoryId: string;
    title: string;
    content: string;
    mediaLinks?: string[];
  }) => {
    // Get user data from localStorage (like React app)
    const savedUser = localStorage.getItem('user');
    const userData = savedUser ? JSON.parse(savedUser) : null;
    
    return apiRequest('/forum/topics', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        userData
      })
    }, true); // Skip auth header, we're sending userData directly
  },

  getTopic: async (id: string, page = 1, limit = 20) => {
    return apiRequest(`/forum/topics/${id}?page=${page}&limit=${limit}`);
  },

  deleteTopic: async (topicId: string) => {
    return apiRequest(`/forum/topics/${topicId}`, {
      method: 'DELETE'
    });
  },

  createPost: async (topicId: string, content: string, mediaLinks?: string[]) => {
    // Get user data from localStorage (like React app)
    const savedUser = localStorage.getItem('user');
    const userData = savedUser ? JSON.parse(savedUser) : null;
    
    return apiRequest(`/forum/topics/${topicId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ 
        content, 
        mediaLinks,
        userData 
      })
    }, true); // Skip auth header, we're sending userData directly
  },

  search: async (query: string, page = 1, limit = 20) => {
    return apiRequest(`/forum/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  },

  getStats: async () => {
    return apiRequest('/forum/stats');
  },

  getTopTopics: async (limit = 5, period: 'day' | 'week' | 'all' = 'all') => {
    return apiRequest(`/forum/topics/top?limit=${limit}&period=${period}`);
  },

  likeTopic: async (topicId: string, likeType: 'like' | 'dislike') => {
    return apiRequest(`/forum/topics/${topicId}/like`, {
      method: 'POST',
      body: JSON.stringify({ likeType })
    }, false); // Use auth token
  },

  likePost: async (postId: string, likeType: 'like' | 'dislike') => {
    return apiRequest(`/forum/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ likeType })
    }, false); // Use auth token
  },

  deletePost: async (postId: string) => {
    return apiRequest(`/forum/posts/${postId}`, {
      method: 'DELETE'
    }, false); // Use auth token
  }
};

// File Server API - Use current origin for uploads (works both locally and in production)
const FILE_SERVER_BASE_URL = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';

// Upload API
export const uploadAPI = {
  // Traditional form-data file upload
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${FILE_SERVER_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  // Binary data upload (for API integrations)
  uploadBinary: async (file: File, customFilename?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': file.type
    };
    
    if (customFilename) {
      headers['X-Filename'] = customFilename;
    }

    const response = await fetch(`${FILE_SERVER_BASE_URL}/upload-binary`, {
      method: 'POST',
      headers,
      body: file
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Binary upload failed' }));
      throw new Error(error.error || 'Binary upload failed');
    }

    return response.json();
  },

  // Recording upload (specific for audio recordings)
  uploadRecording: async (file: File) => {
    const response = await fetch(`${FILE_SERVER_BASE_URL}/upload-recording`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type
      },
      body: file
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Recording upload failed' }));
      throw new Error(error.error || 'Recording upload failed');
    }

    return response.json();
  },

  // Multiple files upload
  uploadMultipleFiles: async (files: File[]) => {
    const uploadPromises = files.map(file => uploadAPI.uploadFile(file));
    return Promise.all(uploadPromises);
  },

  // Delete file
  deleteFile: async (filename: string) => {
    const response = await fetch(`${FILE_SERVER_BASE_URL}/api/files/${filename}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Delete failed' }));
      throw new Error(error.error || 'Delete failed');
    }

    return response.json();
  },

  // List all files
  getFiles: async () => {
    const response = await fetch(`${FILE_SERVER_BASE_URL}/api/files`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to list files' }));
      throw new Error(error.error || 'Failed to list files');
    }

    return response.json();
  },

  // Get storage statistics
  getStorageStats: async () => {
    const response = await fetch(`${FILE_SERVER_BASE_URL}/api/storage-stats`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get storage stats' }));
      throw new Error(error.error || 'Failed to get storage stats');
    }

    return response.json();
  },

  // Health check
  healthCheck: async () => {
    const response = await fetch(`${FILE_SERVER_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error('File server is not healthy');
    }

    return response.json();
  },

  // Get file URL (helper function)
  getFileUrl: (filename: string) => {
    return `${FILE_SERVER_BASE_URL}/uploads/${filename}`;
  }
};

// Auth API
export const authAPI = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }, true);
    
    const authResponse = response as { accessToken: string; refreshToken: string; user: unknown };
    tokenManager.setTokens(authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
  },

  login: async (emailOrUsername: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password })
    }, true);
    
    const authResponse = response as { accessToken: string; refreshToken: string; user: unknown };
    tokenManager.setTokens(authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST'
      });
    } finally {
      tokenManager.clearTokens();
    }
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  refresh: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    }, true);
    
    const authResponse = response as { accessToken: string; refreshToken: string; user: unknown };
    tokenManager.setTokens(authResponse.accessToken, authResponse.refreshToken);
    return authResponse;
  }
};

// Content API (for articles and trainings)
export const contentAPI = {
  getArticles: async (page = 1, limit = 20) => {
    const response = await fetch(`/api/content/articles?page=${page}&limit=${limit}`);
    if (!response.ok) {
      console.error('Failed to fetch articles:', response.statusText);
      return { articles: [], pagination: { page, limit, total: 0, pages: 0 } };
    }
    return response.json();
  },
  getArticle: async (slug: string) => {
    const response = await fetch(`/api/content/articles/${slug}`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  },
  getArticleBySlug: async (slug: string) => {
    const response = await fetch(`/api/content/articles/${slug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch article');
    }
    return response.json();
  },
  createArticleComment: async (articleId: string, content: string) => {
    return apiRequest(`/content/articles/${articleId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },
  getTrainings: async (page = 1, limit = 20) => {
    const response = await fetch(`/api/content/trainings?page=${page}&limit=${limit}`);
    if (!response.ok) {
      console.error('Failed to fetch trainings:', response.statusText);
      return { trainings: [], pagination: { page, limit, total: 0, pages: 0 } };
    }
    return response.json();
  },
  getTraining: async (slug: string) => {
    const response = await fetch(`/api/content/trainings/${slug}`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  },
  getTrainingBySlug: async (slug: string) => {
    const response = await fetch(`/api/content/trainings/${slug}`);
    if (!response.ok) {
      throw new Error('Failed to fetch training');
    }
    return response.json();
  },
  createTrainingComment: async (trainingId: string, content: string) => {
    return apiRequest(`/content/trainings/${trainingId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },
  // Use forumAPI for category functionality
  getCategory: async (categoryId: string, page = 1, limit = 20) => {
    return forumAPI.getCategory(categoryId, page, limit);
  }
};
