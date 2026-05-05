"use client";

import { useEffect, useRef, useCallback } from "react";
import type { MessageResponse } from "@/lib/types/api";

const WS_URL = "wss://whisperbox.koyeb.app/ws";
const RECONNECT_DELAY_MS = 4000;

interface UseWebSocketOptions {
  accessToken: string | null;
  onMessage: (msg: MessageResponse) => void;
  /** Called when the server closes the connection with an auth error (4001/1008). */
  onAuthError?: () => void;
}

/**
 * Maintains a WebSocket connection to the WhisperBox server for real-time
 * message delivery. Reconnects automatically on unexpected disconnects.
 * The server flushes pending offline messages on every (re)connect.
 */
export function useWebSocket({ accessToken, onMessage, onAuthError }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep callbacks in refs so reconnect logic always uses the latest versions
  const onMessageRef = useRef(onMessage);
  const onAuthErrorRef = useRef(onAuthError);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onAuthErrorRef.current = onAuthError; }, [onAuthError]);

  const connect = useCallback((token: string) => {
    // Avoid double-connecting
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onmessage = (event: MessageEvent) => {
      try {
        const frame: unknown = JSON.parse(event.data as string);
        if (frame && typeof frame === "object") {
          // Handle both bare MessageResponse and wrapped { type, data } frames
          const msg = ("data" in frame ? (frame as { data: MessageResponse }).data : frame) as MessageResponse;
          if (msg.id && msg.from_user_id) {
            onMessageRef.current(msg);
          }
        }
      } catch {
        // Ignore unparseable frames
      }
    };

    ws.onclose = (event: CloseEvent) => {
      wsRef.current = null;
      if (event.code === 4001 || event.code === 1008) {
        // Auth failure — don't reconnect, surface to caller
        onAuthErrorRef.current?.();
        return;
      }
      if (event.code === 1000) return; // Clean shutdown
      // Unexpected disconnect — reconnect after a delay
      reconnectRef.current = setTimeout(() => connect(token), RECONNECT_DELAY_MS);
    };

    ws.onerror = () => {
      // onclose fires after onerror; let it handle reconnection
    };
  }, []); // no deps — token is passed at call time, not captured

  useEffect(() => {
    if (!accessToken) return;
    connect(accessToken);

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close(1000);
      wsRef.current = null;
    };
  }, [accessToken, connect]);
}
