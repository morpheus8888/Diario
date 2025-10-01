import { z } from "zod"

const editorBlockSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.any()),
})

export const editorContentSchema = z.object({
  time: z.number().int().optional(),
  version: z.string().optional(),
  blocks: z.array(editorBlockSchema).min(1, {
    message: "Aggiungi almeno un blocco al tuo contenuto",
  }),
})

const tagSchema = z
  .string()
  .trim()
  .min(1, { message: "Il tag non può essere vuoto" })
  .max(32, { message: "Il tag è troppo lungo" })

export const entryCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .max(120, { message: "Il titolo è troppo lungo" })
    .optional(),
  content: editorContentSchema,
  mood: z
    .string()
    .trim()
    .max(50, { message: "Il mood è troppo lungo" })
    .optional(),
  tags: z.array(tagSchema).max(20, { message: "Troppi tag" }).default([]),
  date: z.coerce.date({
    errorMap: () => ({ message: "Data non valida" }),
  }),
})

export const entryUpdateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .max(120, { message: "Il titolo è troppo lungo" })
      .optional(),
    content: editorContentSchema.optional(),
    mood: z
      .string()
      .trim()
      .max(50, { message: "Il mood è troppo lungo" })
      .optional(),
    tags: z.array(tagSchema).max(20, { message: "Troppi tag" }).optional(),
    date: z.coerce.date({
      errorMap: () => ({ message: "Data non valida" }),
    }).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Nessun dato da aggiornare",
  })

export type EditorContent = z.infer<typeof editorContentSchema>
export type EntryCreateInput = z.infer<typeof entryCreateSchema>
export type EntryUpdateInput = z.infer<typeof entryUpdateSchema>
