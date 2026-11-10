import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { DataStore } from '../models/store.js';

const router = Router();
router.use(requireAuth);

// GET /api/v1/storage/usage
router.get('/usage', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const stats = await DataStore.getStorageStats(userId);
    res.json({
      success: true,
      ...stats,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve storage statistics' });
  }
});

export default router;
