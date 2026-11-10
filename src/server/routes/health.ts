import { Router, Request, Response } from 'express';
import { dbState } from '../config/db.js';
import { cloudinaryState } from '../config/cloudinary.js';
import { config } from '../config/env.js';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    platform: 'Sethi Transfer',
    status: 'online',
    timestamp: new Date().toISOString(),
    database: {
      engine: 'MongoDB Atlas',
      connected: dbState.connected,
      status: dbState.status,
      host: dbState.host,
      hasUriConfigured: config.hasMongo,
      error: dbState.error,
    },
    storage: {
      provider: 'Cloudinary',
      configured: config.cloudinary.isConfigured,
      cloudName: config.cloudinary.cloudName ? `${config.cloudinary.cloudName.substring(0, 3)}***` : null,
      status: cloudinaryState.status,
    },
    auth: {
      algorithm: 'Argon2id + JWT + Refresh Token Rotation',
    },
  });
});

export default router;
