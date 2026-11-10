import { Router, Response } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { DataStore } from '../models/store.js';
import { analyzeFile } from '../utils/fileDetector.js';
import { sanitizeFilename } from '../utils/sanitize.js';
import { uploadToCloudinary, deleteFromCloudinary, getAuthorizedUrl } from '../config/cloudinary.js';
import { config } from '../config/env.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max per file
  },
});

// All file routes require authentication
router.use(requireAuth);

// POST /api/v1/files/upload
router.post('/upload', upload.array('files', 10), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: 'No files provided for upload.' });
      return;
    }

    const userId = req.user!.id;
    const user = await DataStore.findUserById(userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'User account not found.' });
      return;
    }

    // Check storage limits
    const incomingBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (user.storageUsed + incomingBytes > user.storageLimit) {
      res.status(413).json({
        success: false,
        error: `Upload would exceed your storage quota of ${(user.storageLimit / (1024 ** 3)).toFixed(1)} GB.`,
      });
      return;
    }

    const uploadedRecords: any[] = [];

    for (const file of files) {
      const sanitizedName = sanitizeFilename(file.originalname);
      const analysis = analyzeFile(sanitizedName, file.mimetype, file.buffer);
      const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

      let cloudinaryPublicId = '';
      let cloudinaryUrl = '';
      let deliveryType: 'authenticated' | 'private' | 'upload' | 'local' = 'local';

      if (config.cloudinary.isConfigured) {
        try {
          const cloudResult = await uploadToCloudinary(file.buffer, {
            folder: `sethi_transfer/${userId}`,
            resourceType: analysis.resourceType,
            filename: sanitizedName,
          });
          cloudinaryPublicId = cloudResult.public_id;
          cloudinaryUrl = cloudResult.secure_url;
          deliveryType = 'upload';
        } catch (cloudErr: any) {
          console.warn('[Cloudinary] Upload failed, saving local buffer:', cloudErr.message);
          deliveryType = 'local';
        }
      }

      const fileRecord = await DataStore.createFile({
        userId,
        originalName: sanitizedName,
        displayName: sanitizedName,
        mimeType: analysis.detectedMimeType,
        extension: analysis.normalizedExtension,
        size: file.size,
        resourceType: analysis.resourceType,
        cloudinaryPublicId,
        cloudinaryUrl,
        storageDeliveryType: deliveryType,
        checksum,
        category: analysis.category,
        fileData: deliveryType === 'local' ? file.buffer.toString('base64') : undefined,
      });

      const responseFile = { ...fileRecord };
      delete responseFile.fileData;
      uploadedRecords.push(responseFile);
    }

    res.status(201).json({
      success: true,
      message: `Successfully uploaded ${uploadedRecords.length} file(s)`,
      files: uploadedRecords,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Upload failed', details: err.message });
  }
});

// GET /api/v1/files
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const isStarred = req.query.isStarred === 'true' ? true : req.query.isStarred === 'false' ? false : undefined;
    const isDeleted = req.query.isDeleted === 'true';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';
    const limit = Math.min(100, parseInt((req.query.limit as string) || '50', 10));
    const skip = parseInt((req.query.skip as string) || '0', 10);

    const result = await DataStore.listFiles(userId, {
      category,
      search,
      isStarred,
      isDeleted,
      sortBy,
      order,
      limit,
      skip,
    });

    res.json({
      success: true,
      files: result.files,
      total: result.total,
      limit,
      skip,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve files', details: err.message });
  }
});

// GET /api/v1/files/recent
router.get('/recent', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await DataStore.listFiles(userId, {
      isDeleted: false,
      sortBy: 'createdAt',
      order: 'desc',
      limit: 12,
    });
    res.json({ success: true, files: result.files });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve recent files' });
  }
});

// GET /api/v1/files/starred
router.get('/starred', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const result = await DataStore.listFiles(userId, {
      isStarred: true,
      isDeleted: false,
      sortBy: 'createdAt',
      order: 'desc',
    });
    res.json({ success: true, files: result.files });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve starred files' });
  }
});

