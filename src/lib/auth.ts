import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '@/models/User'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m'
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d'

export interface UserPayload {
  id: string
  email: string
  username: string
  isAdmin: boolean
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

export const generateTokens = (user: UserPayload) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRE as any })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE as any })
  
  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string): UserPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch {
    return null
  }
}

export const verifyRefreshToken = (token: string): { id: string } | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string }
  } catch {
    return null
  }
}

export const getUserFromToken = async (token: string) => {
  const payload = verifyAccessToken(token)
  if (!payload) return null

  const user = await User.findById(payload.id).select('-passwordHash')
  return user
}
