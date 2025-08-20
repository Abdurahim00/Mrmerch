import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safely coerce unknown values to a number
export function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }
  return null
}

// Formatters with stable output matching existing UI conventions
export function formatSEK(value: unknown): string {
  const num = coerceNumber(value)
  if (num === null) return "N/A"
  return `${num.toFixed(2)} SEK`
}

export function formatUSD(value: unknown): string {
  const num = coerceNumber(value)
  if (num === null) return "Kr0.00"
  return `${num.toFixed(2)} Kr`
}
