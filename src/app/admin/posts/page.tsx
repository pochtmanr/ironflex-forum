'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface Post {
  id: string
  topicId: string
  userId: string
  userName: string
  userEmail: string
  content: string
  mediaLinks: string[]
  likes: number
  dislikes: number
  isEdited: boolean
  editedAt?: string
  isActive: boolean
  parentPostId?: string
  createdAt: string
  updatedAt: string
  topicTitle?: string
  categoryName?: string
}

export default function AdminPosts() {
  const { } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
      } else {
        console.error('Failed to fetch posts')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    setDeleteLoading(postId)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId))
        alert('Post deleted successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    } finally {
      setDeleteLoading(null)
    }
  }

  const startEdit = (post: Post) => {
    setEditingPost(post.id)
    setEditContent(post.content)
  }

  const cancelEdit = () => {
    setEditingPost(null)
    setEditContent('')
  }

  const saveEdit = async (postId: string) => {
    if (!editContent.trim()) {
      alert('Content cannot be empty')
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: editContent.trim() })
      })

      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, content: editContent.trim(), isEdited: true, editedAt: new Date().toISOString() }
            : post
        ))
        setEditingPost(null)
        setEditContent('')
        alert('Post updated successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update post')
      }
    } catch (error) {
      console.error('Error updating post:', error)
      alert('Failed to update post')
    }
  }

  const togglePostStatus = async (postId: string, currentIsActive: boolean) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/posts/${postId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentIsActive })
      })

      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, isActive: !currentIsActive }
            : post
        ))
        alert(`Post ${!currentIsActive ? 'activated' : 'deactivated'}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update post status')
      }
    } catch (error) {
      console.error('Error updating post status:', error)
      alert('Failed to update post status')
    }
  }

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.topicTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="text-gray-500">Loading posts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post Management</h1>
        <div className="text-sm text-gray-500">
          Total Posts: {posts.length}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search posts by content, author, topic, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingPost === post.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveEdit(post.id)}
                            className="px-3 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-3">
                          {post.content}
                        </p>
                        {post.mediaLinks && post.mediaLinks.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-blue-600">📎 {post.mediaLinks.length} attachment(s)</span>
                          </div>
                        )}
                        {post.isEdited && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-400">
                              ✏️ Edited {post.editedAt ? new Date(post.editedAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {post.userName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {post.userEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      {post.topicTitle && (
                        <Link
                          href={`/topic/${post.topicId}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium line-clamp-2"
                        >
                          {post.topicTitle}
                        </Link>
                      )}
                      {post.categoryName && (
                        <div className="text-xs text-gray-500 mt-1">
                          in {post.categoryName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        👍 {post.likes}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        👎 {post.dislikes}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      post.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {post.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {editingPost === post.id ? null : (
                        <>
                          <button
                            onClick={() => startEdit(post)}
                            className="px-3 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => togglePostStatus(post.id, post.isActive)}
                            className={`px-3 py-1 text-xs font-medium rounded ${
                              post.isActive
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {post.isActive ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            disabled={deleteLoading === post.id}
                            className="px-3 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleteLoading === post.id ? '...' : 'Delete'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No posts found matching your search.' : 'No posts found.'}
          </div>
        )}
      </div>
    </div>
  )
}
