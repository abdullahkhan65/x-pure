/**
 * The access token lives in memory only — never localStorage/sessionStorage, so it can't be
 * read by an XSS payload. AuthProvider is the only writer; apiFetch is the only reader.
 */
let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}
