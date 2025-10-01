import { getCurrentUserIdFromAdapter } from "@/lib/auth"
import { db } from "@/lib/db"

export async function verifyCurrentUserHasAccessToEntry(entryId: string) {
  const userId = await getCurrentUserIdFromAdapter()
  const count = await db.entry.count({
    where: {
      id: entryId,
      userId,
    },
  })

  return count > 0
}
