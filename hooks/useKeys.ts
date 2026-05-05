"use client";

import { useCallback } from "react";
import { useCryptoContext } from "@/app/providers";
import { generateKeyPair } from "@/lib/crypto/generateKeyPair";
import { wrapPrivateKey, unwrapPrivateKey, generateSalt } from "@/lib/crypto/keyWrapping";
import { exportPublicKey, importPublicKey } from "@/lib/crypto/exportImport";
import { bufferToBase64, uint8ToBase64 } from "@/lib/crypto/serialize";
import { base64ToBuffer, base64ToUint8 } from "@/lib/crypto/deserialize";
import { storeWrappedKey } from "@/lib/crypto/keyStorage";
import type { UserProfile } from "@/lib/types/api";

export function useKeys() {
  const { setKeys } = useCryptoContext();

  /**
   * Called during registration.
   * Generates an RSA-OAEP key pair and wraps the private key with the
   * user's password via PBKDF2 + AES-KW. Returns base64-encoded values
   * ready to be sent to the backend.
   */
  const generateAndWrap = useCallback(async (password: string) => {
    const keyPair = await generateKeyPair();
    const salt = generateSalt();
    const wrappedKey = await wrapPrivateKey(keyPair.privateKey, password, salt);
    const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
    const wrappedKeyBase64 = bufferToBase64(wrappedKey);
    const saltBase64 = uint8ToBase64(salt);

    return { keyPair, publicKeyBase64, wrappedKeyBase64, saltBase64, wrappedKey, salt };
  }, []);

  /**
   * Called after a successful login/register response.
   * Decodes the base64 key material from the server, derives the AES-KW
   * wrapping key from the user's password, and unwraps the private key.
   * The resulting CryptoKey is stored in the React context (memory only).
   */
  const unlockFromProfile = useCallback(
    async (password: string, profile: UserProfile) => {
      const wrappedKey = base64ToBuffer(profile.wrapped_private_key);
      const salt = base64ToUint8(profile.pbkdf2_salt);

      const privateKey = await unwrapPrivateKey(wrappedKey, password, salt);
      const publicKey = await importPublicKey(profile.public_key);

      // Cache the encrypted blob in IndexedDB for page-reload session restore
      await storeWrappedKey(profile.id, wrappedKey, salt).catch(() => {});

      setKeys(privateKey, publicKey);
      return { privateKey, publicKey };
    },
    [setKeys]
  );

  /**
   * Called immediately after registration: activates the freshly-generated
   * key pair in context and caches the wrapped key in IndexedDB.
   */
  const activateKeys = useCallback(
    (
      privateKey: CryptoKey,
      publicKey: CryptoKey,
      userId: string,
      wrappedKey: ArrayBuffer,
      salt: Uint8Array
    ) => {
      storeWrappedKey(userId, wrappedKey, salt).catch(() => {});
      setKeys(privateKey, publicKey);
    },
    [setKeys]
  );

  return { generateAndWrap, unlockFromProfile, activateKeys };
}
