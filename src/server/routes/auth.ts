import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { DataStore } from '../models/store.js';
import { hashPassword, verifyPassword, hashToken } from '../utils/crypto.js';
import { generateAccessToken, generateAndStoreRefreshToken } from '../utils/jwt.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper to set refresh token cookie
function setAuthCookies(res: Response, refreshToken: string, accessToken: string) {
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });
}

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Validation error' });
      return;
    }

    const { name, email, password } = parse.data;
    const existing = await DataStore.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await DataStore.createUser({ name, email, passwordHash });
    const userId = String(user._id || user.id);

    const accessToken = generateAccessToken({ userId, email: user.email });
    const refreshToken = await generateAndStoreRefreshToken(userId);

    setAuthCookies(res, refreshToken, accessToken);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        storageLimit: user.storageLimit,
        storageUsed: user.storageUsed,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Registration failed', details: err.message });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ success: false, error: parse.error.issues[0]?.message || 'Validation error' });
      return;
    }

    const { email, password } = parse.data;
    const user = await DataStore.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    const userId = String(user._id || user.id);
    const accessToken = generateAccessToken({ userId, email: user.email });
    const refreshToken = await generateAndStoreRefreshToken(userId);

    setAuthCookies(res, refreshToken, accessToken);

    res.json({
      success: true,
      message: 'Signed in successfully',
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        storageLimit: user.storageLimit,
        storageUsed: user.storageUsed,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Login failed', details: err.message });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!incomingToken) {
      res.status(401).json({ success: false, error: 'No refresh token provided.' });
      return;
    }

    const tokenHash = hashToken(incomingToken);
    const storedToken = await DataStore.findRefreshToken(tokenHash);

    if (!storedToken) {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
      return;
    }

    // Revoke old token and rotate
    await DataStore.revokeRefreshToken(tokenHash);

    const user = await DataStore.findUserById(String(storedToken.userId));
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found.' });
      return;
    }

    const userId = String(user._id || user.id);
    const newAccessToken = generateAccessToken({ userId, email: user.email });
    const newRefreshToken = await generateAndStoreRefreshToken(userId);

    setAuthCookies(res, newRefreshToken, newAccessToken);

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Token refresh failed', details: err.message });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const incomingToken = req.cookies?.refresh_token || req.body?.refreshToken;
    if (incomingToken) {
      const tokenHash = hashToken(incomingToken);
      await DataStore.revokeRefreshToken(tokenHash);
    }

    res.clearCookie('refresh_token');
    res.clearCookie('access_token');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Logout failed', details: err.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await DataStore.findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: String(user._id || user.id),
      name: user.name,
      email: user.email,
      storageLimit: user.storageLimit,
      storageUsed: user.storageUsed,
      createdAt: user.createdAt,
    },
  });
});

export default router;
