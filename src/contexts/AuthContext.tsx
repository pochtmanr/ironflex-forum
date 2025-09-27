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
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
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

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('accessToken');
    console.log('AuthContext: Checking stored token:', token ? 'Token exists' : 'No token');
    if (token) {
      // Verify token and get user info
      fetchUserFromToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserFromToken = async (token: string) => {
    try {
      console.log('AuthContext: Attempting to verify token with /api/auth/me');
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('AuthContext: /api/auth/me response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('AuthContext: Token valid, user data received');
        setCurrentUser(userData.user);
      } else if (response.status === 401) {
        console.log('AuthContext: Token invalid (401), attempting refresh');
        // Token is invalid, try to refresh
        const refreshToken = localStorage.getItem('refreshToken');
        console.log('AuthContext: Refresh token available:', refreshToken ? 'Yes' : 'No');
        if (refreshToken) {
          try {
            console.log('AuthContext: Attempting token refresh');
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken })
            });

            console.log('AuthContext: Refresh response status:', refreshResponse.status);
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              console.log('AuthContext: Token refresh successful');
              localStorage.setItem('accessToken', refreshData.accessToken);
              localStorage.setItem('refreshToken', refreshData.refreshToken);
              setCurrentUser(refreshData.user);
            } else {
              console.log('AuthContext: Token refresh failed, clearing tokens');
              // Refresh failed, clear tokens
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }
          } catch (refreshError) {
            console.error('AuthContext: Token refresh failed:', refreshError);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } else {
          console.log('AuthContext: No refresh token, clearing access token');
          // No refresh token, clear access token
          localStorage.removeItem('accessToken');
        }
      } else {
        // Other error, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
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
        throw new Error(data.error || 'Registration failed');
      }

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Set current user
      setCurrentUser(data.user);
    } catch (error: any) {
      setError(error.message || 'Registration failed');
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
      
      // Set current user
      setCurrentUser(data.user);
    } catch (error: any) {
      setError(error.message || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear current user
      setCurrentUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
    }
  };

  const clearError = () => setError(null);

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
