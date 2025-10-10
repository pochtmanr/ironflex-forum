'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { RichTextEditor } from '@/components/UI/RichTextEditor'

interface Article {
  id: string
  title: string
  slug: string
  subheader: string
  content: string
  coverImageUrl: string
  tags: string
  likes?: number
  views?: number
  commentCount?: number
  created_at: string
  updated_at: string
}

export default function AdminArticles() {
  const { currentUser } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [subheader, setSubheader] = useState('')
  const [content, setContent] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [tags, setTags] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/articles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const url = editingArticle ? `/api/admin/articles/${editingArticle.id}` : '/api/admin/articles'
      const method = editingArticle ? 'PUT' : 'POST'

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
          tags
        })
      })

      if (response.ok) {
        resetForm()
        fetchArticles()
        setShowCreateForm(false)
        setEditingArticle(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save article')
      }
    } catch (error) {
      console.error('Error saving article:', error)
      alert('Error saving article')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleEdit = (article: Article) => {
    setEditingArticle(article)
    setTitle(article.title)
    setSlug(article.slug)
    setSubheader(article.subheader)
    setContent(article.content)
    setCoverImageUrl(article.coverImageUrl)
    setTags(article.tags)
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchArticles()
      } else {
        alert('Failed to delete article')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Error deleting article')
    }
  }

  const resetForm = () => {
    setTitle('')
    setSlug('')
    setSubheader('')
    setContent('')
    setCoverImageUrl('')
    setTags('')
    setEditingArticle(null)
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">Loading articles...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Articles</h1>
        <div className="flex gap-4">
          <Link href="/admin" className="px-4 py-2 text-gray-600 hover:text-gray-900">
            ← Back to Admin
          </Link>
          <button
            onClick={() => {
              resetForm()
              setShowCreateForm(!showCreateForm)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : '+ New Article'}
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editingArticle ? 'Edit Article' : 'Create New Article'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
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
                placeholder="article-url-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subheader
              </label>
              <input
                type="text"
                value={subheader}
                onChange={(e) => setSubheader(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image URL
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
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="javascript, tutorial, beginner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content *
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your article content here..."
                rows={15}
                onImageUpload={handleImageUpload}
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submitLoading ? 'Saving...' : (editingArticle ? 'Update Article' : 'Create Article')}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowCreateForm(false)
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Articles List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No articles found. Create your first article!
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{article.title}</div>
                      <div className="text-sm text-gray-500">{article.subheader}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      /{article.slug}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {article.tags}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>👁️ {article.views || 0}</div>
                      <div>❤️ {article.likes || 0}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(article)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
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

