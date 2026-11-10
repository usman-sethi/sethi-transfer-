import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { generateSecureToken, hashToken } from './crypto.js';
import { DataStore } from '../models/store.js';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: '15m',
  });
}

export async function generateAndStoreRefreshToken(userId: string): Promise<string> {
  const plainToken = generateSecureToken(40);
  const tokenHash = hashToken(plainToken);
  const expiresAt = new Date(Date.now() + config.jwt.refreshExpiresInDays * 24 * 60 * 60 * 1000);

  await DataStore.createRefreshToken(userId, tokenHash, expiresAt);
  return plainToken;
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
  } catch {
    return null;
  }
}
