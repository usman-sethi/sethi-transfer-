import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { config } from './src/server/config/env.js';
import { connectDatabase } from './src/server/config/db.js';
import authRoutes from './src/server/routes/auth.js';
import fileRoutes from './src/server/routes/files.js';
import storageRoutes from './src/server/routes/storage.js';
import healthRoutes from './src/server/routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  // Basic security and parsing middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Request logger for diagnostic visibility
  app.use((req, res, next) => {
    if (!req.url.startsWith('/@') && !req.url.startsWith('/node_modules') && !req.url.startsWith('/src')) {
      console.log(`[HTTP ${req.method}] ${req.originalUrl}`);
    }
    next();
  });

  // Connect to MongoDB Atlas (graceful non-blocking)
  await connectDatabase();

  // Mount API routes with flexible versioned and unversioned paths
  app.use(['/api/v1/auth', '/api/auth', '/auth'], authRoutes);
  app.use(['/api/v1/files', '/api/files', '/files'], fileRoutes);
  app.use(['/api/v1/storage', '/api/storage', '/storage'], storageRoutes);
  app.use(['/api/v1/health', '/api/health', '/health'], healthRoutes);

  // Dedicated 404 handler for API routes to always return structured JSON
  app.all(['/api/*', '/api/v1/*'], (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite dev middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = config.port || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sethi Transfer] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Sethi Transfer] Environment: ${isProduction ? 'Production' : 'Development'}`);
  });
}

startServer().catch((err) => {
  console.error('[Sethi Transfer] Fatal startup error:', err);
  process.exit(1);
});
