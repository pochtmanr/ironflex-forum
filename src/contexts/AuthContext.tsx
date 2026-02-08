'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithVK: (code: string, deviceId: string, accessToken?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Check for user session on component mount (like React app)
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('accessToken');
    
    // Set token state immediately
    setToken(savedToken);
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        setToken(savedToken); // Make sure token is set when user is restored
        setLoading(false);
        return;
      } catch (err) {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        setToken(null);
      }
    }
    
    if (savedToken) {
      // Verify token and get user info
      fetchUserFromToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserFromToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData.user);
        setToken(token); // Ensure token is set when user is fetched
      } else if (response.status === 401) {
        // Token is invalid, try to refresh
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken })
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              localStorage.setItem('accessToken', refreshData.accessToken);
              localStorage.setItem('refreshToken', refreshData.refreshToken);
              localStorage.setItem('user', JSON.stringify(refreshData.user));
              setCurrentUser(refreshData.user);
              setToken(refreshData.accessToken);
            } else {
              // Refresh failed, clear tokens
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } else {
          // No refresh token, clear access token
          localStorage.removeItem('accessToken');
        }
      } else {
        // Other error, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, displayName }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          throw new Error('Пользователь с таким email уже существует');
        }
        if (response.status === 500) {
          throw new Error('Ошибка сервера. Попробуйте позже');
        }
        throw new Error(data.error || 'Ошибка регистрации');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Store user data for persistence (like React app)
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set current user and token
      setCurrentUser(data.user);
      setToken(data.accessToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw error;
    }
  };

  const login = async (emailOrUsername: string, password: string) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Store user data for persistence (like React app)
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set current user and token
      setCurrentUser(data.user);
      setToken(data.accessToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear all localStorage data (like React app)
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('googleCredential');
      
      // Sign out from Google if available
      if (typeof window !== 'undefined' && window.google) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      // Clear current user and token
      setCurrentUser(null);
      setToken(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
    }
  };

  const loginWithVK = async (code: string, deviceId: string, accessToken?: string) => {
    try {
      setError(null);
      const response = await fetch('/api/auth/vk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, deviceId, accessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'VK login failed');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Store user data for persistence
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Set current user and token
      setCurrentUser(data.user);
      setToken(data.accessToken);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'VK login failed';
      setError(errorMessage);
      throw error;
    }
  };

  const clearError = () => setError(null);

  const refreshUser = async () => {
    try {
      const savedToken = localStorage.getItem('accessToken');
      if (!savedToken) {
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(userData.user));
        
        // Update state
        setCurrentUser(userData.user);
      } else {
      }
    } catch (error) {
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    token,
    login,
    register,
    loginWithVK,
    logout,
    clearError,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
