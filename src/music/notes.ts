// Note math: scientific pitch notation <-> MIDI <-> frequency, and cents.
// Pure functions, no DOM.

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

const LETTER_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const NOTE_PATTERN = /^([A-Ga-g])(#|b)?(-?\d+)$/

/** MIDI number of the A4 reference note. */
const A4_MIDI = 69

/**
 * Parse a note in scientific pitch notation ("E2", "F#3", "Bb3") to a MIDI number.
 * Returns null if the name doesn't parse.
 */
export function parseNote(name: string): number | null {
  const match = NOTE_PATTERN.exec(name.trim())
  if (!match) return null
  const [, letter, accidental, octaveText] = match
  const semitone = LETTER_SEMITONES[letter!.toUpperCase()]!
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  const octave = Number(octaveText)
  return 12 * (octave + 1) + semitone + offset
}

/** Name of a MIDI note using sharps, e.g. 40 -> { name: "E", octave: 2 }. */
export function midiToNote(midi: number): { name: string; octave: number } {
  const pitchClass = ((midi % 12) + 12) % 12
  return { name: NOTE_NAMES[pitchClass]!, octave: Math.floor(midi / 12) - 1 }
}

/** Full note label for a MIDI number, e.g. 40 -> "E2". */
export function midiToNoteName(midi: number): string {
  const { name, octave } = midiToNote(midi)
  return `${name}${octave}`
}

export function midiToFrequency(midi: number, a4: number): number {
  return a4 * Math.pow(2, (midi - A4_MIDI) / 12)
}

/** Fractional MIDI number for a frequency: 69 + 12 * log2(f / A4). */
export function frequencyToMidi(frequency: number, a4: number): number {
  return A4_MIDI + 12 * Math.log2(frequency / a4)
}

/** Frequency of a named note, or null if the name doesn't parse. */
export function noteFrequency(name: string, a4: number): number | null {
  const midi = parseNote(name)
  return midi === null ? null : midiToFrequency(midi, a4)
}

/** Cents from target: 1200 * log2(f / target). Positive is sharp. */
export function centsBetween(frequency: number, target: number): number {
  return 1200 * Math.log2(frequency / target)
}

export type NearestNote = {
  midi: number
  name: string
  octave: number
  /** Frequency of the nearest equal-tempered note. */
  targetFrequency: number
  /** Cents from the nearest note, in [-50, 50). */
  cents: number
}

/** The nearest equal-tempered note to a frequency (chromatic mode). */
export function nearestNote(frequency: number, a4: number): NearestNote {
  const exact = frequencyToMidi(frequency, a4)
  // Keep cents in [-50, 50): exactly halfway belongs to the upper note.
  const midi = Math.floor(exact + 0.5)
  const targetFrequency = midiToFrequency(midi, a4)
  const { name, octave } = midiToNote(midi)
  return { midi, name, octave, targetFrequency, cents: centsBetween(frequency, targetFrequency) }
}
