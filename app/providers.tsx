"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { loadSession, saveSession, clearSession, type SessionData } from "@/lib/session";
import type { UserProfile } from "@/lib/types/api";

// ─── Auth Context ────────────────────────────────────────────────────────────

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextValue extends AuthState {
  setAuthData: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  updateAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Crypto Context ───────────────────────────────────────────────────────────

interface CryptoState {
  privateKey: CryptoKey | null;
  myPublicKey: CryptoKey | null;
}

interface CryptoContextValue extends CryptoState {
  setKeys: (privateKey: CryptoKey, publicKey: CryptoKey) => void;
  clearKeys: () => void;
}

const CryptoContext = createContext<CryptoContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function Providers({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  const [cryptoState, setCrypto] = useState<CryptoState>({
    privateKey: null,
    myPublicKey: null,
  });

  // Restore auth state from sessionStorage on first mount (page reload).
  // The private key is NOT restored here — the user must re-enter their
  // password to unlock it (see the chat page's unlock screen).
  useEffect(() => {
    const session = loadSession();
    if (!session) return;

    setAuth({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: {
        id: session.userId,
        username: session.username,
        display_name: session.displayName,
        public_key: session.publicKey,
        wrapped_private_key: session.wrappedPrivateKey,
        pbkdf2_salt: session.pbkdf2Salt,
        created_at: session.createdAt,
      },
    });
  }, []);

  const setAuthData = useCallback(
    (user: UserProfile, accessToken: string, refreshToken: string) => {
      setAuth({ user, accessToken, refreshToken });
      const session: SessionData = {
        accessToken,
        refreshToken,
        userId: user.id,
        username: user.username,
        displayName: user.display_name,
        publicKey: user.public_key,
        wrappedPrivateKey: user.wrapped_private_key,
        pbkdf2Salt: user.pbkdf2_salt,
        createdAt: user.created_at,
      };
      saveSession(session);
    },
    []
  );

  const updateAccessToken = useCallback((accessToken: string) => {
    setAuth((prev) => {
      if (!prev.user) return prev;
      const next = { ...prev, accessToken };
      const session = loadSession();
      if (session) saveSession({ ...session, accessToken });
      return next;
    });
  }, []);

  const clearAuth = useCallback(() => {
    setAuth({ user: null, accessToken: null, refreshToken: null });
    clearSession();
  }, []);

  const setKeys = useCallback((privateKey: CryptoKey, publicKey: CryptoKey) => {
    setCrypto({ privateKey, myPublicKey: publicKey });
  }, []);

  const clearKeys = useCallback(() => {
    setCrypto({ privateKey: null, myPublicKey: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...auth, setAuthData, updateAccessToken, clearAuth }}
    >
      <CryptoContext.Provider value={{ ...cryptoState, setKeys, clearKeys }}>
        {children}
      </CryptoContext.Provider>
    </AuthContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <Providers>");
  return ctx;
}

export function useCryptoContext(): CryptoContextValue {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error("useCryptoContext must be used inside <Providers>");
  return ctx;
}
