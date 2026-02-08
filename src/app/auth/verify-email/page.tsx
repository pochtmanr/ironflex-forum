'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [alreadyVerified, setAlreadyVerified] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Verify email on component mount
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Токен подтверждения отсутствует')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()

        if (response.ok) {
          if (data.alreadyVerified) {
            setAlreadyVerified(true)
            setMessage('Email адрес уже подтвержден!')
          } else {
            setVerified(true)
            setMessage('Email адрес успешно подтвержден!')
          }
        } else {
          setError(data.error || 'Не удалось подтвердить email')
        }
      } catch (err) {
        setError('Ошибка сети. Пожалуйста, попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              Подтверждение email...
            </h2>
            <p className="mt-2 text-gray-600">
              Пожалуйста, подождите пока мы подтверждаем ваш email адрес.
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
            {(verified || alreadyVerified) ? (
              <div className="text-green-600 text-6xl mb-4">✓</div>
            ) : (
              <div className="text-red-600 text-6xl mb-4">✗</div>
            )}
            
            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              {verified ? 'Email адрес подтвержден!' : alreadyVerified ? 'Email адрес уже подтвержден' : 'Не удалось подтвердить email'}
            </h2>
            
            <p className="mt-2 text-gray-600">
              {message || error}
            </p>

            <div className="mt-8 space-y-3">
              {(verified || alreadyVerified) && (
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
              
              {error && !verified && !alreadyVerified && (
                <Link
                  href="/"
                  className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  На главную
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

