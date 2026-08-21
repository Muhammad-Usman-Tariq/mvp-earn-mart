'use client';

/**
 * Tab-isolated authenticated fetch wrapper.
 * Automatically injects the Authorization header from sessionStorage if available,
 * allowing parallel sessions (e.g. Admin in Tab 1 and User in Tab 2) without cookie conflicts.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});

  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(input, { credentials: 'same-origin', ...init, headers });
}

export function saveAuthToken(token: string) {
  if (typeof window !== 'undefined' && token) {
    sessionStorage.setItem('token', token);
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('token');
  }
}
