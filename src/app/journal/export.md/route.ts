import { NextResponse } from "next/server"

import { getCurrentUserIdFromAdapter } from "@/lib/auth"
import { db } from "@/lib/db"
import { editorContentToMarkdown } from "@/lib/editor-export"

export async function GET() {
  const userId = await getCurrentUserIdFromAdapter()

  const entries = await db.entry.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })

  const formatter = new Intl.DateTimeFormat("it-IT", {
    dateStyle: "full",
    timeStyle: "short",
  })

  const sections = entries.map((entry) => {
    const dateLabel = formatter.format(entry.createdAt)
    const title = entry.title ? `## ${entry.title}` : `## Entry del ${dateLabel}`
    const mood = entry.mood ? `**Mood:** ${entry.mood}` : ""
    const tags = entry.tags.length ? `**Tag:** ${entry.tags.map((tag) => `#${tag}`).join(" ")}` : ""
    const content = editorContentToMarkdown(entry.content)

    return [title, `*${dateLabel}*`, mood, tags, content].filter(Boolean).join("\n\n")
  })

  const body = `# Diario personale\n\nEsportato il ${formatter.format(new Date())}\n\n${sections.join("\n\n---\n\n")}`

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": "attachment; filename=journal-export.md",
    },
  })
}
