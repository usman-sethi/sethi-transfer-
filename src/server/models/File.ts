import mongoose, { Document, Schema } from 'mongoose';
import { FileCategory, CloudinaryResourceType } from '../utils/fileDetector.js';

export interface IFile extends Document {
  userId: mongoose.Types.ObjectId | string;
  originalName: string;
  displayName: string;
  mimeType: string;
  extension: string;
  size: number;
  resourceType: CloudinaryResourceType;
  cloudinaryPublicId: string;
  cloudinaryUrl?: string;
  storageDeliveryType: 'authenticated' | 'private' | 'upload' | 'local';
  checksum?: string;
  category: FileCategory;
  isStarred: boolean;
  isDeleted: boolean;
  deletedAt?: Date | null;
  fileData?: string; // base64 cached payload for zero-setup local dev streaming
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new Schema<IFile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalName: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true },
    extension: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    resourceType: { type: String, enum: ['image', 'video', 'raw'], default: 'raw' },
    cloudinaryPublicId: { type: String, default: '' },
    cloudinaryUrl: { type: String, default: '' },
    storageDeliveryType: { type: String, enum: ['authenticated', 'private', 'upload', 'local'], default: 'local' },
    checksum: { type: String, default: '' },
    category: {
      type: String,
      enum: ['document', 'image', 'video', 'audio', 'archive', 'other'],
      default: 'other',
      index: true,
    },
    isStarred: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    fileData: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

FileSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
FileSchema.index({ userId: 1, category: 1 });

export const FileModel = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);
