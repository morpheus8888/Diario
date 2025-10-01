"use server"

import { revalidatePath } from "next/cache"
import { notFound } from "next/navigation"
import { Entry } from "@prisma/client"
import { z } from "zod"

import { getCurrentUserIdFromAdapter } from "@/lib/auth"
import { db } from "@/lib/db"
import { enforceRateLimit } from "@/lib/rate-limit"
import {
  entryCreateSchema,
  entryUpdateSchema,
  type EntryCreateInput,
  type EntryUpdateInput,
} from "@/lib/validations/entry"

function sanitiseUpdateInput(input: EntryUpdateInput) {
  return {
    ...(input.title !== undefined ? { title: input.title?.trim() || null } : {}),
    ...(input.content !== undefined ? { content: input.content } : {}),
    ...(input.mood !== undefined ? { mood: input.mood?.trim() || null } : {}),
    ...(input.tags !== undefined
      ? { tags: input.tags.map((tag) => tag.trim().toLowerCase()) }
      : {}),
    ...(input.date !== undefined ? { createdAt: input.date } : {}),
  }
}

export async function createEntryAction(data: EntryCreateInput) {
  const userId = await getCurrentUserIdFromAdapter()
  enforceRateLimit(`${userId}:create`)

  const parsed = entryCreateSchema.safeParse(data)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi",
    }
  }

  const entry = await db.entry.create({
    data: {
      userId,
      title: parsed.data.title?.trim() || null,
      mood: parsed.data.mood?.trim() || null,
      tags: parsed.data.tags.map((tag) => tag.trim().toLowerCase()),
      content: parsed.data.content,
      createdAt: parsed.data.date,
    },
  })

  revalidatePath("/journal")
  revalidatePath(`/journal/${entry.id}`)

  return { success: true, entry }
}

export async function updateEntryAction(entryId: string, data: EntryUpdateInput) {
  const userId = await getCurrentUserIdFromAdapter()
  enforceRateLimit(`${userId}:update`)

  const parsedId = z.string().cuid().safeParse(entryId)
  if (!parsedId.success) {
    return { success: false, error: "ID entry non valido" }
  }

  const parsedData = entryUpdateSchema.safeParse(data)
  if (!parsedData.success) {
    return {
      success: false,
      error: parsedData.error.issues[0]?.message ?? "Dati non validi",
    }
  }

  const entry = await db.entry.findFirst({
    where: {
      id: parsedId.data,
      userId,
    },
  })

  if (!entry) {
    notFound()
  }

  const updateData = sanitiseUpdateInput(parsedData.data)

  await db.entry.update({
    where: { id: parsedId.data },
    data: updateData,
  })

  revalidatePath("/journal")
  revalidatePath(`/journal/${parsedId.data}`)

  return { success: true }
}

export async function deleteEntryAction(entryId: string) {
  const userId = await getCurrentUserIdFromAdapter()
  enforceRateLimit(`${userId}:delete`)

  const parsedId = z.string().cuid().safeParse(entryId)

  if (!parsedId.success) {
    return { success: false, error: "ID entry non valido" }
  }

  await db.entry.deleteMany({
    where: {
      id: parsedId.data,
      userId,
    },
  })

  revalidatePath("/journal")
  return { success: true }
}

export async function listEntries(params?: {
  from?: Date
  to?: Date
  tags?: string[]
}): Promise<Entry[]> {
  const userId = await getCurrentUserIdFromAdapter()

  return db.entry.findMany({
    where: {
      userId,
      ...(params?.from || params?.to
        ? {
            createdAt: {
              ...(params?.from ? { gte: params.from } : {}),
              ...(params?.to ? { lte: params.to } : {}),
            },
          }
        : {}),
      ...(params?.tags && params.tags.length > 0
        ? {
            tags: {
              hasSome: params.tags.map((tag) => tag.toLowerCase()),
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getEntryById(entryId: Entry["id"]) {
  const userId = await getCurrentUserIdFromAdapter()

  const entry = await db.entry.findFirst({
    where: {
      id: entryId,
      userId,
    },
  })

  if (!entry) {
    notFound()
  }

  return entry
}
