'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  _id?: string
  email: string
  username: string
  displayName?: string
  isVerified: boolean
  googleId?: string
  vkId?: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    // Get user and token from localStorage directly
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('accessToken')
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setToken(savedToken)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    setLoading(false)
  }, [])

  // Check if user is OAuth-only (no password)
  const isOAuthOnly = () => {
    return !!(user?.googleId || user?.vkId)
  }

  // Get OAuth provider name
  const getOAuthProvider = () => {
    if (user?.googleId) return 'Google'
    if (user?.vkId) return 'VK'
    return null
  }

  // Handler functions
  const handleVerifyEmail = async () => {
    if (!token) return
    
    setModalLoading(true)
    setModalError('')
    setModalMessage('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        setModalMessage(data.message)
        // Update user verification status
        if (user) {
          setUser({ ...user, isVerified: true })
        }
      } else {
        setModalError(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      setModalError('Network error. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleChangeEmail = async () => {
    if (!token || !newEmail) return
    
    setModalLoading(true)
    setModalError('')
    setModalMessage('')

    try {
      const response = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setModalMessage(data.message)
        setNewEmail('')
        setTimeout(() => {
          setShowChangeEmailModal(false)
          setModalMessage('')
        }, 3000)
      } else {
        setModalError(data.error || 'Failed to change email')
      }
    } catch (error) {
      setModalError('Network error. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!token) {
      setModalError('Отсутствует токен авторизации')
      return
    }

    // For OAuth users, current password is not required
    if (!isOAuthOnly() && !currentPassword) {
      setModalError('Введите текущий пароль')
      return
    }

    if (!newPassword || !confirmPassword) {
      setModalError('Заполните все поля')
      return
    }

    if (newPassword !== confirmPassword) {
      setModalError('Пароли не совпадают')
      return
    }

    if (newPassword.length < 6) {
      setModalError('Пароль должен содержать минимум 6 символов')
      return
    }
    
    setModalLoading(true)
    setModalError('')
    setModalMessage('')

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setModalMessage(data.message)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          setShowChangePasswordModal(false)
          setModalMessage('')
        }, 3000)
      } else {
        setModalError(data.error || 'Failed to change password')
      }
    } catch (error) {
      setModalError('Network error. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return
    
    setModalLoading(true)
    setModalError('')
    setModalMessage('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })

      const data = await response.json()

      if (response.ok) {
        setModalMessage(data.message)
      } else {
        setModalError(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      setModalError('Network error. Please try again.')
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setShowChangeEmailModal(false)
    setShowChangePasswordModal(false)
    setNewEmail('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setModalLoading(false)
    setModalMessage('')
    setModalError('')
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-500">Загрузка настроек...</div>
        </div>
      </div>
    )
  }

  if (!user || !token) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 mb-6">
            Для доступа к настройкам необходимо войти в систему.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Войти в систему
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Настройки аккаунта</h1>
        <p className="text-gray-600">Управление вашим аккаунтом и настройками безопасности</p>
      </div>

      {/* Account Settings Section */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Настройки аккаунта</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Email настройки</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Текущий email</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.isVerified ? 'Подтвержден' : 'Не подтвержден'}
                  </span>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={() => setShowChangeEmailModal(true)}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    📧 Изменить email адрес
                  </button>
                  {!user.isVerified && (
                    <button 
                      onClick={handleVerifyEmail}
                      disabled={modalLoading}
                      className="w-full text-left px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      {modalLoading ? '📤 Отправка...' : '✉️ Подтвердить email адрес'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Password Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Пароль</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900">Безопасность пароля</p>
                  <p className="text-sm text-gray-600">
                    {isOAuthOnly() 
                      ? `Вход через ${getOAuthProvider()}` 
                      : 'Последнее изменение: неизвестно'}
                  </p>
                </div>
                
                {/* Show info message for OAuth users */}
                {isOAuthOnly() && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                      ℹ️ Вы используете вход через {getOAuthProvider()}. У вашего аккаунта нет пароля. 
                      Вы можете создать пароль для дополнительной безопасности или продолжить использовать {getOAuthProvider()}.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {/* Change password button - show for all users */}
                  <button 
                    onClick={() => setShowChangePasswordModal(true)}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    {isOAuthOnly() ? '🔐 Создать пароль' : '🔐 Изменить пароль'}
                  </button>

                  {/* Reset password button - only for users with passwords */}
                  {!isOAuthOnly() && (
                    <button 
                      onClick={handleResetPassword}
                      disabled={modalLoading}
                      className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      {modalLoading ? 'Отправка...' : '🔄 Сбросить пароль'}
                    </button>
                  )}

                  {/* Show OAuth provider info */}
                  {user.googleId && (
                    <div className="px-3 py-2 text-xs text-gray-600 bg-white rounded-md border border-gray-200">
                      ✓ Подключен Google аккаунт
                    </div>
                  )}
                  {user.vkId && (
                    <div className="px-3 py-2 text-xs text-gray-600 bg-white rounded-md border border-gray-200">
                      ✓ Подключен VK аккаунт
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Messages */}
          {modalMessage && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {modalMessage}
            </div>
          )}
          {modalError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {modalError}
            </div>
          )}
        </div>
      </div>

      {/* User Information */}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Информация об аккаунте</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Имя пользователя</p>
              <p className="text-sm text-gray-600">{user.username}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Отображаемое имя</p>
              <p className="text-sm text-gray-600">{user.displayName || 'Не указано'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Статус верификации</p>
              <p className="text-sm text-gray-600">{user.isVerified ? 'Подтвержден' : 'Не подтвержден'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Вернуться на главную
        </Link>
      </div>

      {/* Change Email Modal */}
      {showChangeEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Изменить email адрес</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                  Новый email адрес
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="new@example.com"
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
                  onClick={handleChangeEmail}
                  disabled={modalLoading || !newEmail}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? 'Отправка...' : 'Отправить подтверждение'}
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

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isOAuthOnly() ? 'Создать пароль' : 'Изменить пароль'}
            </h3>
            
            {/* Info message for OAuth users */}
            {isOAuthOnly() && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  ℹ️ Вы используете вход через {getOAuthProvider()}. Создание пароля позволит вам входить 
                  в систему как через {getOAuthProvider()}, так и через email/пароль.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Current password - only for users who already have a password */}
              {!isOAuthOnly() && (
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
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
              )}
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  {isOAuthOnly() ? 'Пароль' : 'Новый пароль'}
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
                  Подтвердить пароль
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
                  disabled={modalLoading || (!isOAuthOnly() && !currentPassword) || !newPassword || !confirmPassword}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? (isOAuthOnly() ? 'Создание...' : 'Изменение...') : (isOAuthOnly() ? 'Создать пароль' : 'Изменить пароль')}
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
  )
}
