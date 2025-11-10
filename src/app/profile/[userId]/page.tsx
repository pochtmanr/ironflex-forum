'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'
import ClientOnly from '@/components/ClientOnly';

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  isAdmin: boolean;
  isVerified: boolean;
  googleId?: string;
  githubId?: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  topicCount: number;
  postCount: number;
  recentTopics: Array<{
    id: string;
    title: string;
    createdAt: string;
    views: number;
    replyCount: number;
    categoryId: string;
  }>;
  recentPosts: Array<{
    id: string;
    content: string;
    createdAt: string;
    topicId: string;
  }>;
}

const UserProfile: React.FC = () => {
  const params = useParams();
  const userId = params.userId as string;
  const { currentUser, token, refreshUser } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states for editing
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    bio: '',
    email: '',
    city: '',
    country: ''
  });
  
  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        displayName: user.displayName || '',
        bio: user.bio || '',
        email: user.email || '',
        city: user.city || '',
        country: user.country || ''
      });
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      console.log('Loading user profile for userId:', userId);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load user profile');
      }
      
      console.log('User profile loaded:', {
        username: data.user?.username,
        photoURL: data.user?.photoURL,
        city: data.user?.city,
        country: data.user?.country
      });
      
      setUser(data.user);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError(error instanceof Error ? error.message : 'Error loading profile');
      setLoading(false);
    }
  };

  const getUserInitials = (user: User) => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccountAge = () => {
    if (!user?.createdAt) return 'Unknown';
    const created = new Date(user.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const canEdit = currentUser?.id === userId;

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  };

  const handlePhotoUpload = async () => {
    const freshToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const tokenToUse = freshToken || token;
    
    if (!selectedFile || !tokenToUse || !canEdit) {
      setModalError('Authentication required. Please log in again.');
      return;
    }

    setUploadingPhoto(true);
    setModalError('');
    setModalMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
        },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      const photoURL = uploadData.url || uploadData.file_url;
      console.log('Photo uploaded successfully:', photoURL);

      let updateResponse = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoURL: photoURL
        }),
      });

      let updateData = await updateResponse.json();

      if (updateResponse.status === 401 && updateData.error === 'Unauthorized') {
        console.log('Token expired, refreshing for photo update...');
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          console.log('Token refreshed, retrying photo profile update...');
          updateResponse = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              photoURL: photoURL
            }),
          });
          
          updateData = await updateResponse.json();
        } else {
          setModalError('Session expired. Please log in again.');
          return;
        }
      }

      if (updateResponse.ok) {
        console.log('Photo profile updated successfully:', updateData.user?.photoURL);
        setModalMessage('Photo uploaded successfully!');
        setSelectedFile(null);
        setPhotoPreview(null);
        
        if (currentUser && currentUser.id === userId && updateData.user) {
          const updatedUser = {
            ...currentUser,
            photoURL: updateData.user.photoURL
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        console.log('Reloading user profile...');
        await loadUserProfile();
        
        setTimeout(() => {
          setModalMessage('');
        }, 2000);
      } else {
        console.error('Failed to update photo profile:', updateData.error);
        setModalError(updateData.error || 'Failed to update profile photo');
      }
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateForm = () => {
    if (formData.username.trim().length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (formData.username.trim().length > 30) {
      return 'Username must be less than 30 characters';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username.trim())) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }
    if (formData.displayName.trim().length > 50) {
      return 'Display name must be less than 50 characters';
    }
    if (formData.bio.trim().length > 500) {
      return 'Bio must be less than 500 characters';
    }
    if (formData.city.trim().length > 100) {
      return 'City name must be less than 100 characters';
    }
    if (formData.country.trim().length > 100) {
      return 'Country name must be less than 100 characters';
    }
    return null;
  };

  const handleSaveProfile = async () => {
    let tokenToUse = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (!tokenToUse || !canEdit) {
      setModalError('Authentication required. Please log in again.');
      return;
    }
    
    const validationError = validateForm();
    if (validationError) {
      setModalError(validationError);
      return;
    }
    
    setModalLoading(true);
    setModalError('');
    setModalMessage('');

    try {
      const updatePayload = {
        username: formData.username.trim(),
        displayName: formData.displayName.trim() || null,
        bio: formData.bio.trim() || null,
        city: formData.city.trim() || null,
        country: formData.country.trim() || null,
        photoURL: user?.photoURL
      };
      
      console.log('Updating profile:', {
        userId,
        hasToken: !!tokenToUse,
        payload: updatePayload
      });
      
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      let data = await response.json();
      
      if (response.status === 401 && data.error === 'Unauthorized') {
        console.log('Token expired, attempting to refresh...');
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          console.log('Token refreshed, retrying profile update...');
          tokenToUse = newToken;
          
          const retryResponse = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
          });
          
          data = await retryResponse.json();
          
          if (retryResponse.ok) {
            setModalMessage('Profile updated successfully!');
            setIsEditing(false);
            
            if (currentUser && currentUser.id === userId && data.user) {
              const updatedUser = {
                ...currentUser,
                username: data.user.username,
                displayName: data.user.displayName,
                photoURL: data.user.photoURL,
                city: data.user.city,
                country: data.user.country
              };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            setTimeout(() => {
              loadUserProfile();
              setModalMessage('');
            }, 2000);
            return;
          } else {
            setModalError(data.error || 'Failed to update profile');
            return;
          }
        } else {
          setModalError('Session expired. Please log in again.');
          return;
        }
      }

      if (response.ok) {
        setModalMessage('Profile updated successfully!');
        setIsEditing(false);
        
        if (currentUser && currentUser.id === userId && data.user) {
          // Refresh user data from the server to update localStorage and context
          await refreshUser();
        }
        
        setTimeout(() => {
          loadUserProfile();
          setModalMessage('');
        }, 1500);
      } else {
        setModalError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setModalError('Network error. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };


  const handleChangePassword = async () => {
    let tokenToUse = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!tokenToUse || !currentPassword || !newPassword || !confirmPassword) {
      setModalError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setModalError('New password must be at least 6 characters');
      return;
    }
    
    setModalLoading(true);
    setModalError('');
    setModalMessage('');

    try {
      let response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      let data = await response.json();

      // If token expired, refresh and retry
      if (response.status === 401) {
        console.log('Token expired, refreshing for password change...', data.error);
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          console.log('Token refreshed, retrying password change...');
          tokenToUse = newToken;
          
          response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          });
          
          data = await response.json();
        } else {
          setModalError('Session expired. Please log in again.');
          return;
        }
      }

      if (response.ok) {
        setModalMessage(data.message || 'Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setModalMessage('');
        }, 3000);
      } else {
        setModalError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setModalError('Network error. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowChangePasswordModal(false);
    setModalError('');
    setModalMessage('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-gray-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-md rounded-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Назад на форум
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* LinkedIn-Style Профильный заголовок */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Profile Info */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-6 relative">
              {/* Фото профиля - Левая сторона */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-30 w-30 rounded-full object-cover bg-white border-4 border-gray-200"
                    />
                  ) : user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.username}
                      className="h-30 w-30 rounded-full object-cover bg-white border-4 border-gray-200"
                    />
                  ) : (
                    <div className="h-30 w-30 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-gray-600 border-4 border-gray-200">
                      {user ? getUserInitials(user) : 'U'}
                    </div>
                  )}
                  
                  {/* Photo Upload Button (Edit Mode) */}
                  {canEdit && isEditing && (
                    <div className="absolute bottom-0 right-0">
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <label 
                        htmlFor="photo-upload"
                        className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm"
                        title="Изменить фото"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </label>
                    </div>
                  )}
                </div>
                
                {/* Upload Photo Controls (when file selected) */}
                {selectedFile && canEdit && isEditing && (
                  <div className="absolute top-0 left-36 bg-white rounded-lg shadow-lg p-3 border border-gray-200 z-10 min-w-max">
                    <p className="text-xs text-gray-600 mb-2">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {uploadingPhoto ? 'Загрузка...' : 'Загрузить'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPhotoPreview(null);
                        }}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300"
                      >
                        Отменить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            
            {/* User Info - Right Side */}
            <div className="flex-1 min-w-0">
              

              {!isEditing && (
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900">
                          {user?.displayName || user?.username}
                        </h1>
                        {/* Online/Offline Status */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          <span className={`h-2 w-2 rounded-full mr-1.5 ${
                            user?.isActive ? 'bg-green-600' : 'bg-gray-600'
                          }`}></span>
                          {user?.isActive ? 'Онлайн' : 'Оффлайн'}
                        </span>
                        {/* Badges */}
                        {user?.isVerified && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Подтвержден
                          </span>
                        )}
                        {user?.isAdmin && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Админ
                          </span>
                        )}
                      </div>
                      {user?.displayName && (
                        <p className="text-gray-600 mt-1">@{user.username}</p>
                      )}
                      {user?.bio && (
                        <p className="mt-3 text-gray-700">{user.bio}</p>
                      )}
                      {(user?.city || user?.country) && (
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {[user.city, user.country].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 text-sm flex-wrap">
                    <div>
                      <span className="font-semibold text-gray-900">{user?.topicCount || 0}</span>
                      <span className="text-gray-600 ml-1">Темы</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{user?.postCount || 0}</span>
                      <span className="text-gray-600 ml-1">Посты</span>
                    </div>
                
                  </div>
                </div>
              )}
              {/* Edit Button - Top Right */}
              {canEdit && !isEditing && (
                <div className="flex justify-start mt-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-gray-500 border-2 border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Изменить
                  </button>
                </div>
              )}
            
              {/* User Info - Edit Mode */}
              {isEditing && (
                <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Имя пользователя</label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-2">@</span>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => handleFormChange('username', e.target.value)}
                      maxLength={30}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{formData.username.length}/30 символов</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Отображаемое имя</label>
                  <input 
                    type="text" 
                    value={formData.displayName}
                    onChange={(e) => handleFormChange('displayName', e.target.value)}
                    maxLength={50}
                    placeholder="Ваше полное имя"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">{formData.displayName.length}/50 символов</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Биография</label>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => handleFormChange('bio', e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Напишите несколько предложений о себе"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">{formData.bio.length}/500 символов</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
                    <input 
                      type="text" 
                      value={formData.city}
                      onChange={(e) => handleFormChange('city', e.target.value)}
                      maxLength={100}
                      placeholder="Ваш город"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Страна</label>
                    <input 
                      type="text" 
                      value={formData.country}
                      onChange={(e) => handleFormChange('country', e.target.value)}
                      maxLength={100}
                      placeholder="Ваша страна"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={modalLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {modalLoading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (user) {
                        setFormData({
                          username: user.username || '',
                          displayName: user.displayName || '',
                          bio: user.bio || '',
                          email: user.email || '',
                          city: user.city || '',
                          country: user.country || ''
                        });
                      }
                    }}
                    className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300"
                  >
                    Отменить
                  </button>
                </div>

                {/* Status Messages */}
                {modalMessage && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                    {modalMessage}
                  </div>
                )}
                {modalError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {modalError}
                  </div>
                )}
              </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Account Settings - Only for own profile */}
        {canEdit && !isEditing && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Настройки аккаунта</h2>
            <div className="space-y-4">
              {/* Admin Panel Link */}
              {user?.isAdmin && (
                <div className="pb-4 border-b border-gray-200">
                  <Link 
                    href="/admin"
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-blue-900">Панель администратора</div>
                        <div className="text-sm text-blue-700">Управление сайтом</div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Email</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{user?.email}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Пароль</h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{user?.password ? 'Пароль установлен' : 'Пароль не установлен'}</span>
                  <button 
                  onClick={() => setShowChangePasswordModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                  Изменить пароль
                </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Posts/Comments */}
        {(user?.recentTopics && user.recentTopics.length > 0) || (user?.recentPosts && user.recentPosts.length > 0) ? (
          <div className="space-y-4">
            {/* Recent Topics */}
            {user?.recentTopics && user.recentTopics.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Недавние темы</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {user.recentTopics.map((topic) => (
                    <div key={topic.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/topic/${topic.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {topic.title}
                        </Link>
                        <span className="text-sm text-gray-500">
                          {formatDate(topic.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {topic.views} просмотров • {topic.replyCount} ответов
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts (Comments) */}
            {user?.recentPosts && user.recentPosts.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Недавние комментарии</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {user.recentPosts.map((post) => (
                    <div key={post.id} className="px-6 py-4 hover:bg-gray-50">
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatDate(post.createdAt)}</span>
                        <span>•</span>
                        <Link
                          href={`/topic/${post.topicId}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Просмотр темы
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Back to Forum */}
        <div className="text-center py-4">
        <div className="text-gray-500/90 mb-4">
            Зарегистрирован с {user?.createdAt ? formatDate(user.createdAt.split('T')[0]) : 'Неизвестно'}
        </div>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Назад на форум
          </Link>
        </div>
      </div>


      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Изменить пароль</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={modalLoading}
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Новый пароль
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={modalLoading}
                  placeholder="Минимум 6 символов"
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={modalLoading}
                />
              </div>
              
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                  {modalError}
                </div>
              )}
              
              {modalMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                  {modalMessage}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleChangePassword}
                  disabled={modalLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? 'Изменение...' : 'Далее'}
                </button>
                <button
                  onClick={closeModal}
                  disabled={modalLoading}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

