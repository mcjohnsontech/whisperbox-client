/**
 * PBKDF2 + AES-KW private key wrapping.
 *
 * The backend stores `wrapped_private_key` (AES-KW blob) and `pbkdf2_salt`,
 * returning them on login so the client can reconstruct the private key.
 * This module handles the derivation and wrap/unwrap operations.
 */

const PBKDF2_ITERATIONS = 200_000;
const SALT_BYTES = 16;

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

/**
 * Derive a 256-bit AES-KW key from the user's password and a random salt.
 * High iteration count makes brute-force attacks computationally expensive.
 */
async function deriveWrappingKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      // Copy into a fresh ArrayBuffer-backed Uint8Array to satisfy strict
      // TypeScript 5.x dom types (BufferSource requires ArrayBuffer, not ArrayBufferLike).
      salt: new Uint8Array(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
}

/**
 * Wrap (encrypt) the RSA private key using AES-KW.
 * The resulting ArrayBuffer is what gets sent to the server as `wrapped_private_key`.
 */
export async function wrapPrivateKey(
  privateKey: CryptoKey,
  password: string,
  salt: Uint8Array
): Promise<ArrayBuffer> {
  const wrappingKey = await deriveWrappingKey(password, salt);
  return crypto.subtle.wrapKey("pkcs8", privateKey, wrappingKey, "AES-KW");
}

/**
 * Unwrap (decrypt) the RSA private key from an AES-KW blob.
 * Called at login time after fetching key material from the server.
 */
export async function unwrapPrivateKey(
  wrappedKey: ArrayBuffer,
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const wrappingKey = await deriveWrappingKey(password, salt);
  return crypto.subtle.unwrapKey(
    "pkcs8",
    wrappedKey,
    wrappingKey,
    "AES-KW",
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}
