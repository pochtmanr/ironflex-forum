'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ConfirmEmailChangeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [emailInfo, setEmailInfo] = useState<{
    currentEmail: string
    newEmail: string
    username: string
  } | null>(null)

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        console.error('No token provided')
        setError('Токен подтверждения отсутствует')
        setVerifying(false)
        setLoading(false)
        return
      }

      console.log('Verifying token:', token)

      try {
        const url = `/api/auth/confirm-email-change?token=${token}`
        console.log('Fetching:', url)
        
        const response = await fetch(url)
        const data = await response.json()

        console.log('Response status:', response.status)
        console.log('Response data:', data)

        if (response.ok) {
          console.log('Token is valid')
          setTokenValid(true)
          setEmailInfo({
            currentEmail: data.currentEmail,
            newEmail: data.newEmail,
            username: data.username
          })
          setLoading(false)
        } else {
          console.error('Token validation failed:', data)
          setError(data.error || 'Неверный или истекший токен подтверждения')
        }
      } catch (err) {
        console.error('Error verifying token:', err)
        setError('Не удалось проверить токен подтверждения')
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const handleConfirm = async () => {
    console.log('Starting email confirmation...')
    setLoading(true)
    setError('')
    setMessage('')

    try {
      console.log('Sending confirmation request with token:', token)
      
      const response = await fetch('/api/auth/confirm-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      console.log('Confirmation response status:', response.status)
      console.log('Confirmation response data:', data)

      if (response.ok) {
        console.log('Email change confirmed successfully')
        setConfirmed(true)
        setMessage(`Email успешно изменен с ${data.oldEmail} на ${data.newEmail}`)
        
        // Update localStorage with new email if user is logged in
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            userData.email = data.newEmail;
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('Updated user email in localStorage');
          } catch (e) {
            console.error('Error updating localStorage:', e);
          }
        }
        
        setTimeout(() => {
          console.log('Redirecting to profile...')
          router.push('/profile')
        }, 3000)
      } else {
        console.error('Email confirmation failed:', data)
        setError(data.error || 'Не удалось подтвердить изменение email')
      }
    } catch (err) {
      console.error('Error confirming email change:', err)
      setError('Ошибка сети. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Проверка токена подтверждения...
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Пожалуйста, подождите
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Неверная ссылка подтверждения
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error}
            </p>
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-left">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Возможные причины:
              </h3>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                <li>Срок действия ссылки истек (действует 2 часа)</li>
                <li>Ссылка уже была использована</li>
                <li>Неверный токен в URL</li>
              </ul>
            </div>
            <div className="mt-6">
              <Link
                href="/profile"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Вернуться в профиль
              </Link>
              <span className="mx-2 text-gray-400">|</span>
              <Link
                href="/auth/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Войти
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Email успешно изменен!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {message}
            </p>
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Важные заметки
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Используйте новый email для входа</li>
                      <li>Старый email больше не действителен</li>
                      <li>Перенаправление на страницу входа...</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-blue-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Подтверждение изменения email на {emailInfo?.newEmail}
          </h2>
          {emailInfo && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Запрос на изменение email на {emailInfo?.newEmail}
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><span className="font-medium">Аккаунт:</span> {emailInfo.username}</p>
                <p><span className="font-medium">Текущий email:</span> {emailInfo.currentEmail}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="bg-yellow-50/20 border border-yellow-100 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Важное предупреждение
                </h3>
                <div className="mt-2 text-sm text-yellow-00">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Это действие не может быть отменено</li>
                    <li>Ваш старый email больше не будет работать для входа</li>
                    <li>Убедитесь, что у вас есть доступ к новому email адресу</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Подтверждение...
                </div>
              ) : (
                'Подтверждение изменения email'
              )}
            </button>
            
            <Link
              href="/profile"
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Отменить
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmEmailChangePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <ConfirmEmailChangeContent />
    </Suspense>
  )
}
