import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── Existing utility ─────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── ID generation ───────────────────────────────────────────────────────────

/** Generates a unique string ID with optional prefix, e.g. "exp_1721000000000_ab3f1" */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Score formatting ─────────────────────────────────────────────────────────

/** Returns a score formatted to 3 decimal places as a string, e.g. "0.842" */
export function formatScore(n: number): string {
  return n.toFixed(3)
}

/**
 * Returns a Tailwind text-color class based on score value:
 * - green  if n > 0.7
 * - yellow if n > 0.4
 * - red    otherwise
 */
export function scoreColor(n: number): string {
  if (n > 0.7) return 'text-green-400'
  if (n > 0.4) return 'text-yellow-400'
  return 'text-red-400'
}

// ─── Status helpers ───────────────────────────────────────────────────────────

/** Returns a badge variant string for a given experiment status. */
export function statusColor(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending:   'secondary',
    running:   'default',
    completed: 'outline',
    failed:    'destructive',
  }
  return map[status] ?? 'secondary'
}

// ─── Duration formatting ──────────────────────────────────────────────────────

/** Formats a number of seconds into a human-readable string, e.g. "2h 15m" or "45s" */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// ─── Score computation ────────────────────────────────────────────────────────

/**
 * Weighted composite score:
 *   naturalness × 0.45 + clarity × 0.35 + identity × 0.20
 */
export function computeCompositeScore(
  naturalness: number,
  clarity: number,
  identity: number,
): number {
  return naturalness * 0.45 + clarity * 0.35 + identity * 0.20
}
