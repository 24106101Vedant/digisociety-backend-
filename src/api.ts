/**
 * api.ts — Central API configuration
 *
 * All fetch calls in the app should import API_BASE from here.
 * Set VITE_API_URL in your .env file to point to the backend.
 *
 * Development:  VITE_API_URL=http://localhost:10000
 * Production:   VITE_API_URL=https://digisociety-backend.onrender.com
 */

export const API_BASE =
  (import.meta.env.VITE_API_URL ?? "https://digisociety-backend.onrender.com") + "/api";

/**
 * Reusable fetch wrapper — handles JSON parsing and error responses.
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; [key: string]: unknown }> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  return res.json();
}

/**
 * Authenticated fetch — automatically attaches the JWT token.
 */
export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; [key: string]: unknown }> {
  const token = localStorage.getItem("ds_token");
  return apiFetch(endpoint, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });
}
