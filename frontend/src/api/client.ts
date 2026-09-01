/**
 * API client wrapper for authenticated backend requests
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success?: boolean;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Remove trailing slash from API URL to prevent //api/...
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  // Ensure endpoint starts with exactly one slash
  const cleanEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const url = `${baseUrl}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,

    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },

    // REQUIRED: send the team/admin session cookie
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Request failed with status ${response.status}`
    );
  }

  return data as T;
}