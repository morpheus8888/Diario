"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import EditorJS from "@editorjs/editorjs"
import { zodResolver } from "@hookform/resolvers/zod"
import type { OutputData } from "@editorjs/editorjs"
import { useForm } from "react-hook-form"
import TextareaAutosize from "react-textarea-autosize"
import { z } from "zod"

import "@/styles/editor.css"

import {
  createEntryAction,
  deleteEntryAction,
  updateEntryAction,
} from "@/server/actions/entries"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"
import { entryCreateSchema } from "@/lib/validations/entry"
import { cn } from "@/lib/utils"

import { uploadFiles } from "@/lib/uploadthing"

const metadataSchema = z.object({
  title: z.string().max(120).optional(),
  mood: z.string().max(50).optional(),
  tags: z.string().optional(),
  date: z.string().min(1, { message: "La data è obbligatoria" }),
})

type MetadataFormData = z.infer<typeof metadataSchema>

type EditorMode = "create" | "edit"

export interface JournalEditorProps {
  mode: EditorMode
  entry?: {
    id: string
    title: string | null
    content: OutputData
    mood: string | null
    tags: string[]
    createdAt: string
  }
  defaultDate?: string
}

export function JournalEditor({ mode, entry, defaultDate }: JournalEditorProps) {
  const router = useRouter()
  const editorRef = useRef<EditorJS | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const initialDate = useMemo(() => {
    if (entry) {
      return entry.createdAt.split("T")[0]
    }
    if (defaultDate) {
      return defaultDate
    }
    const today = new Date()
    return today.toISOString().split("T")[0]
  }, [entry, defaultDate])

  const form = useForm<MetadataFormData>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      title: entry?.title ?? "",
      mood: entry?.mood ?? "",
      tags: entry?.tags.join(", ") ?? "",
      date: initialDate,
    },
  })

  const initialiseEditor = useCallback(async () => {
    const EditorCore = (await import("@editorjs/editorjs")).default
    const Header = (await import("@editorjs/header")).default
    const Checklist = (await import("@editorjs/checklist")).default
    const Embed = (await import("@editorjs/embed")).default
    const Table = (await import("@editorjs/table")).default
    const List = (await import("@editorjs/list")).default
    const Code = (await import("@editorjs/code")).default
    const LinkTool = (await import("@editorjs/link")).default
    const InlineCode = (await import("@editorjs/inline-code")).default
    const ImageTool = (await import("@editorjs/image")).default
    const ColorPlugin = (await import("editorjs-text-color-plugin")).default

    if (!editorRef.current) {
      const editor = new EditorCore({
        holder: "editor",
        onReady() {
          editorRef.current = editor
        },
        placeholder: "Scrivi qui la tua entry...",
        inlineToolbar: true,
        data: entry?.content ?? { blocks: [] },
        tools: {
          header: Header,
          linkTool: LinkTool,
          list: List,
          code: Code,
          inlineCode: InlineCode,
          table: Table,
          checklist: Checklist,
          embed: Embed,
          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const [res] = await uploadFiles({
                    files: [file],
                    endpoint: "imageUploader",
                  })

                  return {
                    success: 1,
                    file: {
                      url: res.fileUrl,
                    },
                  }
                },
              },
            },
          },
          Color: {
            class: ColorPlugin,
            config: {
              colorCollections: [
                "#EC7878",
                "#9C27B0",
                "#673AB7",
                "#3F51B5",
                "#0070FF",
                "#03A9F4",
                "#00BCD4",
                "#4CAF50",
                "#8BC34A",
                "#CDDC39",
                "#FFF",
              ],
              defaultColor: "#FF1300",
              type: "text",
              customPicker: true,
            },
          },
          Marker: {
            class: ColorPlugin,
            config: {
              defaultColor: "#FFBF00",
              type: "marker",
            },
          },
        },
      })
    }
  }, [entry?.content])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMounted(true)
    }
  }, [])

  useEffect(() => {
    if (isMounted) {
      initialiseEditor()
      return () => {
        editorRef.current?.destroy()
        editorRef.current = null
      }
    }
  }, [isMounted, initialiseEditor])

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true)

    try {
      const editorData = await editorRef.current?.save()

      if (!editorData || editorData.blocks.length === 0) {
        toast({
          title: "Contenuto mancante",
          description: "Aggiungi almeno un blocco all'entry prima di salvare.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const tags = values.tags
        ?.split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)

      if (mode === "create") {
        const payload = entryCreateSchema.parse({
          title: values.title?.trim() || undefined,
          mood: values.mood?.trim() || undefined,
          tags: tags ?? [],
          content: editorData,
          date: values.date,
        })

        const result = await createEntryAction(payload)

        if (!result.success || !result.entry) {
          throw new Error(result.error ?? "Impossibile salvare l'entry")
        }

        toast({ description: "Entry creata con successo" })
        router.push(`/journal/${result.entry.id}`)
        router.refresh()
        return
      }

      if (!entry) {
        throw new Error("Entry non trovata")
      }

      const response = await updateEntryAction(entry.id, {
        title: values.title?.trim() || undefined,
        mood: values.mood?.trim() || undefined,
        tags: tags ?? [],
        content: editorData,
        date: values.date,
      })

      if (!response.success) {
        throw new Error(response.error ?? "Impossibile aggiornare l'entry")
      }

      toast({ description: "Entry aggiornata" })
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Si è verificato un errore durante il salvataggio"
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  })

  const handleDelete = async () => {
    if (!entry) return
    const confirmed = window.confirm("Eliminare definitivamente questa entry?")
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const result = await deleteEntryAction(entry.id)
      if (!result.success) {
        throw new Error(result.error ?? "Impossibile eliminare l'entry")
      }
      toast({ description: "Entry eliminata" })
      router.push("/journal")
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Si è verificato un errore durante l'eliminazione"
      toast({
        title: "Errore",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/journal" className={cn(buttonVariants({ variant: "ghost" }))}>
          <Icons.chevronLeft className="mr-2 size-4" /> Torna al diario
        </Link>
        <div className="flex items-center gap-2">
          {mode === "edit" ? (
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting || isSaving}
              onClick={handleDelete}
            >
              {isDeleting && <Icons.spinner className="mr-2 size-4 animate-spin" />} Elimina
            </Button>
          ) : null}
          <Button type="submit" disabled={isSaving || isDeleting}>
            {isSaving && <Icons.spinner className="mr-2 size-4 animate-spin" />} Salva
          </Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo</Label>
            <TextareaAutosize
              id="title"
              placeholder="Titolo opzionale"
              className="w-full resize-none overflow-hidden bg-transparent text-3xl font-semibold focus:outline-none"
              {...form.register("title")}
            />
          </div>
          <div id="editor" className="min-h-[500px] rounded-lg border" />
          <p className="text-sm text-muted-foreground">
            Suggerimento: usa <kbd className="rounded-md border bg-muted px-1 text-xs uppercase">Tab</kbd> per aprire il menu dei comandi.
          </p>
        </div>
        <div className="space-y-5 rounded-lg border bg-card p-4">
          <div className="space-y-2">
            <Label htmlFor="mood">Mood</Label>
            <Input id="mood" placeholder="Es. ispirato, grato" {...form.register("mood")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tag</Label>
            <Textarea
              id="tags"
              rows={3}
              placeholder="Inserisci tag separati da virgola"
              {...form.register("tags")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data dell&apos;entry</Label>
            <Input id="date" type="date" {...form.register("date")}
            />
          </div>
        </div>
      </div>
    </form>
  )
}
