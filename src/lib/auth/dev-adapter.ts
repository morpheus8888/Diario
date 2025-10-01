import { cookies } from "next/headers"
import { createHash, randomBytes } from "crypto"

import { db } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/auth/password"

import { AuthAdapter } from "./adapter"

const SESSION_COOKIE_NAME = "dev_auth_session"
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function ensureDevAuthEnabled() {
  if (process.env.DEV_AUTH_ENABLED !== "true") {
    throw new Error("Dev auth is disabled. Set DEV_AUTH_ENABLED=true to use it.")
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev auth cannot be used in production.")
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function parseCookiesFromRequest(req: Request) {
  const header = req.headers.get("cookie")
  if (!header) return new Map<string, string>()
  return new Map(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=")
        if (separatorIndex === -1) {
          return [part, ""] as const
        }
        const name = part.substring(0, separatorIndex)
        const value = part.substring(separatorIndex + 1)
        return [name, decodeURIComponent(value)] as const
      })
  )
}

export class DevAuthAdapter implements AuthAdapter {
  async getCurrentUserId(req: Request) {
    ensureDevAuthEnabled()

    const cookieStore = parseCookiesFromRequest(req)
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionToken) {
      return null
    }

    const session = await db.devSession.findUnique({
      where: {
        tokenHash: hashToken(sessionToken),
      },
      include: {
        user: true,
      },
    })

    if (!session) {
      return null
    }

    if (session.expiresAt && session.expiresAt < new Date()) {
      await db.devSession.delete({ where: { id: session.id } })
      return null
    }

    return session.userId
  }

  async signIn(email: string, password: string) {
    ensureDevAuthEnabled()

    const cookieStore = cookies()
    const existingSession = cookieStore.get(SESSION_COOKIE_NAME)

    if (existingSession) {
      await this.signOut()
    }

    const user = await db.devUser.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      throw new Error("Credenziali non valide")
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash)

    if (!isValidPassword) {
      throw new Error("Credenziali non valide")
    }

    const rawToken = randomBytes(32).toString("hex")
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)

    await db.$transaction(async (tx) => {
      await tx.devSession.deleteMany({ where: { userId: user.id } })
      await tx.devSession.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      })
    })

    cookieStore.set({
      name: SESSION_COOKIE_NAME,
      value: rawToken,
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    })
  }

  async signOut() {
    ensureDevAuthEnabled()

    const cookieStore = cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)

    if (sessionToken) {
      await db.devSession.deleteMany({
        where: {
          tokenHash: hashToken(sessionToken.value),
        },
      })
      cookieStore.delete(SESSION_COOKIE_NAME)
    }
  }

  async createUser(email: string, password: string) {
    ensureDevAuthEnabled()

    const normalisedEmail = email.toLowerCase()
    const passwordHash = await hashPassword(password)

    const user = await db.devUser.create({
      data: {
        email: normalisedEmail,
        passwordHash,
      },
    })

    return user.id
  }
}
