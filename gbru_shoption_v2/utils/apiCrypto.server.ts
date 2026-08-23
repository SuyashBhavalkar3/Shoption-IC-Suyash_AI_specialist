import crypto from "crypto";

const ALGO = "aes-256-cbc";
// 32-byte (64 hex char) key from environment variable
const KEY_HEX =
  process.env.ENCRYPTION_KEY ||
  "5b13c341e4004350b15891285a17718e1c791120da1676513b7200d7853ce090";
const KEY = Buffer.from(KEY_HEX.slice(0, 64), "hex");

/**
 * Encrypts any JSON-serialisable value using AES-256-CBC.
 * Returns a single string: "<iv_hex>:<ciphertext_hex>"
 */
export function encryptJSON(data: unknown): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const plaintext = JSON.stringify(data);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
