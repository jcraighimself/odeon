// Tuning validation, shared by the built-in data tests and the custom tuning editor.

import { parseNote } from '../music/notes'
import type { Instrument, Tuning } from './types'

/** Returns a list of problems with a tuning; empty means it's valid. */
export function validateTuning(instrument: Instrument, tuning: Tuning): string[] {
  const errors: string[] = []
  if (!tuning.name.trim()) errors.push('Tuning needs a name.')
  if (tuning.notes.length !== instrument.stringCount) {
    errors.push(
      `${instrument.name} has ${instrument.stringCount} strings but the tuning has ${tuning.notes.length} notes.`,
    )
  }
  tuning.notes.forEach((note, i) => {
    if (parseNote(note) === null) errors.push(`String ${i + 1}: "${note}" is not a valid note.`)
  })
  return errors
}
