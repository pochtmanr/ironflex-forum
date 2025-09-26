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

// API request helper
async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (!skipAuth) {
    const token = tokenManager.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

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
    return apiRequest('/forum/topics', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getTopic: async (id: string, page = 1, limit = 20) => {
    return apiRequest(`/forum/topics/${id}?page=${page}&limit=${limit}`);
  },

  createPost: async (topicId: string, content: string, mediaLinks?: string[]) => {
    return apiRequest(`/forum/topics/${topicId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ content, mediaLinks })
    });
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
    });
  },

  likePost: async (postId: string, likeType: 'like' | 'dislike') => {
    return apiRequest(`/forum/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ likeType })
    });
  }
};

// Upload API
export const uploadAPI = {
  uploadFile: async (file: File, data?: { topicId?: number; postId?: number }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data?.topicId) formData.append('topicId', data.topicId.toString());
    if (data?.postId) formData.append('postId', data.postId.toString());

    const token = tokenManager.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/upload/single', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  uploadMultipleFiles: async (files: File[], data?: { topicId?: number; postId?: number }) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (data?.topicId) formData.append('topicId', data.topicId.toString());
    if (data?.postId) formData.append('postId', data.postId.toString());

    const token = tokenManager.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/upload/multiple', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  deleteFile: async (id: string) => {
    return apiRequest(`/upload/${id}`, {
      method: 'DELETE'
    });
  },

  getMyFiles: async (page = 1, limit = 20) => {
    return apiRequest(`/upload/my-files?page=${page}&limit=${limit}`);
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
    
    tokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  login: async (emailOrUsername: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password })
    }, true);
    
    tokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
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
  }
};

// Content API (for articles and trainings) - placeholder for future implementation
export const contentAPI = {
  getArticles: async (page = 1, limit = 20) => {
    return { articles: [], pagination: { page, limit, total: 0, pages: 0 } };
  },
  getArticle: async (slugOrId: string) => {
    return null;
  },
  getTrainings: async (page = 1, limit = 20) => {
    return { trainings: [], pagination: { page, limit, total: 0, pages: 0 } };
  },
  getTraining: async (slugOrId: string) => {
    return null;
  },
  // Use forumAPI for category functionality
  getCategory: async (categoryId: string, page = 1, limit = 20) => {
    return forumAPI.getCategory(categoryId, page, limit);
  }
};
