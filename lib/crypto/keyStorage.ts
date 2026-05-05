/**
 * IndexedDB storage for the AES-KW wrapped private key.
 *
 * We never store the raw private key. Only the password-encrypted blob
 * (same format the server stores) is persisted here. This enables session
 * restore without a server round-trip while keeping the key secure at rest.
 */

const DB_NAME = "whisperbox-keys";
const STORE_NAME = "private-keys";
const DB_VERSION = 1;

interface StoredKeyEntry {
  userId: string;
  wrappedPrivateKey: ArrayBuffer;
  salt: Uint8Array;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "userId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Persist the wrapped private key for a user. Overwrites any existing entry. */
export async function storeWrappedKey(
  userId: string,
  wrappedPrivateKey: ArrayBuffer,
  salt: Uint8Array
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const entry: StoredKeyEntry = { userId, wrappedPrivateKey, salt };
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

/** Retrieve the wrapped private key for a user, or null if not stored. */
export async function getWrappedKey(
  userId: string
): Promise<{ wrappedPrivateKey: ArrayBuffer; salt: Uint8Array } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(userId);

    request.onsuccess = () => {
      db.close();
      const entry = request.result as StoredKeyEntry | undefined;
      if (!entry) {
        resolve(null);
        return;
      }
      resolve({
        wrappedPrivateKey: entry.wrappedPrivateKey,
        salt: entry.salt,
      });
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/** Remove a stored key entry (called on logout). */
export async function deleteWrappedKey(userId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(userId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
