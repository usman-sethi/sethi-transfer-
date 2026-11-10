import { dbState } from '../config/db.js';
import { UserModel, IUser } from './User.js';
import { FileModel, IFile } from './File.js';
import { RefreshTokenModel, IRefreshToken } from './RefreshToken.js';
import { FileCategory, CloudinaryResourceType } from '../utils/fileDetector.js';
import crypto from 'node:crypto';

// In-memory fallback stores
const memoryUsers = new Map<string, any>();
const memoryFiles = new Map<string, any>();
const memoryRefreshTokens = new Map<string, any>();

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
}

export interface CreateFileData {
  userId: string;
  originalName: string;
  displayName: string;
  mimeType: string;
  extension: string;
  size: number;
  resourceType: CloudinaryResourceType;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  storageDeliveryType: 'authenticated' | 'private' | 'upload' | 'local';
  checksum?: string;
  category: FileCategory;
  fileData?: string;
}

export const DataStore = {
  // USER METHODS
  async findUserByEmail(email: string): Promise<any | null> {
    const cleanEmail = email.toLowerCase().trim();
    if (dbState.connected) {
      return await UserModel.findOne({ email: cleanEmail }).lean();
    }
    for (const user of memoryUsers.values()) {
      if (user.email === cleanEmail) {
        return { ...user };
      }
    }
    return null;
  },

  async findUserById(id: string): Promise<any | null> {
    if (dbState.connected) {
      return await UserModel.findById(id).lean();
    }
    const user = memoryUsers.get(id);
    return user ? { ...user } : null;
  },

  async createUser(data: CreateUserData): Promise<any> {
    const cleanEmail = data.email.toLowerCase().trim();
    if (dbState.connected) {
      const doc = new UserModel({
        ...data,
        email: cleanEmail,
        storageLimit: 5 * 1024 * 1024 * 1024,
        storageUsed: 0,
      });
      await doc.save();
      return doc.toObject();
    }

    const id = crypto.randomUUID();
    const newUser = {
      _id: id,
      id,
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash: data.passwordHash,
      avatar: data.avatar || '',
      storageLimit: 5 * 1024 * 1024 * 1024,
      storageUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryUsers.set(id, newUser);
    return { ...newUser };
  },

  async updateUserStorage(userId: string, deltaBytes: number): Promise<void> {
    if (dbState.connected) {
      await UserModel.findByIdAndUpdate(userId, {
        $inc: { storageUsed: deltaBytes },
      });
      return;
    }
    const user = memoryUsers.get(userId);
    if (user) {
      user.storageUsed = Math.max(0, (user.storageUsed || 0) + deltaBytes);
      user.updatedAt = new Date();
    }
  },

  // REFRESH TOKEN METHODS
  async createRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    if (dbState.connected) {
      await RefreshTokenModel.create({
        userId,
        tokenHash,
        expiresAt,
      });
      return;
    }
    const id = crypto.randomUUID();
    memoryRefreshTokens.set(tokenHash, {
      _id: id,
      userId,
      tokenHash,
      expiresAt,
      createdAt: new Date(),
    });
  },

  async findRefreshToken(tokenHash: string): Promise<any | null> {
    if (dbState.connected) {
      return await RefreshTokenModel.findOne({ tokenHash, revokedAt: null }).lean();
    }
    const token = memoryRefreshTokens.get(tokenHash);
    if (!token) return null;
    if (token.revokedAt) return null;
    if (new Date() > new Date(token.expiresAt)) {
      memoryRefreshTokens.delete(tokenHash);
      return null;
    }
    return { ...token };
  },

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    if (dbState.connected) {
      await RefreshTokenModel.updateOne({ tokenHash }, { revokedAt: new Date() });
      return;
    }
    const token = memoryRefreshTokens.get(tokenHash);
    if (token) {
      token.revokedAt = new Date();
    }
  },

  // FILE METHODS
  async createFile(data: CreateFileData): Promise<any> {
    if (dbState.connected) {
      const doc = new FileModel({
        ...data,
        isStarred: false,
        isDeleted: false,
        deletedAt: null,
      });
      await doc.save();
      await this.updateUserStorage(data.userId, data.size);
      return doc.toObject();
    }

    const id = crypto.randomUUID();
    const newFile = {
      _id: id,
      id,
      ...data,
      isStarred: false,
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryFiles.set(id, newFile);
    await this.updateUserStorage(data.userId, data.size);
    return { ...newFile };
  },

  async findFileById(id: string, userId: string): Promise<any | null> {
    if (dbState.connected) {
      return await FileModel.findOne({ _id: id, userId }).lean();
    }
    const file = memoryFiles.get(id);
    if (file && String(file.userId) === String(userId)) {
      return { ...file };
    }
    return null;
  },

  async listFiles(
    userId: string,
    options: {
      category?: string;
      isStarred?: boolean;
      isDeleted?: boolean;
      search?: string;
      sortBy?: string;
      order?: 'asc' | 'desc';
      limit?: number;
      skip?: number;
    }
  ): Promise<{ files: any[]; total: number }> {
    const isDeleted = options.isDeleted ?? false;
    const sortField = options.sortBy || 'createdAt';
    const sortOrder = options.order === 'asc' ? 1 : -1;

    if (dbState.connected) {
      const query: any = { userId, isDeleted };
      if (options.category && options.category !== 'all') {
        query.category = options.category;
      }
      if (typeof options.isStarred === 'boolean') {
        query.isStarred = options.isStarred;
      }
      if (options.search) {
        query.originalName = { $regex: options.search, $options: 'i' };
      }

      const total = await FileModel.countDocuments(query);
      const files = await FileModel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(options.skip || 0)
        .limit(options.limit || 50)
        .select('-fileData') // omit heavy raw buffer
        .lean();

      return { files, total };
    }

    // In-memory filter
    let results: any[] = [];
    for (const f of memoryFiles.values()) {
      if (String(f.userId) !== String(userId)) continue;
      if (Boolean(f.isDeleted) !== isDeleted) continue;
      if (options.category && options.category !== 'all' && f.category !== options.category) continue;
      if (typeof options.isStarred === 'boolean' && Boolean(f.isStarred) !== options.isStarred) continue;
      if (options.search && !f.originalName.toLowerCase().includes(options.search.toLowerCase())) continue;
      
      const copy = { ...f };
      delete copy.fileData;
      results.push(copy);
    }

    // Sort
    results.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortOrder === 1 ? -1 : 1;
      if (valA > valB) return sortOrder === 1 ? 1 : -1;
      return 0;
    });

    const total = results.length;
    const paginated = results.slice(options.skip || 0, (options.skip || 0) + (options.limit || 50));
    return { files: paginated, total };
  },

  async updateFile(id: string, userId: string, updates: Partial<IFile>): Promise<any | null> {
    if (dbState.connected) {
      return await FileModel.findOneAndUpdate(
        { _id: id, userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
    }
    const file = memoryFiles.get(id);
    if (!file || String(file.userId) !== String(userId)) return null;

    Object.assign(file, updates, { updatedAt: new Date() });
    return { ...file };
  },

  async softDeleteFile(id: string, userId: string): Promise<boolean> {
    return !!(await this.updateFile(id, userId, { isDeleted: true, deletedAt: new Date() }));
  },

  async restoreFile(id: string, userId: string): Promise<boolean> {
    return !!(await this.updateFile(id, userId, { isDeleted: false, deletedAt: null }));
  },

  async permanentDeleteFile(id: string, userId: string): Promise<{ deleted: boolean; file: any | null }> {
    if (dbState.connected) {
      const file = await FileModel.findOneAndDelete({ _id: id, userId }).lean();
      if (file) {
        await this.updateUserStorage(userId, -file.size);
        return { deleted: true, file };
      }
      return { deleted: false, file: null };
    }

    const file = memoryFiles.get(id);
    if (file && String(file.userId) === String(userId)) {
      memoryFiles.delete(id);
      await this.updateUserStorage(userId, -file.size);
      return { deleted: true, file };
    }
    return { deleted: false, file: null };
  },

  async getStorageStats(userId: string): Promise<{
    storageUsed: number;
    storageLimit: number;
    fileCount: number;
    categoryBreakdown: Record<FileCategory, { count: number; bytes: number }>;
  }> {
    const user = await this.findUserById(userId);
    const storageLimit = user?.storageLimit || 5 * 1024 * 1024 * 1024;

    const breakdown: Record<FileCategory, { count: number; bytes: number }> = {
      document: { count: 0, bytes: 0 },
      image: { count: 0, bytes: 0 },
      video: { count: 0, bytes: 0 },
      audio: { count: 0, bytes: 0 },
      archive: { count: 0, bytes: 0 },
      other: { count: 0, bytes: 0 },
    };

    let totalBytes = 0;
    let fileCount = 0;

    if (dbState.connected) {
      const files = await FileModel.find({ userId, isDeleted: false }).select('category size').lean();
      fileCount = files.length;
      for (const f of files) {
        const cat = (f.category in breakdown ? f.category : 'other') as FileCategory;
        breakdown[cat].count += 1;
        breakdown[cat].bytes += f.size || 0;
        totalBytes += f.size || 0;
      }
    } else {
      for (const f of memoryFiles.values()) {
        if (String(f.userId) === String(userId) && !f.isDeleted) {
          fileCount++;
          const cat = (f.category in breakdown ? f.category : 'other') as FileCategory;
          breakdown[cat].count += 1;
          breakdown[cat].bytes += f.size || 0;
          totalBytes += f.size || 0;
        }
      }
    }

    return {
      storageUsed: totalBytes,
      storageLimit,
      fileCount,
      categoryBreakdown: breakdown,
    };
  },
};
