const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://blog.theholylabs.com/api';

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  // Handle token refresh
  if (response.status === 401 && !skipAuth) {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshResponse.ok) {
          const { accessToken, refreshToken: newRefreshToken } = await refreshResponse.json();
          tokenManager.setTokens(accessToken, newRefreshToken);

          // Retry original request
          headers['Authorization'] = `Bearer ${accessToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
          });
          
          if (!retryResponse.ok) {
            throw new Error(`API Error: ${retryResponse.statusText}`);
          }
          
          return retryResponse.json();
        }
      } catch (error) {
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API Error: ${response.statusText}`);
  }

  return response.json();
}

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
    const refreshToken = tokenManager.getRefreshToken();
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
    } finally {
      tokenManager.clearTokens();
    }
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  }
};

// Forum API
export const forumAPI = {
  getCategories: async () => {
    return apiRequest('/forum/categories');
  },

  getCategory: async (id: string, page = 1, limit = 20) => {
    return apiRequest(`/forum/categories/${id}?page=${page}&limit=${limit}`);
  },

  createTopic: async (data: {
    categoryId: number;
    title: string;
    content: string;
  }) => {
    return apiRequest('/forum/topics', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getTopic: async (id: string, page = 1, limit = 20) => {
    return apiRequest(`/forum/topics/${id}?page=${page}&limit=${limit}`);
  },

  createPost: async (topicId: string, content: string) => {
    return apiRequest(`/forum/topics/${topicId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  search: async (query: string, page = 1, limit = 20) => {
    return apiRequest(`/forum/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  },

  getStats: async () => {
    return apiRequest('/forum/stats');
  },

  getTopTopics: async (limit = 5, period = 'today') => {
    return apiRequest(`/forum/top-topics?limit=${limit}&period=${period}`);
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
    const response = await fetch(`${API_BASE_URL}/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  },

  uploadMultipleFiles: async (files: File[], data?: { topicId?: number; postId?: number }) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (data?.topicId) formData.append('topicId', data.topicId.toString());
    if (data?.postId) formData.append('postId', data.postId.toString());

    const token = tokenManager.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
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

// Content API
export const contentAPI = {
  // Public
  getArticles: async (page = 1, limit = 20) => {
    return apiRequest(`/content/articles?page=${page}&limit=${limit}`);
  },
  getArticle: async (slugOrId: string) => {
    return apiRequest(`/content/articles/${slugOrId}`);
  },
  getTrainings: async (page = 1, limit = 20) => {
    return apiRequest(`/content/trainings?page=${page}&limit=${limit}`);
  },
  getTraining: async (slugOrId: string) => {
    return apiRequest(`/content/trainings/${slugOrId}`);
  },

  // Admin (requires Firebase ID token as accessToken)
  createArticle: async (data: { title: string; content: string; mediaLinks?: string; coverImageUrl?: string; tags?: string; slug?: string; status?: string; }) => {
    return apiRequest('/content/articles', { method: 'POST', body: JSON.stringify(data) });
  },
  updateArticle: async (id: number, data: Partial<{ title: string; content: string; mediaLinks: string; coverImageUrl: string; tags: string; slug: string; status: string; }>) => {
    return apiRequest(`/content/articles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteArticle: async (id: number) => {
    return apiRequest(`/content/articles/${id}`, { method: 'DELETE' });
  },

  createTraining: async (data: { title: string; content: string; mediaLinks?: string; coverImageUrl?: string; tags?: string; slug?: string; status?: string; level?: string; durationMinutes?: number | null; }) => {
    return apiRequest('/content/trainings', { method: 'POST', body: JSON.stringify(data) });
  },
  updateTraining: async (id: number, data: Partial<{ title: string; content: string; mediaLinks: string; coverImageUrl: string; tags: string; slug: string; status: string; level: string; durationMinutes: number | null; }>) => {
    return apiRequest(`/content/trainings/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  deleteTraining: async (id: number) => {
    return apiRequest(`/content/trainings/${id}`, { method: 'DELETE' });
  }
};
