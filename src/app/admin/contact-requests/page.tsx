'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface ContactRequest {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

export default function ContactRequestsPage() {
  const router = useRouter()
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ContactRequest[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser === undefined) return
    if (!currentUser || !currentUser.isAdmin) {
      router.push('/')
      return
    }
    fetchRequests()
  }, [currentUser, router])

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const response = await fetch('/api/admin/contact-requests?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching contact requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center text-gray-500">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            &larr; Панель управления
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Обращения</h1>
          <p className="text-gray-600 text-sm mt-1">Заявки из формы обратной связи ({requests.length})</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Обращений пока нет
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900 truncate">{req.subject}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{req.name}</span>
                      <span>{req.email}</span>
                      <span>{formatDate(req.created_at)}</span>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === req.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedId === req.id && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Имя:</span>
                      <span className="ml-2 text-gray-900">{req.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <a href={`mailto:${req.email}`} className="ml-2 text-blue-600 hover:underline">{req.email}</a>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Сообщение:</span>
                    <p className="mt-2 text-gray-900 whitespace-pre-wrap bg-white rounded p-3 border border-gray-200">
                      {req.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
