import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { DataStore } from '../models/store.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  storageLimit: number;
  storageUsed: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required. Please sign in.' });
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
      return;
    }

    const user = await DataStore.findUserById(payload.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'Account associated with token no longer exists.' });
      return;
    }

    req.user = {
      id: String(user._id || user.id),
      email: user.email,
      name: user.name,
      storageLimit: user.storageLimit,
      storageUsed: user.storageUsed,
    };

    next();
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Authentication error', details: err.message });
  }
}
