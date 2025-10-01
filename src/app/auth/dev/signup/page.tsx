import { Metadata } from "next"
import { notFound } from "next/navigation"

import { AuthForm } from "../_components/auth-form"
import { devSignUpAction } from "@/server/actions/dev-auth"

export const metadata: Metadata = {
  title: "Dev Sign Up",
}

export default function DevSignUpPage() {
  if (process.env.DEV_AUTH_ENABLED !== "true") {
    notFound()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <AuthForm
        title="Crea account"
        description="Registrazione disponibile solo in locale / sviluppo"
        submitLabel="Registrati"
        action={devSignUpAction}
        alternateLink={{
          href: "/auth/dev/signin",
          label: "Hai già un account? Accedi",
        }}
      />
    </div>
  )
}
