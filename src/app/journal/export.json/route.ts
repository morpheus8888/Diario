import { NextResponse } from "next/server"

import { getCurrentUserIdFromAdapter } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const userId = await getCurrentUserIdFromAdapter()

  const entries = await db.entry.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  })

  const body = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      count: entries.length,
      entries,
    },
    null,
    2
  )

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=journal-export.json",
    },
  })
}
