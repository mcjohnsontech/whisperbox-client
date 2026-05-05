/**
 * Hybrid encryption: AES-GCM for the message body, RSA-OAEP for the AES key.
 *
 * We encrypt the AES key twice:
 *   - `encryptedKey`        → for the recipient (they decrypt with their private key)
 *   - `encryptedKeyForSelf` → for the sender (lets the sender decrypt their own sent messages)
 *
 * Both ciphertexts wrap the SAME per-message AES key; only the RSA wrapper differs.
 */
export async function encryptMessage(
  message: string,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<{
  ciphertext: ArrayBuffer;
  encryptedKey: ArrayBuffer;
  encryptedKeyForSelf: ArrayBuffer;
  iv: Uint8Array;
}> {
  // 1. Generate a fresh AES-GCM 256-bit key for this message only
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // must be extractable so we can RSA-wrap it
    ["encrypt", "decrypt"]
  );

  // 2. Generate a random 96-bit IV (GCM nonce). Never reuse an IV with the same key.
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Encrypt the plaintext with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(message)
  );

  // 4. Export the raw AES key bytes so RSA can wrap them
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

  // 5. Wrap the AES key for the recipient
  const encryptedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAesKey
  );

  // 6. Wrap the AES key for the sender (enables decryption of own sent messages)
  const encryptedKeyForSelf = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    senderPublicKey,
    rawAesKey
  );

  return { ciphertext, encryptedKey, encryptedKeyForSelf, iv };
}
