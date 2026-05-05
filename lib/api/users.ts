import { api } from "./client";
import type { UserPublicInfo, UserPublicKey } from "../types/api";

export const searchUsers = (query: string, token: string) =>
  api.get<UserPublicInfo[]>(
    `/users/search?q=${encodeURIComponent(query)}`,
    token
  );

export const getUserPublicKey = (userId: string, token: string) =>
  api.get<UserPublicKey>(`/users/${userId}/public-key`, token);
