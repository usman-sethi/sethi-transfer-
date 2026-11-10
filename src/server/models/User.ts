import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  storageLimit: number; // in bytes, default 5 GB
  storageUsed: number;  // in bytes
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    storageLimit: { type: Number, default: 5 * 1024 * 1024 * 1024 }, // 5 GB
    storageUsed: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
