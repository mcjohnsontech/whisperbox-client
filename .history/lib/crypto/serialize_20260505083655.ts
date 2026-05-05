export function bufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function uint8ToBase64(uint8: Uint8Array) {
  return btoa(String.fromCharCode(...uint8));
}
const encrypted = await encryptMessage(message, recipientPublicKey);

const payload = {
  ciphertext: bufferToBase64(encrypted.ciphertext),
  encryptedKey: bufferToBase64(encrypted.encryptedKey),
  iv: uint8ToBase64(encrypted.iv),
  receiverId,
};