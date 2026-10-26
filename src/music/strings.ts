// String matching and detection ranges for a tuning. Pure functions, no DOM.

import { centsBetween, noteFrequency } from './notes'

export type StringMatch = {
  /** Index into the tuning's notes array. */
  index: number
  targetFrequency: number
  cents: number
}

function frequenciesOf(notes: readonly string[], a4: number): number[] {
  return notes.map((note) => {
    const frequency = noteFrequency(note, a4)
    if (frequency === null) throw new Error(`Invalid note name: ${note}`)
    return frequency
  })
}

/**
 * Find the string whose target is closest (in cents) to the detected frequency.
 * Matches on pitch, never on string order, so re-entrant tunings work.
 * Ties go to the earlier string.
 */
export function matchString(
  frequency: number,
  notes: readonly string[],
  a4: number,
): StringMatch | null {
  let best: StringMatch | null = null
  frequenciesOf(notes, a4).forEach((target, index) => {
    const cents = centsBetween(frequency, target)
    if (best === null || Math.abs(cents) < Math.abs(best.cents)) {
      best = { index, targetFrequency: target, cents }
    }
  })
  return best
}

export type FrequencyRange = { minHz: number; maxHz: number }

/** Wide range used in chromatic mode, roughly B0 to G6. */
export const CHROMATIC_RANGE: FrequencyRange = { minHz: 30, maxHz: 1600 }

/**
 * Detection range for a tuning: lowest note minus a margin to highest note
 * plus a margin. Margins are in semitones.
 */
export function tuningRange(
  notes: readonly string[],
  a4: number,
  marginBelow = 5,
  marginAbove = 5,
): FrequencyRange {
  const frequencies = frequenciesOf(notes, a4)
  const lowest = Math.min(...frequencies)
  const highest = Math.max(...frequencies)
  return {
    minHz: lowest * Math.pow(2, -marginBelow / 12),
    maxHz: highest * Math.pow(2, marginAbove / 12),
  }
}
