import { Metadata } from "next"

import { JournalEditor } from "@/components/journal/editor"
import { getEntryById } from "@/server/actions/entries"

interface EntryPageProps {
  params: {
    entryId: string
  }
}

export async function generateMetadata({ params }: EntryPageProps): Promise<Metadata> {
  const entry = await getEntryById(params.entryId)

  return {
    title: entry.title ? `${entry.title} | Diario` : "Modifica entry",
  }
}

export default async function EntryPage({ params }: EntryPageProps) {
  const entry = await getEntryById(params.entryId)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {entry.title || "Modifica entry"}
        </h1>
        <p className="text-muted-foreground">
          Aggiorna contenuto, tag e metadata della tua nota.
        </p>
      </div>
      <JournalEditor
        mode="edit"
        entry={{
          id: entry.id,
          title: entry.title,
          content: (entry.content as any) ?? { blocks: [] },
          mood: entry.mood,
          tags: entry.tags,
          createdAt: entry.createdAt.toISOString(),
        }}
      />
    </div>
  )
}
