import { Metadata } from "next"

import { JournalCalendar } from "@/components/journal/journal-calendar"
import { listEntries } from "@/server/actions/entries"

export const metadata: Metadata = {
  title: "Journal",
}

interface JournalPageProps {
  searchParams?: {
    date?: string
    view?: string
  }
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const entries = await listEntries()
  const serialisedEntries = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    mood: entry.mood,
    tags: entry.tags,
    createdAt: entry.createdAt.toISOString(),
  }))
  const initialDate = typeof searchParams?.date === "string" ? searchParams.date : undefined
  const possibleView = searchParams?.view
  const initialView =
    possibleView === "day" ||
    possibleView === "week" ||
    possibleView === "month" ||
    possibleView === "range"
      ? possibleView
      : undefined

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Il tuo diario</h1>
        <p className="text-muted-foreground">
          Naviga tra le tue entry utilizzando il calendario, filtra per intervallo e crea nuove note.
        </p>
      </div>
      <JournalCalendar
        entries={serialisedEntries}
        initialDate={initialDate}
        initialView={initialView}
      />
    </div>
  )
}
