"use client"

import { Moon, Sun } from 'lucide-react'
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

interface ThemeToggleProps {
  style?: React.CSSProperties
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  inMenu?: boolean
}

export function ThemeToggle({ style, className, size = "lg", inMenu = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = theme === "dark"

  if (inMenu) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`w-full justify-start gap-3 font-semibold rounded-xl shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${className || ""}`}
        style={style}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        {isDark ? "Light Mode" : "Dark Mode"}
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={className}
      style={style}
    >
      {isDark ? (
        <>
          <Sun className="h-5 w-5" />
          <span className="hidden sm:inline ml-2">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-5 w-5" />
          <span className="hidden sm:inline ml-2">Dark Mode</span>
        </>
      )}
    </Button>
  )
}
