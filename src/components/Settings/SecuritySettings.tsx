import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase/config';

const SecuritySettings: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate passwords
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Новый пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      if (auth.currentUser && auth.currentUser.email) {
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          passwords.currentPassword
        );
        
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        // Update password
        await updatePassword(auth.currentUser, passwords.newPassword);
        
        setSuccess(true);
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        setError('Неверный текущий пароль');
      } else {
        setError(error.message || 'Ошибка при изменении пароля');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Настройки безопасности</h2>
      
      <div className="space-y-6">
        {/* Change Password Section */}
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-4">Изменить пароль</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}
            
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-800">Пароль успешно изменен!</div>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Текущий пароль
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                >
                  {showPasswords.current ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Новый пароль
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                >
                  {showPasswords.new ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Минимум 6 символов</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Подтвердите новый пароль
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                >
                  {showPasswords.confirm ? (
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Изменение...' : 'Изменить пароль'}
              </button>
            </div>
          </form>
        </div>

        <hr />

        {/* Two-Factor Authentication (Placeholder) */}
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-2">Двухфакторная аутентификация</h3>
          <p className="text-sm text-gray-600 mb-4">
            Добавьте дополнительный уровень безопасности к вашему аккаунту
          </p>
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
          >
            Скоро будет доступно
          </button>
        </div>

        <hr />

        {/* Login History (Placeholder) */}
        <div>
          <h3 className="text-base font-medium text-gray-900 mb-2">История входов</h3>
          <p className="text-sm text-gray-600 mb-4">
            Просмотрите последние входы в ваш аккаунт
          </p>
          <div className="text-sm text-gray-500">
            Последний вход: {new Date().toLocaleString('ru-RU')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
