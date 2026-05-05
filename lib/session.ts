/**
 * localStorage wrapper for persisting auth tokens and key material across sessions.
 *
 * Using localStorage means the user stays signed in across page reloads and
 * new browser tabs until they explicitly sign out.
 *
 * The plaintext private key is NEVER stored here — only the AES-KW wrapped blob
 * (the same encrypted form the server holds) is kept for session restore.
 */

export interface SessionData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  displayName: string;
  publicKey: string;
  wrappedPrivateKey: string;
  pbkdf2Salt: string;
  createdAt: string;
}

const SESSION_KEY = "wb_session";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function saveSession(data: SessionData): void {
  try {
    storage()?.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable (storage quota exceeded, private mode, etc.)
  }
}

export function loadSession(): SessionData | null {
  try {
    const raw = storage()?.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    storage()?.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
