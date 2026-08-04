import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes without style conflicts.
 * @param {...(string|undefined|null|false|Record<string, boolean>)} inputs
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
