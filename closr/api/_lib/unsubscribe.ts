import { createHmac, timingSafeEqual } from 'node:crypto'

// Signed unsubscribe links: the link itself proves which account it's for, so it works
// without logging in, and nobody can unsubscribe someone else by guessing a user id.

export const unsubscribeSignature = (userId: string, secret: string) => createHmac('sha256', secret).update(`closr-unsubscribe:${userId}`).digest('base64url')

export function validSignature(userId: string, signature: string, secret: string) {
  const a = Buffer.from(signature)
  const b = Buffer.from(unsubscribeSignature(userId, secret))
  return a.length === b.length && timingSafeEqual(a, b)
}
