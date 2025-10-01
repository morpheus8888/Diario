import { Metadata } from "next"

import { JournalEditor } from "@/components/journal/editor"

export const metadata: Metadata = {
  title: "Nuova entry",
}

interface NewEntryPageProps {
  searchParams?: {
    date?: string
  }
}

export default function NewEntryPage({ searchParams }: NewEntryPageProps) {
  const defaultDate = typeof searchParams?.date === "string" ? searchParams.date : undefined

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Nuova entry</h1>
        <p className="text-muted-foreground">
          Usa l&apos;editor a blocchi per creare una nuova nota del tuo diario.
        </p>
      </div>
      <JournalEditor mode="create" defaultDate={defaultDate} />
    </div>
  )
}
