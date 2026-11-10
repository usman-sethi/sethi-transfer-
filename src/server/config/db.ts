import mongoose from 'mongoose';
import { config } from './env.js';

export interface DbState {
  connected: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  host: string | null;
}

export const dbState: DbState = {
  connected: false,
  status: 'disconnected',
  error: null,
  host: null,
};

export async function connectDatabase(): Promise<boolean> {
  if (!config.hasMongo || !config.mongoUri) {
    dbState.status = 'disconnected';
    dbState.error = 'MONGODB_URI is not configured in environment';
    console.log('[DB] MongoDB URI not configured. Active mode: In-memory safe state store.');
    return false;
  }

  try {
    dbState.status = 'connecting';
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    dbState.connected = true;
    dbState.status = 'connected';
    dbState.host = conn.connection.host;
    dbState.error = null;
    console.log(`[DB] Connected successfully to MongoDB Atlas host: ${conn.connection.host}`);
    return true;
  } catch (err: any) {
    dbState.connected = false;
    dbState.status = 'error';
    dbState.error = err.message || 'Failed to connect to MongoDB Atlas';
    console.warn(`[DB] MongoDB Atlas connection error: ${dbState.error}. Active mode: In-memory fallback.`);
    return false;
  }
}
