"use client";

import { useState, useCallback } from "react";
import { useAuthContext, useCryptoContext } from "@/app/providers";
import { login as apiLogin, register as apiRegister, logout as apiLogout } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { deleteWrappedKey } from "@/lib/crypto/keyStorage";
import type { RegisterRequest } from "@/lib/types/api";

function loginErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "Unable to connect to the server. Please check your internet connection.";
  }
  switch (err.status) {
    case 401:
      return "The username or password you entered is incorrect. Please try again.";
    case 422:
      return "Please enter a valid username and password.";
    default:
      return err.message;
  }
}

function registerErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) {
    return "Unable to connect to the server. Please check your internet connection.";
  }
  switch (err.status) {
    case 409:
      return "That username is already taken. Please choose a different one.";
    case 422:
      return "Please check the information you entered and try again.";
    default:
      return err.message;
  }
}

export function useAuth() {
  const authCtx = useAuthContext();
  const { clearKeys } = useCryptoContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (username: string, password: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiLogin({ username, password });
        authCtx.setAuthData(response.user, response.access_token, response.refresh_token);
        return response;
      } catch (err) {
        setError(loginErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authCtx]
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiRegister(data);
        authCtx.setAuthData(response.user, response.access_token, response.refresh_token);
        return response;
      } catch (err) {
        setError(registerErrorMessage(err));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authCtx]
  );

  const logout = useCallback(async () => {
    if (authCtx.accessToken && authCtx.refreshToken) {
      try {
        await apiLogout(authCtx.accessToken, authCtx.refreshToken);
      } catch {
        // Best-effort: always clear the local session regardless of server response
      }
    }
    if (authCtx.user?.id) {
      await deleteWrappedKey(authCtx.user.id).catch(() => {});
    }
    authCtx.clearAuth();
    clearKeys();
  }, [authCtx, clearKeys]);

  return {
    user: authCtx.user,
    accessToken: authCtx.accessToken,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
