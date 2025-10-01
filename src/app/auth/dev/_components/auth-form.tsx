"use client"

import { useFormState, useFormStatus } from "react-dom"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthFormProps {
  title: string
  description: string
  submitLabel: string
  action: (state: unknown, formData: FormData) => Promise<unknown>
  alternateLink?: {
    href: string
    label: string
  }
}

const initialState = {
  success: false,
  error: "",
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Attendi..." : label}
    </Button>
  )
}

export function AuthForm({
  title,
  description,
  submitLabel,
  action,
  alternateLink,
}: AuthFormProps) {
  const [state, formAction] = useFormState(action, initialState)

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-center text-2xl font-bold">{title}</CardTitle>
        <CardDescription className="text-center text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.error ? (
            <p className="text-sm font-medium text-destructive">{state.error}</p>
          ) : null}
          <SubmitButton label={submitLabel} />
        </form>
        {alternateLink ? (
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href={alternateLink.href}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {alternateLink.label}
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
