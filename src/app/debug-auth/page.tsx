'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function DebugAuthPage() {
  const { currentUser, token } = useAuth()
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const [tokenData, setTokenData] = useState<any>(null)

  useEffect(() => {
    // Get data from localStorage
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user')
      const savedToken = localStorage.getItem('accessToken')
      const savedRefreshToken = localStorage.getItem('refreshToken')
      
      setLocalStorageData({
        user: savedUser ? JSON.parse(savedUser) : null,
        hasAccessToken: !!savedToken,
        hasRefreshToken: !!savedRefreshToken
      })

      // Decode JWT token (just the payload, don't verify)
      if (savedToken) {
        try {
          const parts = savedToken.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            setTokenData(payload)
          }
        } catch (e) {
          console.error('Failed to decode token:', e)
        }
      }
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="space-y-6">
        {/* Current User from Context */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current User (from AuthContext)</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(currentUser, null, 2)}
          </pre>
          <div className="mt-4">
            <p className="font-semibold">Is Admin: <span className={currentUser?.isAdmin ? 'text-green-600' : 'text-red-600'}>{currentUser?.isAdmin ? '✅ YES' : '❌ NO'}</span></p>
          </div>
        </div>

        {/* Token */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Token from Context</h2>
          <p className="text-sm break-all bg-gray-100 p-4 rounded">
            {token || 'No token'}
          </p>
        </div>

        {/* Decoded Token Payload */}
        {tokenData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Decoded Token Payload</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(tokenData, null, 2)}
            </pre>
            <div className="mt-4">
              <p className="font-semibold">Is Admin in Token: <span className={tokenData?.isAdmin ? 'text-green-600' : 'text-red-600'}>{tokenData?.isAdmin ? '✅ YES' : '❌ NO'}</span></p>
            </div>
          </div>
        )}

        {/* LocalStorage Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Data</h2>
          <div className="space-y-2 mb-4">
            <p>Has Access Token: <span className={localStorageData?.hasAccessToken ? 'text-green-600' : 'text-red-600'}>{localStorageData?.hasAccessToken ? '✅ YES' : '❌ NO'}</span></p>
            <p>Has Refresh Token: <span className={localStorageData?.hasRefreshToken ? 'text-green-600' : 'text-red-600'}>{localStorageData?.hasRefreshToken ? '✅ YES' : '❌ NO'}</span></p>
          </div>
          <h3 className="font-semibold mb-2">User Object in LocalStorage:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(localStorageData?.user, null, 2)}
          </pre>
          {localStorageData?.user && (
            <div className="mt-4">
              <p className="font-semibold">Is Admin in LocalStorage: <span className={localStorageData?.user?.isAdmin ? 'text-green-600' : 'text-red-600'}>{localStorageData?.user?.isAdmin ? '✅ YES' : '❌ NO'}</span></p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting Steps</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Check if "Is Admin" is YES in all sections above</li>
            <li>If NO, check your database: <code className="bg-white px-2 py-1 rounded">node check-admin-status.js your@email.com</code></li>
            <li>If your user is not admin in DB, run: <code className="bg-white px-2 py-1 rounded">node make-admin.js your@email.com</code></li>
            <li>After making admin, you MUST log out and log back in to get new tokens</li>
            <li>Check the browser console for detailed authentication logs</li>
          </ol>
        </div>
      </div>
    </div>
  )
}



