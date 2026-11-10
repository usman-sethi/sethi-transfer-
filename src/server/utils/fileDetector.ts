export type FileCategory = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
export type CloudinaryResourceType = 'image' | 'video' | 'raw';

export interface FileMetadataAnalysis {
  category: FileCategory;
  resourceType: CloudinaryResourceType;
  normalizedExtension: string;
  detectedMimeType: string;
  isViewableInBrowser: boolean;
}

/**
 * Common magic byte signatures
 */
const SIGNATURES: Array<{
  bytes: number[];
  offset?: number;
  mime: string;
  ext: string;
  category: FileCategory;
  resourceType: CloudinaryResourceType;
}> = [
  // PDF (%PDF)
  { bytes: [0x25, 0x50, 0x44, 0x46], mime: 'application/pdf', ext: '.pdf', category: 'document', resourceType: 'raw' },
  // PNG (89 50 4E 47 0D 0A 1A 0A)
  { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mime: 'image/png', ext: '.png', category: 'image', resourceType: 'image' },
  // JPEG (FF D8 FF)
  { bytes: [0xFF, 0xD8, 0xFF], mime: 'image/jpeg', ext: '.jpg', category: 'image', resourceType: 'image' },
  // GIF (GIF87a or GIF89a)
  { bytes: [0x47, 0x49, 0x46, 0x38], mime: 'image/gif', ext: '.gif', category: 'image', resourceType: 'image' },
  // WebP (RIFF....WEBP)
  { bytes: [0x52, 0x49, 0x46, 0x46], mime: 'image/webp', ext: '.webp', category: 'image', resourceType: 'image' },
  // ZIP / DOCX / PPTX / XLSX (PK..)
  { bytes: [0x50, 0x4B, 0x03, 0x04], mime: 'application/zip', ext: '.zip', category: 'archive', resourceType: 'raw' },
  // RAR (Rar!..)
  { bytes: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07], mime: 'application/x-rar-compressed', ext: '.rar', category: 'archive', resourceType: 'raw' },
  // MP3 (ID3 or FFFB)
  { bytes: [0x49, 0x44, 0x33], mime: 'audio/mpeg', ext: '.mp3', category: 'audio', resourceType: 'video' },
  // MP4 (....ftyp)
  { bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, mime: 'video/mp4', ext: '.mp4', category: 'video', resourceType: 'video' },
];

/**
 * Detect file attributes based on filename, client MIME, and header buffer
 */
export function analyzeFile(
  filename: string,
  clientMimeType: string,
  buffer?: Buffer
): FileMetadataAnalysis {
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  const rawExt = extMatch ? `.${extMatch[1].toLowerCase()}` : '';

  // 1. Signature inspection if buffer provided
  if (buffer && buffer.length >= 8) {
    for (const sig of SIGNATURES) {
      const offset = sig.offset || 0;
      if (buffer.length >= offset + sig.bytes.length) {
        let match = true;
        for (let i = 0; i < sig.bytes.length; i++) {
          if (buffer[offset + i] !== sig.bytes[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          // Special case: Office documents share the ZIP PK.. signature
          if (sig.ext === '.zip') {
            if (rawExt === '.docx') {
              return {
                category: 'document',
                resourceType: 'raw',
                normalizedExtension: '.docx',
                detectedMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                isViewableInBrowser: false,
              };
            }
            if (rawExt === '.pptx') {
              return {
                category: 'document',
                resourceType: 'raw',
                normalizedExtension: '.pptx',
                detectedMimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                isViewableInBrowser: false,
              };
            }
            if (rawExt === '.xlsx') {
              return {
                category: 'document',
                resourceType: 'raw',
                normalizedExtension: '.xlsx',
                detectedMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                isViewableInBrowser: false,
              };
            }
          }

          return {
            category: sig.category,
            resourceType: sig.resourceType,
            normalizedExtension: rawExt || sig.ext,
            detectedMimeType: sig.mime,
            isViewableInBrowser: isBrowserViewable(sig.mime, rawExt || sig.ext),
          };
        }
      }
    }
  }

  // 2. Fallback to extension and client MIME mapping
  const category = getCategoryFromExtension(rawExt, clientMimeType);
  const resourceType: CloudinaryResourceType =
    category === 'image' ? 'image' : category === 'video' || category === 'audio' ? 'video' : 'raw';

  return {
    category,
    resourceType,
    normalizedExtension: rawExt,
    detectedMimeType: clientMimeType || 'application/octet-stream',
    isViewableInBrowser: isBrowserViewable(clientMimeType, rawExt),
  };
}

export function getCategoryFromExtension(ext: string, mime: string): FileCategory {
  const cleanExt = ext.toLowerCase();

  if (['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.csv', '.rtf', '.md', '.json'].includes(cleanExt)) {
    return 'document';
  }
  if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.bmp', '.tiff', '.ico', '.avif'].includes(cleanExt) || mime.startsWith('image/')) {
    return 'image';
  }
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v', '.wmv'].includes(cleanExt) || mime.startsWith('video/')) {
    return 'video';
  }
  if (['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'].includes(cleanExt) || mime.startsWith('audio/')) {
    return 'audio';
  }
  if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'].includes(cleanExt)) {
    return 'archive';
  }
  return 'other';
}

export function isBrowserViewable(mime: string, ext: string): boolean {
  const viewableMimes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
  ];
  const viewableExts = ['.pdf', '.txt', '.csv', '.json', '.md', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.mp4', '.webm', '.mp3', '.wav'];
  return viewableMimes.includes(mime) || viewableExts.includes(ext.toLowerCase());
}
