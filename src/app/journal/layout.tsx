import { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { getCurrentUserIdFromAdapter } from "@/lib/auth"
import { devSignOutAction } from "@/server/actions/dev-auth"

export default async function JournalLayout({
  children,
}: {
  children: ReactNode
}) {
  try {
    await getCurrentUserIdFromAdapter()
  } catch {
    redirect("/auth/dev/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <Link href="/journal" className="text-lg font-semibold">
            Diario
          </Link>
          {process.env.DEV_AUTH_ENABLED === "true" ? (
            <form action={devSignOutAction}>
              <Button variant="ghost" type="submit">
                Esci
              </Button>
            </form>
          ) : null}
        </div>
      </header>
      <main className="container py-6 lg:py-10">{children}</main>
    </div>
  )
}
