import { bufferToBase64 } from "./serialize";
import { base64ToBuffer } from "./deserialize";

/** Export an RSA public key to base64-encoded SPKI format for sending to the backend. */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey("spki", key);
  return bufferToBase64(exported);
}

/**
 * Import a base64-encoded SPKI public key from the backend.
 * Used before encrypting a message for a recipient.
 */
export async function importPublicKey(base64: string): Promise<CryptoKey> {
  const buffer = base64ToBuffer(base64);
  return crypto.subtle.importKey(
    "spki",
    buffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}
