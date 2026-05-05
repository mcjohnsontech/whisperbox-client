export async function exportPublicKey(key: CryptoKey) {
  const exported = await crypto.subtle.exportKey("spki", key);
  return bufferToBase64(exported);
}

export async function exportPrivateKey(key: CryptoKey) {
  const exported = await crypto.subtle.exportKey("pkcs8", key);
  return bufferToBase64(exported);
}