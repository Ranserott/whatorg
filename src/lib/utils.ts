import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Handle Chile numbers (569...)
  if (digits.startsWith('569') && digits.length === 11) {
    return `+56 9 ${digits.slice(3, 7)} ${digits.slice(7)}`
  }
  
  // Handle other numbers if needed, or just return formatted
  return digits
}
