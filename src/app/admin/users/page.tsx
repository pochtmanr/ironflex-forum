'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface User {
  id: string
  email: string
  username: string
  displayName?: string
  photoURL?: string
  isAdmin: boolean
  isActive: boolean
  isVerified: boolean
  createdAt: string
  lastLogin?: string
  googleId?: string
  githubId?: string
}

export default function AdminUsers() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    setDeleteLoading(userId)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId))
        alert('User deleted successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    } finally {
      setDeleteLoading(null)
    }
  }

  const toggleUserRole = async (userId: string, currentIsAdmin: boolean) => {
    setRoleLoading(userId)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAdmin: !currentIsAdmin })
      })

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isAdmin: !currentIsAdmin }
            : user
        ))
        alert(`User role updated to ${!currentIsAdmin ? 'Admin' : 'User'}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update user role')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role')
    } finally {
      setRoleLoading(null)
    }
  }

  const toggleUserStatus = async (userId: string, currentIsActive: boolean) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentIsActive })
      })

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, isActive: !currentIsActive }
            : user
        ))
        alert(`User ${!currentIsActive ? 'activated' : 'deactivated'}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Failed to update user status')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="text-gray-500">Loading users...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <div className="text-sm text-gray-500">
          Total Users: {users.length}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OAuth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {user.photoURL ? (
                        <img
                          className="h-10 w-10 rounded-full mr-3"
                          src={user.photoURL}
                          alt={user.username}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <span className="text-gray-600 font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName || user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.isVerified && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isAdmin 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-1">
                      {user.googleId && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Google
                        </span>
                      )}
                      {user.githubId && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          GitHub
                        </span>
                      )}
                      {!user.googleId && !user.githubId && (
                        <span className="text-xs text-gray-400">Email</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    {user.lastLogin && (
                      <div className="text-xs text-gray-400">
                        Last: {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleUserRole(user.id, user.isAdmin)}
                        disabled={roleLoading === user.id || user.id === currentUser?.id}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          user.isAdmin
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {roleLoading === user.id ? '...' : user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                      </button>
                      
                      <button
                        onClick={() => toggleUserStatus(user.id, user.isActive)}
                        disabled={user.id === currentUser?.id}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          user.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      
                      <button
                        onClick={() => deleteUser(user.id)}
                        disabled={deleteLoading === user.id || user.id === currentUser?.id}
                        className="px-3 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleteLoading === user.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found.
          </div>
        )}
      </div>
    </div>
  )
}