// GET /api/v1/files/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const file = await DataStore.findFileById(req.params.id, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }
    const clean = { ...file };
    delete clean.fileData;
    res.json({ success: true, file: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Error fetching file metadata' });
  }
});

// GET /api/v1/files/:id/download
router.get('/:id/download', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const file = await DataStore.findFileById(req.params.id, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found or unauthorized' });
      return;
    }

    const downloadFilename = file.displayName || file.originalName;
    const encodedFilename = encodeURIComponent(downloadFilename);

    res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', file.size.toString());

    // If Cloudinary URL available, stream from Cloudinary
    if (file.cloudinaryUrl && config.cloudinary.isConfigured) {
      const signedUrl = getAuthorizedUrl(file.cloudinaryPublicId, file.resourceType) || file.cloudinaryUrl;
      const upstream = await fetch(signedUrl);
      if (upstream.ok && upstream.body) {
        // Stream directly
        const reader = upstream.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
        res.end();
        return;
      }
    }

    // Stream from local buffer
    if (file.fileData) {
      const buffer = Buffer.from(file.fileData, 'base64');
      res.send(buffer);
      return;
    }

    res.status(404).json({ success: false, error: 'File binary content is missing' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Streaming download error', details: err.message });
  }
});

// GET /api/v1/files/:id/preview
router.get('/:id/preview', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const file = await DataStore.findFileById(req.params.id, req.user!.id);
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    if (file.cloudinaryUrl && config.cloudinary.isConfigured) {
      const signedUrl = getAuthorizedUrl(file.cloudinaryPublicId, file.resourceType) || file.cloudinaryUrl;
      res.redirect(signedUrl);
      return;
    }

    if (file.fileData) {
      const buffer = Buffer.from(file.fileData, 'base64');
      res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
      res.send(buffer);
      return;
    }

    res.status(404).json({ success: false, error: 'File data unavailable for preview' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Preview error', details: err.message });
  }
});

// PATCH /api/v1/files/:id
router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { displayName, isStarred } = req.body;
    const updates: any = {};
    if (typeof displayName === 'string' && displayName.trim().length > 0) {
      updates.displayName = sanitizeFilename(displayName.trim());
    }
    if (typeof isStarred === 'boolean') {
      updates.isStarred = isStarred;
    }

    const updated = await DataStore.updateFile(req.params.id, req.user!.id, updates);
    if (!updated) {
      res.status(404).json({ success: false, error: 'File not found or unauthorized' });
      return;
    }

    const clean = { ...updated };
    delete clean.fileData;
    res.json({ success: true, file: clean });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to update file' });
  }
});

// DELETE /api/v1/files/:id (Soft-delete or permanent purge)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const permanent = req.query.permanent === 'true';
    const userId = req.user!.id;

    if (permanent) {
      const result = await DataStore.permanentDeleteFile(req.params.id, userId);
      if (!result.deleted) {
        res.status(404).json({ success: false, error: 'File not found or unauthorized' });
        return;
      }
      if (result.file?.cloudinaryPublicId) {
        await deleteFromCloudinary(result.file.cloudinaryPublicId, result.file.resourceType);
      }
      res.json({ success: true, message: 'File permanently deleted' });
      return;
    }

    // Soft delete to trash
    const success = await DataStore.softDeleteFile(req.params.id, userId);
    if (!success) {
      res.status(404).json({ success: false, error: 'File not found or unauthorized' });
      return;
    }
    res.json({ success: true, message: 'File moved to trash' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Delete operation failed' });
  }
});

// POST /api/v1/files/:id/restore
router.post('/:id/restore', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const success = await DataStore.restoreFile(req.params.id, req.user!.id);
    if (!success) {
      res.status(404).json({ success: false, error: 'File not found or unauthorized' });
      return;
    }
    res.json({ success: true, message: 'File restored from trash' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Restore operation failed' });
  }
});

export default router;
