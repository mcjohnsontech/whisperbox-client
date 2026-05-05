import { api } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserProfile,
} from "../types/api";

export const register = (data: RegisterRequest) =>
  api.post<AuthResponse>("/auth/register", data);

export const login = (data: LoginRequest) =>
  api.post<AuthResponse>("/auth/login", data);

export const getMe = (token: string) =>
  api.get<UserProfile>("/auth/me", token);

export const refreshAccessToken = (refreshToken: string) =>
  api.post<TokenResponse>("/auth/refresh", { refresh_token: refreshToken });

export const logout = (token: string, refreshToken: string) =>
  api.post<Record<string, never>>("/auth/logout", { refresh_token: refreshToken }, token);
