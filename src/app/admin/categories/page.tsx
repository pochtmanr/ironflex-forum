'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Category {
  id: string
  name: string
  description: string
  slug: string
  topic_count: number
  post_count: number
  last_activity: string
  isActive?: boolean
}

export default function AdminCategories() {
  const { } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: ''
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forum/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories'
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setFormData({ name: '', description: '', slug: '' })
        setShowForm(false)
        setEditingId(null)
        fetchCategories()
        alert(editingId ? 'Категория обновлена!' : 'Категория создана!')
      } else {
        const error = await response.json()
        alert(error.error || `Failed to ${editingId ? 'update' : 'create'} category`)
      }
    } catch (error) {
      console.error(`Error ${editingId ? 'updating' : 'creating'} category:`, error)
      alert(`Failed to ${editingId ? 'update' : 'create'} category`)
    }
  }

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description,
      slug: category.slug
    })
    setEditingId(category.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Вы уверены, что хотите удалить категорию "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchCategories()
        alert('Категория удалена!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  const handleCancelEdit = () => {
    setFormData({ name: '', description: '', slug: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  // Admin check removed for easier access

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Управление категориями</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gray-500 text-white px-3 py-1.5 rounded-xl border-2 border-gray-200/80 hover:bg-gray-600 transition-colors"
        >
          {showForm ? 'Закрыть' : 'Добавить категорию'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingId ? 'Редактировать категорию' : 'Создать новую категорию'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название категории
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание категории
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-500 text-white px-3 py-1.5 rounded-xl border-2 border-blue-200/80 hover:bg-blue-600 transition-colors shadow-md"
              >
                {editingId ? 'Обновить категорию' : 'Создать категорию'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 text-white px-3 py-1.5 rounded-xl border-2 border-gray-200/80 hover:bg-gray-600 transition-colors shadow-md"
              >
                Отменить
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Загрузка категорий...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Темы
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Посты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Последняя активность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {category.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.topic_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {category.post_count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(category.last_activity).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Редактировать
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {categories.length === 0 && (
            <div className="text-center py-8 text-gray-500/90">
              Нет категорий. Создайте свою первую категорию выше.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
