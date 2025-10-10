'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  username: string
  displayName?: string
  photoURL?: string
  isAdmin: boolean
}

interface ClientAuthProps {
  children: (auth: { user: User | null; token: string | null; isLoading: boolean }) => React.ReactNode
}

export default function ClientAuth({ children }: ClientAuthProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      const savedUser = localStorage.getItem('user')
      const savedToken = localStorage.getItem('accessToken')

      console.log('ClientAuth: Loading from localStorage')
      console.log('User data:', savedUser ? 'Present' : 'Missing')
      console.log('Token data:', savedToken ? 'Present' : 'Missing')

      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setToken(savedToken)
        console.log('ClientAuth: User and token loaded successfully')
      }
    } catch (error) {
      console.error('ClientAuth: Error loading auth data:', error)
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return <>{children({ user, token, isLoading })}</>
}
