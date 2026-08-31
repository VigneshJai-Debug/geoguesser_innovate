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
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // include session cookies
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}
