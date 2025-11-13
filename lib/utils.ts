import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, showExact = false): string {
  if (showExact || num <= 9999) {
    return num.toLocaleString()
  }

  if (num >= 1000000000) {
    return Math.floor(num / 1000000000) + "B"
  }
  if (num >= 1000000) {
    return Math.floor(num / 1000000) + "M"
  }
  if (num >= 10000) {
    return Math.floor(num / 1000) + "K"
  }

  return num.toString()
}
