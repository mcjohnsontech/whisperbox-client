import { api } from "./client";
import type { ConversationSummary, MessageResponse } from "../types/api";

export const getConversations = (token: string) =>
  api.get<ConversationSummary[]>("/conversations", token);

export const getMessages = (
  userId: string,
  token: string,
  limit = 50,
  before?: string
) => {
  let path = `/conversations/${userId}/messages?limit=${limit}`;
  if (before) path += `&before=${encodeURIComponent(before)}`;
  return api.get<MessageResponse[]>(path, token);
};
