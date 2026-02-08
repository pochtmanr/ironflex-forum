'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

function ConfirmEmailChangeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { refreshUser } = useAuth()

  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const confirmChange = async () => {
      if (!token) {
        setError('Токен подтверждения отсутствует')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/confirm-email-change?token=${token}`)
        const data = await response.json()

        if (response.ok && data.verified) {
          setVerified(true)
          setNewEmail(data.newEmail)

          // Update tokens in localStorage
          if (data.accessToken && data.refreshToken) {
            localStorage.setItem('accessToken', data.accessToken)
            localStorage.setItem('refreshToken', data.refreshToken)
          }

          // Refresh user context
          await refreshUser()
        } else {
          setError(data.error || 'Не удалось подтвердить email')
        }
      } catch {
        setError('Ошибка сети. Попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }

    confirmChange()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Подтверждение нового email...
            </h2>
            <p className="mt-2 text-gray-600">
              Пожалуйста, подождите.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            {verified ? (
              <div className="text-green-600 text-6xl mb-4">&#10003;</div>
            ) : (
              <div className="text-red-600 text-6xl mb-4">&#10007;</div>
            )}

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              {verified ? 'Email успешно изменён!' : 'Ошибка подтверждения'}
            </h2>

            <p className="mt-2 text-gray-600">
              {verified
                ? `Ваш email изменён на ${newEmail}`
                : error}
            </p>

            <div className="mt-8 space-y-3">
              {verified && (
                <>
                  <Link
                    href="/"
                    className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    На главную
                  </Link>
                  <Link
                    href="/profile"
                    className="block w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Перейти в профиль
                  </Link>
                </>
              )}

              {!verified && (
                <Link
                  href="/profile"
                  className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Вернуться в профиль
                </Link>
              )}
            </div>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ConfirmEmailChangeContent />
    </Suspense>
  )
}
