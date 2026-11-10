import dotenv from 'dotenv';
dotenv.config();

export interface SystemConfig {
  port: number;
  appUrl: string;
  mongoUri: string | null;
  hasMongo: boolean;
  cloudinary: {
    cloudName: string | null;
    apiKey: string | null;
    apiSecret: string | null;
    uploadPreset: string | null;
    isConfigured: boolean;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresInDays: number;
  };
}

const mongoUri = process.env.MONGODB_URI || null;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || null;
const apiKey = process.env.CLOUDINARY_API_KEY || null;
const apiSecret = process.env.CLOUDINARY_API_SECRET || null;
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || null;

export const config: SystemConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  mongoUri,
  hasMongo: Boolean(mongoUri && mongoUri.startsWith('mongodb')),
  cloudinary: {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset,
    isConfigured: Boolean(cloudName && (uploadPreset || (apiKey && apiSecret))),
  },
  jwt: {
    accessSecret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'sethi_transfer_access_secret_production_key_32bytes_min',
    refreshSecret: process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'sethi_transfer_refresh_secret_production_key_32bytes_min'),
    accessExpiresIn: '15m',
    refreshExpiresInDays: 7,
  },
};
