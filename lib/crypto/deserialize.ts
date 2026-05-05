/** base64 string → ArrayBuffer. */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  // Create the ArrayBuffer directly so the return type is ArrayBuffer (not
  // the broader ArrayBufferLike), which is required by the Web Crypto API.
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buf;
}

/** base64 string → Uint8Array. */
export function base64ToUint8(base64: string): Uint8Array {
  return new Uint8Array(base64ToBuffer(base64));
}
