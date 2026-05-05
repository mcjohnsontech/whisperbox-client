export function bufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function uint8ToBase64(uint8: Uint8Array) {
  return btoa(String.fromCharCode(...uint8));
}