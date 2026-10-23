import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names. Single shared implementation so UI stays
 * consistent — call this instead of copying clsx logic.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
