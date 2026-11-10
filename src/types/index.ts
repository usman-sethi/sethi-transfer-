export type FileCategory = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  storageLimit: number;
  storageUsed: number;
  createdAt?: string;
}

export interface FileItem {
  _id: string;
  id?: string;
  userId: string;
  originalName: string;
  displayName: string;
  mimeType: string;
  extension: string;
  size: number;
  resourceType: 'image' | 'video' | 'raw';
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  storageDeliveryType: 'authenticated' | 'private' | 'upload' | 'local';
  checksum?: string;
  category: FileCategory;
  isStarred: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageStats {
  storageUsed: number;
  storageLimit: number;
  fileCount: number;
  categoryBreakdown: Record<FileCategory, { count: number; bytes: number }>;
}

export interface SystemHealth {
  platform: string;
  status: string;
  database: {
    engine: string;
    connected: boolean;
    status: string;
    host: string | null;
    hasUriConfigured: boolean;
    error: string | null;
  };
  storage: {
    provider: string;
    configured: boolean;
    cloudName: string | null;
    status: string;
  };
}

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export type ActiveTab = 'my-files' | 'recent' | 'starred' | 'trash' | 'storage';
export type ViewMode = 'grid' | 'list';
export type SortField = 'createdAt' | 'displayName' | 'size';
export type SortOrder = 'asc' | 'desc';
