import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

const KEY_LENGTH = 64
const SCRYPT_PARAMS = { N: 1 << 14, r: 8, p: 1 }

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const derivedKey = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS)
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`
}

export async function verifyPassword(password: string, hashed: string) {
  const [prefix, saltHex, hashHex] = hashed.split(":")
  if (prefix !== "scrypt" || !saltHex || !hashHex) {
    return false
  }

  const salt = Buffer.from(saltHex, "hex")
  const stored = Buffer.from(hashHex, "hex")
  const derived = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS)

  if (stored.length !== derived.length) {
    return false
  }

  return timingSafeEqual(stored, derived)
}
