'use client'

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'
import ClientOnly from '@/components/ClientOnly';
import { optimizeImage, isImage } from '@/lib/imageOptimizer';

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
  // Social links
  telegramLink?: string | null;
  vkLink?: string | null;
  viberLink?: string | null;
  telegramVisible?: boolean;
  vkVisible?: boolean;
  viberVisible?: boolean;
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

  const [socialData, setSocialData] = useState({
    telegramLink: '',
    vkLink: '',
    viberLink: '',
    telegramVisible: false,
    vkVisible: false,
    viberVisible: false,
  });
  
  // Photo upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  
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
      setSocialData({
        telegramLink: user.telegramLink || '',
        vkLink: user.vkLink || '',
        viberLink: user.viberLink || '',
        telegramVisible: user.telegramVisible ?? false,
        vkVisible: user.vkVisible ?? false,
        viberVisible: user.viberVisible ?? false,
      });
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      console.log('Loading user profile for userId:', userId);
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const response = await fetch(`/api/users/${userId}`, { headers });
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
      setModalError('Требуется авторизация. Войдите снова.');
      return;
    }

    // Validate file size (max 10MB raw)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setModalError('Файл слишком большой. Максимум 10 МБ.');
      return;
    }

    setUploadingPhoto(true);
    setUploadStatus('Оптимизация изображения...');
    setModalError('');
    setModalMessage('');

    try {
      // Step 1: Optimize image client-side before upload
      let fileToUpload: File = selectedFile;
      if (isImage(selectedFile) && !selectedFile.type.includes('svg')) {
        try {
          fileToUpload = await optimizeImage(selectedFile, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.85,
            format: 'webp'
          });
          console.log(`Photo optimized: ${(selectedFile.size / 1024).toFixed(0)}KB → ${(fileToUpload.size / 1024).toFixed(0)}KB`);
        } catch (optError) {
          console.warn('Image optimization failed, uploading original:', optError);
          fileToUpload = selectedFile;
        }
      }

      // Step 2: Upload to storage
      setUploadStatus('Загрузка фото...');
      const uploadFormData = new FormData();
      uploadFormData.append('file', fileToUpload);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
        },
        body: uploadFormData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Ошибка загрузки изображения');
      }

      const photoURL = uploadData.url || uploadData.file_url;
      if (!photoURL) {
        throw new Error('Сервер не вернул URL загруженного файла');
      }
      console.log('Photo uploaded successfully:', photoURL);

      // Step 3: Update user profile with new photo URL
      setUploadStatus('Обновление профиля...');
      let updateResponse = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photoURL }),
      });

      let updateData = await updateResponse.json();

      if (updateResponse.status === 401 && updateData.error === 'Unauthorized') {
        const newToken = await refreshAccessToken();
        if (newToken) {
          updateResponse = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ photoURL }),
          });
          updateData = await updateResponse.json();
        } else {
          setModalError('Сессия истекла. Войдите снова.');
          return;
        }
      }

      if (updateResponse.ok) {
        setModalMessage('Фото успешно загружено!');
        setSelectedFile(null);
        setPhotoPreview(null);

        if (currentUser && currentUser.id === userId && updateData.user) {
          const updatedUser = { ...currentUser, photoURL: updateData.user.photoURL };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        await loadUserProfile();
        setTimeout(() => setModalMessage(''), 2000);
      } else {
        setModalError(updateData.error || 'Ошибка обновления фото профиля');
      }
    } catch (error) {
      setModalError(error instanceof Error ? error.message : 'Ошибка загрузки фото');
    } finally {
      setUploadingPhoto(false);
      setUploadStatus('');
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
        photoURL: user?.photoURL,
        telegramLink: socialData.telegramLink.trim() || null,
        vkLink: socialData.vkLink.trim() || null,
        viberLink: socialData.viberLink.trim() || null,
        telegramVisible: socialData.telegramVisible,
        vkVisible: socialData.vkVisible,
        viberVisible: socialData.viberVisible,
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
            setModalMessage('Профиль успешно обновлён!');
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
            setModalError(data.error || 'Ошибка обновления профиля');
            return;
          }
        } else {
          setModalError('Сессия истекла. Войдите снова.');
          return;
        }
      }

      if (response.ok) {
        setModalMessage('Профиль успешно обновлён!');
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
        setModalError(data.error || 'Ошибка обновления профиля');
      }
    } catch (error) {
      setModalError('Ошибка сети. Пожалуйста, попробуйте снова.');
    } finally {
      setModalLoading(false);
    }
  };


  const handleChangePassword = async () => {
    let tokenToUse = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!tokenToUse || !currentPassword || !newPassword || !confirmPassword) {
      setModalError('Пожалуйста, заполните все поля');
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
                    {uploadStatus && (
                      <p className="text-xs text-blue-600 mb-2 flex items-center gap-1">
                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {uploadStatus}
                      </p>
                    )}
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
                        disabled={uploadingPhoto}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 disabled:opacity-50"
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

                      {/* Social link badges */}
                      {(user?.telegramLink || user?.vkLink || user?.viberLink) && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {user.telegramLink && (
                            <a
                              href={user.telegramLink.startsWith('http') ? user.telegramLink : `https://t.me/${user.telegramLink.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                              Telegram
                            </a>
                          )}
                          {user.vkLink && (
                            <a
                              href={user.vkLink.startsWith('http') ? user.vkLink : `https://vk.com/${user.vkLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>
                              VK
                            </a>
                          )}
                          {user.viberLink && (
                            <a
                              href={user.viberLink.startsWith('http') ? user.viberLink : `viber://chat?number=${user.viberLink.replace(/[^0-9+]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.187.518 6.77.378 9.996.238 13.222.018 19.276 5.095 20.67h.005l-.005 2.263s-.038.917.567 1.102c.731.226 1.16-.471 1.862-1.221.384-.413.914-.994 1.312-1.445 3.612.313 6.39-.389 6.706-.497.73-.252 4.863-.766 5.54-6.256.699-5.66-.333-9.232-2.177-10.853l-.001-.001c-.555-.49-2.393-1.795-6.644-1.797 0 0-.396-.025-.861-.018zm.218 1.931c.389-.004.708.014.708.014 3.545.001 5.085 1.06 5.555 1.472l.001.001c1.56 1.373 2.322 4.572 1.728 9.41-.56 4.553-3.995 4.838-4.601 5.046-.263.09-2.657.68-5.663.485 0 0-2.243 2.705-2.943 3.412-.111.113-.247.159-.338.138-.127-.029-.162-.166-.161-.367l.02-3.7c-4.203-1.168-3.957-6.217-3.84-8.89.118-2.673.76-4.89 2.215-6.323C5.88 2.06 9.29 1.942 11.616 1.933zm.294 2.333a.426.426 0 0 0-.43.42.426.426 0 0 0 .43.422c1.167.018 2.148.413 2.953 1.163a4.123 4.123 0 0 1 1.228 2.854.426.426 0 0 0 .43.42h.016a.426.426 0 0 0 .413-.438 5.01 5.01 0 0 0-1.485-3.45c-.972-.908-2.14-1.381-3.547-1.391h-.008zm-3.71 1.31c-.17-.005-.345.07-.493.238-.546.587-1.107 1.31-.998 2.099.027.198.088.39.18.573l.012.022c.493 1.072 1.151 2.065 1.95 2.991l.023.027c1.088 1.224 2.377 2.236 3.834 3.011l.033.016c.64.34 1.335.605 2.06.79l.045.01c.247.06.494.008.712-.108.606-.334 1.014-.908 1.186-1.302a.515.515 0 0 0-.043-.476c-.3-.453-1.064-1.005-1.553-1.303a.512.512 0 0 0-.545.017l-.573.425c-.22.155-.511.145-.511.145l-.007.002c-2.585-.636-3.264-3.275-3.264-3.275s-.01-.29.145-.511l.424-.574a.513.513 0 0 0 .017-.544c-.298-.49-.85-1.253-1.303-1.553a.52.52 0 0 0-.33-.1zm5.083.568a.426.426 0 0 0-.008.852c1.455.074 2.543 1.118 2.604 2.592a.426.426 0 0 0 .842-.034c-.078-1.89-1.454-3.218-3.43-3.41a.416.416 0 0 0-.008 0zm.053 1.651a.426.426 0 0 0-.024.852c.672.04 1.05.373 1.09 1.013a.426.426 0 0 0 .85-.05c-.063-1.019-.717-1.78-1.9-1.815a.431.431 0 0 0-.016 0z"/></svg>
                              Viber
                            </a>
                          )}
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

                {/* Social Links */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Социальные сети</label>
                  <div className="space-y-3">
                    {/* Telegram */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-sky-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                          <span className="text-sm text-gray-600">Telegram</span>
                        </div>
                        <input
                          type="text"
                          value={socialData.telegramLink}
                          onChange={(e) => setSocialData(prev => ({ ...prev, telegramLink: e.target.value }))}
                          maxLength={200}
                          placeholder="@username или ссылка"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-6">
                        <input
                          type="checkbox"
                          checked={socialData.telegramVisible}
                          onChange={(e) => setSocialData(prev => ({ ...prev, telegramVisible: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">Виден всем</span>
                      </label>
                    </div>

                    {/* VK */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>
                          <span className="text-sm text-gray-600">VK</span>
                        </div>
                        <input
                          type="text"
                          value={socialData.vkLink}
                          onChange={(e) => setSocialData(prev => ({ ...prev, vkLink: e.target.value }))}
                          maxLength={200}
                          placeholder="ID или ссылка на профиль"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-6">
                        <input
                          type="checkbox"
                          checked={socialData.vkVisible}
                          onChange={(e) => setSocialData(prev => ({ ...prev, vkVisible: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">Виден всем</span>
                      </label>
                    </div>

                    {/* Viber */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-purple-600" viewBox="0 0 24 24" fill="currentColor"><path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.187.518 6.77.378 9.996.238 13.222.018 19.276 5.095 20.67h.005l-.005 2.263s-.038.917.567 1.102c.731.226 1.16-.471 1.862-1.221.384-.413.914-.994 1.312-1.445 3.612.313 6.39-.389 6.706-.497.73-.252 4.863-.766 5.54-6.256.699-5.66-.333-9.232-2.177-10.853l-.001-.001c-.555-.49-2.393-1.795-6.644-1.797 0 0-.396-.025-.861-.018zm.218 1.931c.389-.004.708.014.708.014 3.545.001 5.085 1.06 5.555 1.472l.001.001c1.56 1.373 2.322 4.572 1.728 9.41-.56 4.553-3.995 4.838-4.601 5.046-.263.09-2.657.68-5.663.485 0 0-2.243 2.705-2.943 3.412-.111.113-.247.159-.338.138-.127-.029-.162-.166-.161-.367l.02-3.7c-4.203-1.168-3.957-6.217-3.84-8.89.118-2.673.76-4.89 2.215-6.323C5.88 2.06 9.29 1.942 11.616 1.933zm.294 2.333a.426.426 0 0 0-.43.42.426.426 0 0 0 .43.422c1.167.018 2.148.413 2.953 1.163a4.123 4.123 0 0 1 1.228 2.854.426.426 0 0 0 .43.42h.016a.426.426 0 0 0 .413-.438 5.01 5.01 0 0 0-1.485-3.45c-.972-.908-2.14-1.381-3.547-1.391h-.008zm-3.71 1.31c-.17-.005-.345.07-.493.238-.546.587-1.107 1.31-.998 2.099.027.198.088.39.18.573l.012.022c.493 1.072 1.151 2.065 1.95 2.991l.023.027c1.088 1.224 2.377 2.236 3.834 3.011l.033.016c.64.34 1.335.605 2.06.79l.045.01c.247.06.494.008.712-.108.606-.334 1.014-.908 1.186-1.302a.515.515 0 0 0-.043-.476c-.3-.453-1.064-1.005-1.553-1.303a.512.512 0 0 0-.545.017l-.573.425c-.22.155-.511.145-.511.145l-.007.002c-2.585-.636-3.264-3.275-3.264-3.275s-.01-.29.145-.511l.424-.574a.513.513 0 0 0 .017-.544c-.298-.49-.85-1.253-1.303-1.553a.52.52 0 0 0-.33-.1zm5.083.568a.426.426 0 0 0-.008.852c1.455.074 2.543 1.118 2.604 2.592a.426.426 0 0 0 .842-.034c-.078-1.89-1.454-3.218-3.43-3.41a.416.416 0 0 0-.008 0zm.053 1.651a.426.426 0 0 0-.024.852c.672.04 1.05.373 1.09 1.013a.426.426 0 0 0 .85-.05c-.063-1.019-.717-1.78-1.9-1.815a.431.431 0 0 0-.016 0z"/></svg>
                          <span className="text-sm text-gray-600">Viber</span>
                        </div>
                        <input
                          type="text"
                          value={socialData.viberLink}
                          onChange={(e) => setSocialData(prev => ({ ...prev, viberLink: e.target.value }))}
                          maxLength={200}
                          placeholder="Номер телефона"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer pt-6">
                        <input
                          type="checkbox"
                          checked={socialData.viberVisible}
                          onChange={(e) => setSocialData(prev => ({ ...prev, viberVisible: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">Виден всем</span>
                      </label>
                    </div>
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
                        setSocialData({
                          telegramLink: user.telegramLink || '',
                          vkLink: user.vkLink || '',
                          viberLink: user.viberLink || '',
                          telegramVisible: user.telegramVisible ?? false,
                          vkVisible: user.vkVisible ?? false,
                          viberVisible: user.viberVisible ?? false,
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{user?.email}</span>
                    {user?.isVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Подтвержден
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠ Не подтвержден
                      </span>
                    )}
                  </div>
                  {!user?.isVerified && (
                    <button
                      onClick={async () => {
                        setModalLoading(true);
                        setModalError('');
                        setModalMessage('');
                        try {
                          const token = localStorage.getItem('accessToken');
                          const response = await fetch('/api/auth/verify-email', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json',
                            },
                          });
                          const data = await response.json();
                          if (response.ok) {
                            setModalMessage('✉️ Письмо для подтверждения отправлено на ваш email!');
                          } else {
                            setModalError(data.error || 'Не удалось отправить письмо');
                          }
                        } catch (error) {
                          setModalError('Ошибка сети. Попробуйте снова.');
                        } finally {
                          setModalLoading(false);
                        }
                      }}
                      disabled={modalLoading}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      {modalLoading ? 'Отправка...' : '📧 Отправить письмо для подтверждения'}
                    </button>
                  )}
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

      {/* Notification Modal */}
      {(modalMessage || modalError) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              {modalMessage && (
                <>
                  <div className="text-green-600 text-5xl mb-4">✓</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Успешно!</h3>
                  <p className="text-gray-600">{modalMessage}</p>
                </>
              )}
              {modalError && (
                <>
                  <div className="text-red-600 text-5xl mb-4">✗</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка</h3>
                  <p className="text-gray-600">{modalError}</p>
                </>
              )}
              <button
                onClick={() => {
                  setModalMessage('');
                  setModalError('');
                }}
                className="mt-6 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

