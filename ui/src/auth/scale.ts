import type { Role } from '../types'

/**
 * How a round is rated, as the admin configured it: comments only, yes/no, or 1..max.
 * The backend's `Round.rates` is 0 (comments only), 1 (yes/no) or 3..20 (a 1-N rating);
 * `rejects` tells whether the round has the reject mark (always so for yes/no).
 */
export interface RoundScale {
  kind: 'comments' | 'binary' | 'rated'
  max: number
  rejects: boolean
}

export function scaleOf(rates: number, rejects?: boolean | null): RoundScale {
  if (rates <= 0) return { kind: 'comments', max: 0, rejects: false }
  if (rates === 1) return { kind: 'binary', max: 1, rejects: true }
  return { kind: 'rated', max: rates, rejects: rejects ?? true }
}

/**
 * Used while the scale is unknown or the backend does not expose it yet:
 * a juror rates 1-5 with a reject mark, a screener says yes / no.
 */
export function fallbackScale(role: Role | null): RoundScale {
  return role === 'screener' ? scaleOf(1) : scaleOf(5, true)
}

/** The rates to read to list a round "from the best": max..1. */
export const positiveRates = (s: RoundScale): number[] =>
  s.kind === 'comments' ? [] : Array.from({ length: s.max }, (_, i) => s.max - i)
