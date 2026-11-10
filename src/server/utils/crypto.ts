import crypto from 'node:crypto';

let argon2Module: any = null;
try {
  // Dynamically import or require argon2 if native bindings succeed
  argon2Module = await import('argon2').catch(() => null);
} catch {
  argon2Module = null;
}

/**
 * Hash a password securely using Argon2id with automatic PBKDF2/SHA-512 fallback
 */
export async function hashPassword(password: string): Promise<string> {
  if (argon2Module?.hash) {
    try {
      return await argon2Module.hash(password, {
        type: argon2Module.argon2id,
        memoryCost: 2 ** 16,
        timeCost: 3,
        parallelism: 1,
      });
    } catch {
      // Fall through to PBKDF2 fallback if native binding fails
    }
  }

  // Cryptographically robust PBKDF2 fallback
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const keylen = 64;
  const digest = 'sha512';
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  return `pbkdf2$${iterations}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Verify a password against an Argon2 or PBKDF2 hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('$argon2')) {
    if (argon2Module?.verify) {
      try {
        return await argon2Module.verify(hash, password);
      } catch {
        return false;
      }
    }
    return false;
  }

  if (hash.startsWith('pbkdf2$')) {
    const parts = hash.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];
    const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
    const computedHash = derivedKey.toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(originalHash));
  }

  return false;
}

/**
 * Generate a cryptographically secure random token string
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Hash a token identifier for secure database lookup
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
