import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from './env.js';
import stream from 'node:stream';

export interface CloudinaryState {
  configured: boolean;
  status: 'unconfigured' | 'ready' | 'error';
  error: string | null;
}

export const cloudinaryState: CloudinaryState = {
  configured: config.cloudinary.isConfigured,
  status: config.cloudinary.isConfigured ? 'ready' : 'unconfigured',
  error: null,
};

if (config.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName || undefined,
    api_key: config.cloudinary.apiKey || undefined,
    api_secret: config.cloudinary.apiSecret || undefined,
    secure: true,
  });
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    publicId?: string;
    resourceType?: 'image' | 'video' | 'raw';
    filename?: string;
  }
): Promise<UploadApiResponse> {
  if (!config.cloudinary.isConfigured) {
    throw new Error('Cloudinary is not configured with valid credentials in .env');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'sethi_transfer',
        public_id: options.publicId,
        resource_type: options.resourceType || 'auto',
        use_filename: true,
        unique_filename: true,
        type: 'upload', // or 'authenticated' if private delivery account
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary returned empty result'));
        resolve(result);
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
}

/**
 * Generate a secure signed URL or authorized delivery URL
 */
export function getAuthorizedUrl(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'raw'): string {
  if (!config.cloudinary.isConfigured) {
    return '';
  }

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    sign_url: true,
    secure: true,
  });
}

/**
 * Delete an asset from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'raw'
): Promise<any> {
  if (!config.cloudinary.isConfigured) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err: any) {
    console.warn(`[Cloudinary] Failed to delete ${publicId}:`, err.message);
    return null;
  }
}
