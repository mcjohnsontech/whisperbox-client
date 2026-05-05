"use client";

import { useState, useCallback, useEffect, useRef, useTransition } from "react";
import { getMessages } from "@/lib/api/conversations";
import { decryptMessage } from "@/lib/crypto/decryptMessage";
import { base64ToBuffer, base64ToUint8 } from "@/lib/crypto/deserialize";
import type { DecryptedMessage } from "@/lib/types/message";
import type { MessageResponse } from "@/lib/types/api";

export function useMessages(
  partnerId: string | null,
  myUserId: string | null,
  privateKey: CryptoKey | null,
  accessToken: string | null
) {
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * React 19: useTransition with an async callback is the idiomatic way to
   * trigger async operations that update state from within effects or event
   * handlers. `isPending` serves as the loading indicator, and the React
   * Compiler recognises `startTransition` as a safe state-update boundary.
   */
  const [isPending, startTransition] = useTransition();

  // Stable refs so the WebSocket callback never captures stale closures.
  const privateKeyRef = useRef<CryptoKey | null>(null);
  const myUserIdRef = useRef<string | null>(null);

  useEffect(() => { privateKeyRef.current = privateKey; }, [privateKey]);
  useEffect(() => { myUserIdRef.current = myUserId; }, [myUserId]);

  const decryptOne = useCallback(
    async (msg: MessageResponse, myId: string, key: CryptoKey): Promise<DecryptedMessage> => {
      const isMine = msg.from_user_id === myId;
      // Pick the AES key copy that was RSA-encrypted for us:
      //   encryptedKey        → for the recipient
      //   encryptedKeyForSelf → for the sender
      const keyBase64 = isMine ? msg.payload.encryptedKeyForSelf : msg.payload.encryptedKey;
      try {
        const text = await decryptMessage(
          {
            ciphertext: base64ToBuffer(msg.payload.ciphertext),
            encryptedKey: base64ToBuffer(keyBase64),
            iv: base64ToUint8(msg.payload.iv),
          },
          key
        );
        return { id: msg.id, from_user_id: msg.from_user_id, to_user_id: msg.to_user_id, text, created_at: msg.created_at, isMine };
      } catch {
        return { id: msg.id, from_user_id: msg.from_user_id, to_user_id: msg.to_user_id, text: "[Unable to decrypt]", created_at: msg.created_at, isMine, failed: true };
      }
    },
    []
  );

  useEffect(() => {
    if (!partnerId || !myUserId || !privateKey || !accessToken) return;
    /**
     * startTransition with an async function (React 19) is the correct way to
     * kick off state-updating async work from effects. The compiler allows it
     * because startTransition marks updates as non-urgent transitions, not
     * synchronous cascading renders.
     */
    startTransition(async () => {
      try {
        const raw = await getMessages(partnerId, accessToken);
        const decrypted = await Promise.all(
          raw.map((msg) => decryptOne(msg, myUserId, privateKey))
        );
        setMessages(decrypted.reverse()); // API returns newest-first
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages");
      }
    });
  }, [partnerId, myUserId, privateKey, accessToken, decryptOne, startTransition]);

  /** Append a live incoming message from the WebSocket. */
  const appendMessage = useCallback(
    async (raw: MessageResponse) => {
      const key = privateKeyRef.current;
      const uid = myUserIdRef.current;
      if (!key || !uid) return;
      const msg = await decryptOne(raw, uid, key);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
    [decryptOne]
  );

  /** Add an already-decrypted optimistic message (own sends). */
  const addDecrypted = useCallback((msg: DecryptedMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  return {
    messages,
    isLoading: isPending,
    error,
    appendMessage,
    addDecrypted,
  };
}
