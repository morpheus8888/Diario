"use client"

import React, { ReactNode } from "react"
import { usePathname } from "next/navigation"

import { ThemeProvider } from "@/components/theme-provider"

import { TooltipProvider } from "./ui/tooltip"

interface ProviderProps {
  children: ReactNode
}

export function Providers({ children }: ProviderProps) {
  const pathname = usePathname()
  return (
    <ThemeProvider
      forcedTheme={pathname === "/" ? "dark" : null}
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
