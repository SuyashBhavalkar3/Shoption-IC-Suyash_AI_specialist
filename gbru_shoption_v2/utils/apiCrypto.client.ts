/**
 * Client-side AES-256-CBC decryption using Web Crypto API.
 * Mirrors the server-side encryptJSON() in utils/apiCrypto.server.ts
 */

const KEY_HEX =
  process.env.NEXT_PUBLIC_ENC_KEY ||
  "5b13c341e4004350b15891285a17718e1c791120da1676513b7200d7853ce090";

let _cachedKey: CryptoKey | null = null;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  const keyBytes = hexToBytes(KEY_HEX.slice(0, 64));
  _cachedKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as any,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
  return _cachedKey;
}

export async function decryptJSON(encStr: string): Promise<unknown> {
  const colonIdx = encStr.indexOf(":");
  const ivHex = encStr.slice(0, colonIdx);
  const dataHex = encStr.slice(colonIdx + 1);
  const iv = hexToBytes(ivHex);
  const data = hexToBytes(dataHex);
  const key = await getKey();
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv: iv.buffer as any },
    key,
    data.buffer as any
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}
