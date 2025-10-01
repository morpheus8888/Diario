const buckets = new Map<string, { count: number; expiresAt: number }>()

export function enforceRateLimit(
  identifier: string,
  limit = 20,
  windowMs = 60_000
) {
  const now = Date.now()
  const bucket = buckets.get(identifier)

  if (!bucket || bucket.expiresAt < now) {
    buckets.set(identifier, { count: 1, expiresAt: now + windowMs })
    return
  }

  if (bucket.count >= limit) {
    throw new Error("Troppe richieste, riprova tra qualche secondo")
  }

  bucket.count += 1
}
