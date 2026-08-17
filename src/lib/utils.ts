import { type ClassValue, clsx } from 'clsx' // clsx junta classes com base em condições.
import { twMerge } from 'tailwind-merge' // Resolve conflitos entre classes do Tailwind.

// Função "cn": combina classes (com clsx) e resolve duplicatas/conflitos do Tailwind (com tailwind-merge).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
