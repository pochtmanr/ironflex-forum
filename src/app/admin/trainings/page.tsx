'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { RichTextEditor } from '@/components/UI/RichTextEditor'

interface Training {
  id: string
  title: string
  slug: string
  subheader: string
  content: string
  coverImageUrl: string
  level: string
  durationMinutes: number | null
  authorName: string
  likes?: number
  views?: number
  commentCount?: number
  created_at: string
  updated_at: string
}

export default function AdminTrainings() {
  const { currentUser } = useAuth()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [subheader, setSubheader] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [level, setLevel] = useState('beginner')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('')
  const [authorName, setAuthorName] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    fetchTrainings()
  }, [])

  useEffect(() => {
    if (currentUser) {
      setAuthorName(currentUser.displayName || currentUser.email || 'Unknown')
    }
  }, [currentUser])

  const fetchTrainings = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/trainings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTrainings(data.trainings || [])
      }
    } catch (error) {
      console.error('Error fetching trainings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const url = editingTraining ? `/api/admin/trainings/${editingTraining.id}` : '/api/admin/trainings'
      const method = editingTraining ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          slug,
          subheader,
          content,
          coverImageUrl,
          level,
          durationMinutes: durationMinutes === '' ? null : durationMinutes,
          authorName
        })
      })

      if (response.ok) {
        resetForm()
        fetchTrainings()
        setShowCreateForm(false)
        setEditingTraining(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save training')
      }
    } catch (error) {
      console.error('Error saving training:', error)
      alert('Error saving training')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (training: Training) => {
    setEditingTraining(training)
    setTitle(training.title)
    setSlug(training.slug)
    setSubheader(training.subheader)
    setContent(training.content)
    setCoverImageUrl(training.coverImageUrl)
    setLevel(training.level)
    setDurationMinutes(training.durationMinutes || '')
    setAuthorName(training.authorName)
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this training?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/trainings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchTrainings()
      } else {
        alert('Failed to delete training')
      }
    } catch (error) {
      console.error('Error deleting training:', error)
      alert('Error deleting training')
    }
  }

  const resetForm = () => {
    setTitle('')
    setSlug('')
    setSubheader('')
    setContent('')
    setCoverImageUrl('')
    setLevel('beginner')
    setDurationMinutes('')
    setAuthorName(currentUser?.displayName || currentUser?.email || 'Unknown')
    setEditingTraining(null)
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) throw new Error('Upload failed')
    
    const data = await response.json()
    return data.url || data.file_url
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
        <div className="text-center">Загрузка тренировок...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Управление тренировками</h1>
        <div className="flex gap-4">
          <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900">
            ← Назад в админку
          </Link>
          <button
            onClick={() => {
              if (showCreateForm) {
                setShowCreateForm(false);
                resetForm();
              } else {
                setShowCreateForm(true);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showCreateForm ? 'Отменить' : '+ Новая тренировка'}
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingTraining ? 'Редактировать тренировку' : 'Создать новую тренировку'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заголовок *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL) *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="training-url-slug"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Подзаголовок
              </label>
              <input
                type="text"
                value={subheader}
                onChange={(e) => setSubheader(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Уровень *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="beginner">Начальный</option>
                  <option value="intermediate">Средний</option>
                  <option value="advanced">Продвинутый</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Продолжительность (минуты)
                </label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя автора *
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Изображение обложки
              </label>
              <input
                type="text"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg or /uploads/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Контент *
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Напишите вашу тренировку здесь..."
                rows={15}
                onImageUpload={handleImageUpload}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitLoading ? 'Сохранение...' : (editingTraining ? 'Обновить тренировку' : 'Создать тренировку')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Отменить
              </button>
             
            </div>
          </form>
        </div>
      )}

      {/* Trainings List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заголовок
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Уровень
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Продолжительность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Автор
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статистика
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trainings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Тренировки не найдены. Создайте вашу первую тренировку!
                  </td>
                </tr>
              ) : (
                trainings.map((training) => (
                  <tr key={training.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{training.title}</div>
                      <div className="text-sm text-gray-500">{training.subheader}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${training.level === 'beginner' ? 'bg-green-100 text-green-800' : ''}
                        ${training.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${training.level === 'advanced' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {training.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {training.durationMinutes ? `${training.durationMinutes} min` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {training.authorName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>👁️ {training.views || 0}</div>
                      <div>❤️ {training.likes || 0}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(training)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(training.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

