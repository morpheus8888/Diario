import { Metadata } from "next"
import { notFound } from "next/navigation"

import { AuthForm } from "../_components/auth-form"
import { devSignInAction } from "@/server/actions/dev-auth"

export const metadata: Metadata = {
  title: "Dev Sign In",
}

export default function DevSignInPage() {
  if (process.env.DEV_AUTH_ENABLED !== "true") {
    notFound()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <AuthForm
        title="Accedi"
        description="Accesso temporaneo solo per l'ambiente di sviluppo"
        submitLabel="Entra"
        action={devSignInAction}
        alternateLink={{
          href: "/auth/dev/signup",
          label: "Non hai un account? Registrati",
        }}
      />
    </div>
  )
}
