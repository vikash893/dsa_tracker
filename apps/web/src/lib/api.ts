const PROD_API = 'https://dsatracker-api-u457.onrender.com/api';
const DEV_API = '/api';
export const API_BASE = import.meta.env.PROD ? PROD_API : DEV_API;

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function api<T = any>(endpoint: string, method: Method = 'GET', body?: any): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
