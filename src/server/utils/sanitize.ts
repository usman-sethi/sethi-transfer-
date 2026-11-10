/**
 * Sanitize untrusted filenames to prevent directory traversal and null byte injection
 */
export function sanitizeFilename(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return 'unnamed_file';
  }

  // Remove path traversal and null bytes
  let clean = rawName
    .replace(/\0/g, '')
    .replace(/^(\.\.[\/\\])+/, '')
    .replace(/[\/\\]/g, '_')
    .trim();

  // Strip dangerous control characters
  clean = clean.replace(/[\x00-\x1f\x80-\x9f]/g, '');

  // Truncate overly long names while keeping extension
  if (clean.length > 200) {
    const lastDot = clean.lastIndexOf('.');
    if (lastDot > 0) {
      const ext = clean.substring(lastDot);
      const name = clean.substring(0, 190);
      clean = `${name}${ext}`;
    } else {
      clean = clean.substring(0, 200);
    }
  }

  return clean || 'unnamed_file';
}

/**
 * Format bytes into human-readable representation
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}
