import { API_URL } from './config';
import { getIdToken } from './auth';

async function request(method: string, path: string, body?: unknown): Promise<unknown> {
  const token = getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}

export function listItems(entity: string): Promise<unknown> {
  return request('GET', `api/${entity}`);
}

export function getItem(entity: string, id: string): Promise<unknown> {
  return request('GET', `api/${entity}/${id}`);
}

export function putItem(entity: string, id: string, data: unknown): Promise<unknown> {
  return request('PUT', `api/${entity}/${id}`, data);
}

export function deleteItem(entity: string, id: string): Promise<unknown> {
  return request('DELETE', `api/${entity}/${id}`);
}

export function publish(env: 'next' | 'live'): Promise<unknown> {
  return request('POST', 'api/publish', { env });
}

export interface MediaImage {
  key: string;
  url: string;
  lastModified?: string;
  size?: number;
}

export interface MediaListing {
  folders: string[];
  files: MediaImage[];
}

export function listMedia(prefix?: string): Promise<MediaListing> {
  const qs = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
  return request('GET', `api/media${qs}`) as Promise<MediaListing>;
}

export function presignUpload(
  filename: string,
  contentType: string,
  folder?: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  return request('POST', 'api/media/presign', { filename, contentType, folder }) as Promise<{
    uploadUrl: string;
    publicUrl: string;
    key: string;
  }>;
}

export function deleteMedia(key: string): Promise<unknown> {
  return request('POST', 'api/media/delete', { key });
}

export function moveMedia(sourceKey: string, destFolder: string): Promise<unknown> {
  return request('POST', 'api/media/move', { sourceKey, destFolder });
}

export function createFolder(folder: string): Promise<unknown> {
  return request('POST', 'api/media/folder', { folder });
}

// ── Users ──────────────────────────────────────────────────────────────────────

export interface CmsUser {
  username: string;
  email?: string;
  name?: string;
  status?: string;
  enabled?: boolean;
  role: 'admin' | 'editor' | null;
}

export function listUsers(): Promise<CmsUser[]> {
  return request('GET', 'api/users') as Promise<CmsUser[]>;
}

export function createUser(email: string, role: string, name?: string): Promise<unknown> {
  return request('POST', 'api/users', { email, role, name });
}

export function deleteUser(username: string): Promise<unknown> {
  return request('DELETE', `api/users/${encodeURIComponent(username)}`);
}

export function updateUserRole(username: string, role: string): Promise<unknown> {
  return request('PUT', `api/users/${encodeURIComponent(username)}`, { role });
}
