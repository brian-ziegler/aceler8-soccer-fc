import { API_URL } from './config';
import { getAccessToken } from './auth';

async function request(method: string, path: string, body?: unknown): Promise<unknown> {
  const token = getAccessToken();
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
