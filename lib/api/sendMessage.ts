import { api } from "./client";
import type { MessageResponse, SendMessageRequest } from "../types/api";

export const sendMessage = (payload: SendMessageRequest, token: string) =>
  api.post<MessageResponse>("/messages", payload, token);
