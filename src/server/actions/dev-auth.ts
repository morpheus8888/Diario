"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import {
  createUserWithAdapter,
  signInWithAdapter,
  signOutFromAdapter,
} from "@/lib/auth"

const credentialsSchema = z.object({
  email: z.string().email({ message: "Inserisci un'email valida" }).trim(),
  password: z
    .string()
    .min(8, { message: "La password deve contenere almeno 8 caratteri" })
    .max(64, { message: "La password è troppo lunga" }),
})

function ensureDevAuthEnabled() {
  if (process.env.DEV_AUTH_ENABLED !== "true") {
    throw new Error("La dev auth non è abilitata")
  }
}

export async function devSignInAction(_prevState: unknown, formData: FormData) {
  ensureDevAuthEnabled()

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi",
    }
  }

  try {
    await signInWithAdapter(parsed.data.email, parsed.data.password)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossibile effettuare l'accesso"
    return { success: false, error: message }
  }

  redirect("/journal")
}

export async function devSignUpAction(_prevState: unknown, formData: FormData) {
  ensureDevAuthEnabled()

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi",
    }
  }

  try {
    await createUserWithAdapter(parsed.data.email, parsed.data.password)
    await signInWithAdapter(parsed.data.email, parsed.data.password)
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossibile completare la registrazione"
    return { success: false, error: message }
  }

  redirect("/journal")
}

export async function devSignOutAction() {
  ensureDevAuthEnabled()
  await signOutFromAdapter()
  redirect("/auth/dev/signin")
}
