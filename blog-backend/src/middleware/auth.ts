import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    isAdmin: boolean;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user still exists and is active
    const [users] = await pool.execute(
      'SELECT id, email, username, is_admin FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const user = users[0] as any;
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const [users] = await pool.execute(
      'SELECT id, email, username, is_admin FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (Array.isArray(users) && users.length > 0) {
      const user = users[0] as any;
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.is_admin
      };
    }
  } catch (error) {
    // Token is invalid, but we continue without user
  }

  next();
};
