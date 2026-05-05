export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

export function base64ToUint8(base64: string): Uint8Array {
  const buffer = base64ToBuffer(base64);
  return new Uint8Array(buffer);
}

const messages = await res.json();
const parsed = messages.map((msg: any) => ({
  ciphertext: base64ToBuffer(msg.ciphertext),
  encryptedKey: base64ToBuffer(msg.encryptedKey),
  iv: base64ToUint8(msg.iv),
  senderId: msg.senderId,
}));

const privateKey = await getPrivateKey();