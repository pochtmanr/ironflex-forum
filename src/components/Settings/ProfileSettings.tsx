import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ProfileSettings: React.FC = () => {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    username: '', // New field
    location: '', // New field
    bio: '',
    photoURL: currentUser?.photoURL || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setLoading(true);
    setError('');

    try {
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const fileName = `profile-${currentUser.uid}-${timestamp}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `profile-photos/${fileName}`);
      
      // Upload file
      const uploadResult = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      

      // Update form data with the new URL
      setFormData({
        ...formData,
        photoURL: downloadURL
      });
      
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      setError('Ошибка при загрузке фото: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!currentUser) {
        throw new Error('User not authenticated.');
      }

      // Update Firebase Auth profile (displayName and photoURL)
      await updateProfile(currentUser, {
        displayName: formData.displayName, // Use displayName from form, could be username
        photoURL: formData.photoURL
      });

      // Save additional profile data to Firestore
      const userProfileRef = doc(db, 'users', currentUser.uid);
      await setDoc(userProfileRef, {
        username: formData.username, // Save username
        location: formData.location, // Save location
        bio: formData.bio,
        photoURL: formData.photoURL, // <--- This is the line we're checking
        lastActive: new Date(),
      }, { merge: true }); // Use merge to avoid overwriting other fields
        
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (currentUser) {
      const fetchUserProfile = async () => {
        const userProfileRef = doc(db, 'users', currentUser.uid);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
          const data = userProfileSnap.data();
          setFormData(prev => ({
            ...prev,
            username: data.username || currentUser.displayName || '',
            location: data.location || '',
            bio: data.bio || '',
            displayName: currentUser.displayName || data.username || '',
            photoURL: currentUser.photoURL || data.photoURL || ''
          }));
        } else {
           // If no Firestore profile exists, use current Firebase Auth data
          setFormData(prev => ({
            ...prev,
            username: currentUser.displayName || '',
            displayName: currentUser.displayName || '',
            photoURL: currentUser.photoURL || ''
          }));
        }
      };
      fetchUserProfile();
    }
  }, [currentUser]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Настройки профиля</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-800">Профиль успешно обновлен!</div>
          </div>
        )}

        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фото профиля
          </label>
          <div className="flex items-center space-x-4">
            {formData.photoURL ? (
              <img
                src={formData.photoURL}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl font-bold">
                {getInitials(formData.displayName || 'U')}
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handlePhotoClick}
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Загрузка...' : 'Изменить фото'}
              </button>
              <p className="mt-1 text-xs text-gray-500">JPG, GIF или PNG. Макс. размер 2MB.</p>
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Отображаемое имя
          </label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Ваше имя"
          />
        </div>

        {/* Username (New Field) */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Имя пользователя
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Придумайте имя пользователя (никнейм)"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={currentUser?.email || ''}
            disabled
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">Email нельзя изменить</p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            О себе
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Расскажите немного о себе..."
          />
          <p className="mt-1 text-xs text-gray-500">Макс. 500 символов</p>
        </div>

        {/* Location (New Field) */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Местоположение
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Ваше местоположение (например, Москва, Россия)"
          />
          <p className="mt-1 text-xs text-gray-500">Например, Москва, Россия</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
