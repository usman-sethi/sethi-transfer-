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
 * Upload a file buffer to Cloudinary using upload_preset or api_key/secret
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

  const resourceType = options.resourceType || 'auto';

  // 1. If upload_preset is configured, upload via unsigned preset or REST API
  if (config.cloudinary.uploadPreset) {
    // Try unsigned_upload_stream first
    try {
      return await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = (cloudinary.uploader as any).unsigned_upload_stream(
          config.cloudinary.uploadPreset,
          {
            folder: options.folder || 'sethi_transfer',
            public_id: options.publicId,
            resource_type: resourceType,
          },
          (error: any, result: any) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('Cloudinary returned empty result'));
            resolve(result);
          }
        );

        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);
        bufferStream.pipe(uploadStream);
      });
    } catch (streamErr) {
      // Fallback to direct Cloudinary REST endpoint with FormData
      const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/${resourceType}/upload`;
      const formData = new FormData();
      formData.append('upload_preset', config.cloudinary.uploadPreset);
      if (options.folder) formData.append('folder', options.folder);
      const blob = new Blob([new Uint8Array(buffer)]);
      formData.append('file', blob, options.filename || 'upload');

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || `Cloudinary upload failed HTTP ${res.status}`);
      }
      return json as UploadApiResponse;
    }
  }

  // 2. Standard signed upload stream if api_key and api_secret are present
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'sethi_transfer',
        public_id: options.publicId,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
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
