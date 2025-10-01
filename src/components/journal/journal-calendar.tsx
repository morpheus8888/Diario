"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { it as itLocale } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type EntryForCalendar = {
  id: string
  title: string | null
  mood: string | null
  tags: string[]
  createdAt: string
}

type ViewMode = "day" | "week" | "month" | "range"

interface JournalCalendarProps {
  entries: EntryForCalendar[]
  initialDate?: string
  initialView?: ViewMode
}

function normaliseDate(value?: string) {
  if (!value) return new Date()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }
  return parsed
}

function getDateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function toDateRange(range?: DateRange) {
  if (!range?.from || !range.to) return undefined
  return {
    from: startOfDay(range.from),
    to: endOfDay(range.to),
  }
}

export function JournalCalendar({
  entries,
  initialDate,
  initialView = "month",
}: JournalCalendarProps) {
  const initial = startOfDay(normaliseDate(initialDate))
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const [selectedDate, setSelectedDate] = useState<Date>(initial)
  const [displayMonth, setDisplayMonth] = useState<Date>(startOfMonth(initial))
  const [rangeSelection, setRangeSelection] = useState<DateRange | undefined>()
  const [activeTags, setActiveTags] = useState<string[]>([])

  const entriesWithDate = useMemo(
    () =>
      entries
        .map((entry) => ({
          ...entry,
          date: new Date(entry.createdAt),
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [entries]
  )

  const entriesMatchingTags = useMemo(() => {
    if (activeTags.length === 0) {
      return entriesWithDate
    }
    return entriesWithDate.filter((entry) =>
      activeTags.every((tag) => entry.tags.includes(tag))
    )
  }, [entriesWithDate, activeTags])

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    entriesWithDate.forEach((entry) => {
      entry.tags.forEach((tag) => set.add(tag))
    })
    return Array.from(set).sort()
  }, [entriesWithDate])

  const datesWithEntries = useMemo(() => {
    const set = new Set<string>()
    entriesMatchingTags.forEach((entry) => {
      set.add(getDateKey(entry.date))
    })
    return Array.from(set).map((value) => new Date(`${value}T00:00:00`))
  }, [entriesMatchingTags])

  const effectiveRange = useMemo(() => {
    if (viewMode === "week") {
      const from = startOfWeek(selectedDate, { locale: itLocale })
      const to = endOfWeek(selectedDate, { locale: itLocale })
      return { from, to }
    }

    if (viewMode === "range") {
      return toDateRange(rangeSelection)
    }

    if (viewMode === "month") {
      return {
        from: startOfMonth(displayMonth),
        to: endOfMonth(displayMonth),
      }
    }

    return {
      from: startOfDay(selectedDate),
      to: endOfDay(selectedDate),
    }
  }, [viewMode, selectedDate, rangeSelection, displayMonth])

  const entriesInView = useMemo(() => {
    if (!effectiveRange) return []
    return entriesMatchingTags.filter((entry) =>
      isWithinInterval(entry.date, {
        start: effectiveRange.from,
        end: effectiveRange.to,
      })
    )
  }, [entriesMatchingTags, effectiveRange])

  const newEntryDate = useMemo(() => {
    if (viewMode === "range") {
      return effectiveRange?.from ?? selectedDate
    }
    if (viewMode === "month") {
      return startOfDay(displayMonth)
    }
    return selectedDate
  }, [viewMode, effectiveRange, selectedDate, displayMonth])

  const handleSelect = (value: Date | DateRange | undefined) => {
    if (!value) return
    if (viewMode === "range") {
      setRangeSelection(value as DateRange | undefined)
      const range = value as DateRange
      if (range?.from) {
        setSelectedDate(startOfDay(range.from))
      }
      return
    }
    if (value instanceof Date) {
      const day = startOfDay(value)
      setSelectedDate(day)
      if (viewMode === "week") {
        setRangeSelection({
          from: startOfWeek(day, { locale: itLocale }),
          to: endOfWeek(day, { locale: itLocale }),
        })
      }
    }
  }

  const shortcuts = {
    today: () => {
      const now = startOfDay(new Date())
      setSelectedDate(now)
      setDisplayMonth(startOfMonth(now))
      setViewMode("day")
    },
    thisWeek: () => {
      const now = new Date()
      setSelectedDate(startOfDay(now))
      setViewMode("week")
    },
    thisMonth: () => {
      const now = new Date()
      setDisplayMonth(startOfMonth(now))
      setSelectedDate(startOfDay(now))
      setViewMode("month")
    },
  }

  const monthCaption = format(displayMonth, "MMMM yyyy", { locale: itLocale })

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col gap-4 rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold capitalize">{monthCaption}</h2>
              <p className="text-sm text-muted-foreground">
                Seleziona un giorno, una settimana o un intervallo per filtrare le tue note.
              </p>
            </div>
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(value) => {
                if (!value) return
                setViewMode(value as ViewMode)
              }}
              className="self-start"
            >
              <ToggleGroupItem value="day">Giorno</ToggleGroupItem>
              <ToggleGroupItem value="week">Settimana</ToggleGroupItem>
              <ToggleGroupItem value="month">Mese</ToggleGroupItem>
              <ToggleGroupItem value="range">Intervallo</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Calendar
            locale={itLocale}
            mode={viewMode === "range" ? "range" : "single"}
            selected={viewMode === "range" ? rangeSelection : selectedDate}
            month={displayMonth}
            onMonthChange={(month) => setDisplayMonth(month)}
            onSelect={handleSelect}
            modifiers={{
              hasEntries: datesWithEntries,
              weekSelection:
                viewMode === "week"
                  ? {
                      from: startOfWeek(selectedDate, { locale: itLocale }),
                      to: endOfWeek(selectedDate, { locale: itLocale }),
                    }
                  : undefined,
            }}
            modifiersClassNames={{
              hasEntries:
                "after:absolute after:bottom-1 after:left-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-primary/80",
              weekSelection: "bg-primary/10 text-primary",
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={shortcuts.today}>
              Oggi
            </Button>
            <Button variant="secondary" size="sm" onClick={shortcuts.thisWeek}>
              Questa settimana
            </Button>
            <Button variant="secondary" size="sm" onClick={shortcuts.thisMonth}>
              Questo mese
            </Button>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 rounded-lg border bg-card p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Le tue entry</h3>
              <p className="text-sm text-muted-foreground">
                {effectiveRange
                  ? `${format(effectiveRange.from, "dd MMM", { locale: itLocale })} → ${format(effectiveRange.to, "dd MMM yyyy", { locale: itLocale })}`
                  : "Seleziona un intervallo"}
              </p>
            </div>
            <Link
              href={`/journal/new?date=${format(newEntryDate, "yyyy-MM-dd")}`}
              className={cn(buttonVariants(), "whitespace-nowrap")}
            >
              Nuova entry
            </Link>
          </div>
          {availableTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Filtra per tag:
              </span>
              {availableTags.map((tag) => {
                const isActive = activeTags.includes(tag)
                return (
                  <Button
                    key={tag}
                    size="sm"
                    variant={isActive ? "default" : "secondary"}
                    onClick={() => {
                      setActiveTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((item) => item !== tag)
                          : [...prev, tag]
                      )
                    }}
                    className="rounded-full"
                  >
                    #{tag}
                  </Button>
                )
              })}
              {activeTags.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTags([])}
                >
                  Pulisci filtri
                </Button>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-3">
            {entriesInView.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Nessuna entry per il periodo selezionato.
              </p>
            ) : (
              entriesInView.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-lg border bg-background p-4 transition hover:border-primary/60"
                >
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <Link
                        href={`/journal/${entry.id}`}
                        className="text-base font-semibold hover:underline"
                      >
                        {entry.title || format(entry.date, "dd MMMM yyyy", { locale: itLocale })}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {format(entry.date, "dd MMMM yyyy 'alle' HH:mm", { locale: itLocale })}
                      </p>
                    </div>
                    {entry.mood ? (
                      <span className="self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {entry.mood}
                      </span>
                    ) : null}
                  </div>
                  {entry.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
