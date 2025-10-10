'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
  const router = useRouter()
  const { currentUser } = useAuth()

  useEffect(() => {
    if (currentUser) {
      // Redirect to current user's profile
      router.push(`/profile/${currentUser.id}`)
    } else {
      // Redirect to login if not authenticated
      router.push('/login')
    }
  }, [currentUser, router])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-10">Профиль</h1>
        <p className="text-gray-600">Перенаправление...</p>
      </div>
    </div>
  )
}
