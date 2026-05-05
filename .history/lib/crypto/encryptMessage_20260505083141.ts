export async function encryptMessage(
  message: string,
  recipientPublicKey: CryptoKey
) {
  const encoder = new TextEncoder();

  // 1. Generate AES key
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Create IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 3. Encrypt message with AES
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(message)
  );

  // 4. Export AES key
  const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);

  // 5. Encrypt AES key with RSA
  const encryptedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAesKey
  );

  return {
    ciphertext,
    encryptedKey,
    iv,
  };
}