import { cookies, headers } from "next/headers"

import { AuthAdapter } from "./adapter"
import { DevAuthAdapter } from "./dev-adapter"

let cachedAdapter: AuthAdapter | null = null

function getAuthAdapter(): AuthAdapter {
  if (process.env.DEV_AUTH_ENABLED === "true") {
    if (!cachedAdapter) {
      cachedAdapter = new DevAuthAdapter()
    }
    return cachedAdapter
  }

  throw new Error(
    "No authentication adapter configured. Enable DEV_AUTH_ENABLED or provide a custom adapter."
  )
}

export async function getCurrentUserIdFromAdapter(): Promise<string> {
  const adapter = getAuthAdapter()
  const headerList = headers()
  const cookieStore = cookies()

  const requestHeaders = new Headers()
  for (const [key, value] of headerList.entries()) {
    if (!key.startsWith("x-forwarded")) {
      requestHeaders.set(key, value)
    }
  }

  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ")

  if (cookieHeader) {
    requestHeaders.set("cookie", cookieHeader)
  }

  const request = new Request("https://journal.local/auth", {
    headers: requestHeaders,
  })

  const userId = await adapter.getCurrentUserId(request)

  if (!userId) {
    throw new Error("Utente non autenticato")
  }

  return userId
}

export async function signInWithAdapter(email: string, password: string) {
  const adapter = getAuthAdapter()
  await adapter.signIn(email, password)
}

export async function signOutFromAdapter() {
  const adapter = getAuthAdapter()
  await adapter.signOut()
}

export async function createUserWithAdapter(email: string, password: string) {
  const adapter = getAuthAdapter()
  return adapter.createUser(email, password)
}
