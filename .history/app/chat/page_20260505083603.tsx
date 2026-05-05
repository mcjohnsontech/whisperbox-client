"use client";

import { encryptMessage } from "@/lib/crypto/encryptMessage";
import { sendMessage } from "@/lib/api/sendMessage";
import { bufferToBase64, uint8ToBase64 } from "@/lib/crypto/serialize";

export default function ChatPage() {
  const token = "USER_JWT"; // from auth hook

  async function handleSend() {
    // 1. Encrypt message
    const encrypted = await encryptMessage(
      "Hello world",
      recipientPublicKey
    );

    // 2. Convert to API format
    const payload = {
      ciphertext: bufferToBase64(encrypted.ciphertext),
      encryptedKey: bufferToBase64(encrypted.encryptedKey),
      iv: uint8ToBase64(encrypted.iv),
      receiverId: "user_123",
    };

    // 3. Send to server
    await sendMessage(payload, token);
  }

  return <button onClick={handleSend}>Send</button>;
}