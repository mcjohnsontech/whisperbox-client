"use client";

import { useState, useCallback } from "react";
import { useMessages } from "./useMessages";
import { useWebSocket } from "./useWebSocket";
import { sendMessage } from "@/lib/api/sendMessage";
import { getUserPublicKey } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { encryptMessage } from "@/lib/crypto/encryptMessage";
import { importPublicKey } from "@/lib/crypto/exportImport";
import { bufferToBase64, uint8ToBase64 } from "@/lib/crypto/serialize";

interface UseChatProps {
  partnerId: string | null;
  myUserId: string | null;
  myPublicKey: CryptoKey | null;
  privateKey: CryptoKey | null;
  accessToken: string | null;
}

/**
 * Orchestrates sending and receiving E2EE messages for a conversation.
 *
 * Send flow:
 *   1. Fetch recipient's RSA public key
 *   2. Generate AES-GCM message key + IV
 *   3. Encrypt message with AES-GCM
 *   4. RSA-OAEP wrap the AES key for both recipient AND self
 *   5. POST to /messages with base64-encoded ciphertext + both wrapped keys
 *   6. Optimistically append the plaintext to the local message list
 *
 * Receive flow (WebSocket):
 *   Real-time frames are decrypted by useMessages.appendMessage and appended.
 */
export function useChat({
  partnerId,
  myUserId,
  myPublicKey,
  privateKey,
  accessToken,
}: UseChatProps) {
  const { messages, isLoading, error, appendMessage, addDecrypted } =
    useMessages(partnerId, myUserId, privateKey, accessToken);

  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Wire up the WebSocket for real-time incoming messages
  useWebSocket({
    accessToken,
    onMessage: appendMessage,
  });

  const send = useCallback(
    async (text: string) => {
      if (!partnerId || !myUserId || !myPublicKey || !accessToken) return;

      setIsSending(true);
      setSendError(null);
      try {
        // 1. Fetch recipient's RSA public key
        const { public_key } = await getUserPublicKey(partnerId, accessToken);
        const recipientPubKey = await importPublicKey(public_key);

        // 2. Hybrid-encrypt: AES-GCM message + RSA-OAEP key wrapping for
        //    both the recipient and ourselves (so we can read our own sends)
        const encrypted = await encryptMessage(text, recipientPubKey, myPublicKey);

        // 3. Send base64-encoded ciphertext to the server
        const response = await sendMessage(
          {
            to: partnerId,
            payload: {
              ciphertext: bufferToBase64(encrypted.ciphertext),
              iv: uint8ToBase64(encrypted.iv),
              encryptedKey: bufferToBase64(encrypted.encryptedKey),
              encryptedKeyForSelf: bufferToBase64(encrypted.encryptedKeyForSelf),
            },
          },
          accessToken
        );

        // 4. Optimistically show the plaintext we just sent
        addDecrypted({
          id: response.id,
          from_user_id: myUserId,
          to_user_id: partnerId,
          text,
          created_at: response.created_at,
          isMine: true,
        });
      } catch (err) {
        if (err instanceof ApiError) {
          setSendError(err.status === 404
            ? "The person you are trying to message could not be found."
            : err.message
          );
        } else {
          setSendError("Your message could not be sent. Please try again.");
        }
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [partnerId, myUserId, myPublicKey, accessToken, addDecrypted]
  );

  return { messages, isLoading, error, isSending, sendError, send };
}
