import { User, FileItem, StorageStats, SystemHealth } from '../types';

let accessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export function getApiAccessToken(): string | null {
  return accessToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(`/api/v1${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // If 404, retry via /api alias
    if (res.status === 404) {
      res = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  } catch (netErr: any) {
    throw new Error('Network error: Unable to reach the server. Please check your connection.');
  }

  // Handle 401 refresh attempt once
  if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/register')) {
    const refreshRes = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data.accessToken) {
        setApiAccessToken(data.accessToken);
        headers.set('Authorization', `Bearer ${data.accessToken}`);
        const retryRes = await fetch(`/api/v1${endpoint}`, {
          ...options,
          headers,
          credentials: 'include',
        });
        const retryData = await retryRes.json();
        if (!retryRes.ok) {
          throw new Error(retryData.error || 'Request failed after refresh');
        }
        return retryData as T;
      }
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || (res.status === 404 ? 'Server is still warming up. Please try again in a moment.' : `Request failed (HTTP ${res.status})`));
  }
  return data as T;
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string):Promise<{ user: User; accessToken: string }> {
    const data = await request<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setApiAccessToken(data.accessToken);
    return data;
  },

  async login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
    const data = await request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setApiAccessToken(data.accessToken);
    return data;
  },

  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' });
    setApiAccessToken(null);
  },

  async getMe(): Promise<{ user: User }> {
    return await request<{ user: User }>('/auth/me');
  },

  // Files
  async listFiles(params: {
    category?: string;
    search?: string;
    isStarred?: boolean;
    isDeleted?: boolean;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }): Promise<{ files: FileItem[]; total: number }> {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (typeof params.isStarred === 'boolean') query.set('isStarred', String(params.isStarred));
    if (typeof params.isDeleted === 'boolean') query.set('isDeleted', String(params.isDeleted));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.order) query.set('order', params.order);

    return await request<{ files: FileItem[]; total: number }>(`/files?${query.toString()}`);
  },

  async getRecentFiles(): Promise<{ files: FileItem[] }> {
    return await request<{ files: FileItem[] }>('/files/recent');
  },

  async getStarredFiles(): Promise<{ files: FileItem[] }> {
    return await request<{ files: FileItem[] }>('/files/starred');
  },

  async updateFile(id: string, updates: { displayName?: string; isStarred?: boolean }): Promise<{ file: FileItem }> {
    return await request<{ file: FileItem }>(`/files/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteFile(id: string, permanent = false): Promise<void> {
    await request(`/files/${id}?permanent=${permanent}`, { method: 'DELETE' });
  },

  async restoreFile(id: string): Promise<void> {
    await request(`/files/${id}/restore`, { method: 'POST' });
  },

  // Streaming Download
  async downloadFile(file: FileItem): Promise<void> {
    const headers = new Headers();
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

    const res = await fetch(`/api/v1/files/${file._id}/download`, {
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Download failed');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.displayName || file.originalName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Upload with real progress tracking via XMLHttpRequest
  uploadFileWithProgress(
    file: File,
    onProgress: (percent: number) => void
  ): { promise: Promise<FileItem>; cancel: () => void } {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('files', file);

    const promise = new Promise<FileItem>((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.files && data.files.length > 0) {
              resolve(data.files[0]);
            } else {
              reject(new Error('No file returned from server'));
            }
          } catch {
            reject(new Error('Invalid server response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', '/api/v1/files/upload');
      xhr.withCredentials = true;
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }
      xhr.send(formData);
    });

    return {
      promise,
      cancel: () => xhr.abort(),
    };
  },

  // Storage and Health
  async getStorageUsage(): Promise<StorageStats> {
    return await request<StorageStats>('/storage/usage');
  },

  async getHealth(): Promise<SystemHealth> {
    return await request<SystemHealth>('/health');
  },
};
