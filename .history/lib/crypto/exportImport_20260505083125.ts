export async function exportPublicKey(key: CryptoKey) {
  const exported = await crypto.subtle.exportKey("spki", key);
  return bufferToBase64(exported);
}

export async function exportPrivateKey(key: CryptoKey) {
  const exported = await crypto.subtle.exportKey("pkcs8", key);
  return bufferToBase64(exported);
}

export function bufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToBuffer(base64: string) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}