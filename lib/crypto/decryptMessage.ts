export async function decryptMessage(
  payload: {
    ciphertext: ArrayBuffer;
    encryptedKey: ArrayBuffer;
    iv: Uint8Array;
  },
  privateKey: CryptoKey
) {
  // 1. Decrypt AES key using RSA private key
  const rawAesKey = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    payload.encryptedKey
  );

  // 2. Import AES key
  const aesKey = await crypto.subtle.importKey(
    "raw",
    rawAesKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // 3. Decrypt message.
  // Copy iv into a fresh ArrayBuffer-backed Uint8Array to satisfy the strict
  // TypeScript 5.x dom types that require ArrayBuffer (not ArrayBufferLike).
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(payload.iv) },
    aesKey,
    payload.ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
