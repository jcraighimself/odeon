// Built-in instruments and tunings. Adding an instrument should only mean adding data here.

import type { Instrument, Tuning } from './types'

export const instruments: readonly Instrument[] = [
  {
    id: 'guitar',
    name: 'Guitar',
    stringCount: 6,
    tunings: [
      { id: 'standard', name: 'Standard', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
      { id: 'drop-d', name: 'Drop D', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
      { id: 'dadgad', name: 'DADGAD', notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'] },
      { id: 'open-g', name: 'Open G', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'] },
      { id: 'open-d', name: 'Open D', notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'] },
      {
        id: 'half-step-down',
        name: 'Half-step down',
        notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
      },
    ],
  },
  {
    id: 'ukulele',
    name: 'Ukulele',
    stringCount: 4,
    tunings: [
      // Re-entrant: the G4 string is higher than the C4 next to it.
      { id: 'standard', name: 'Standard (re-entrant)', notes: ['G4', 'C4', 'E4', 'A4'] },
      { id: 'low-g', name: 'Low G', notes: ['G3', 'C4', 'E4', 'A4'] },
      { id: 'baritone', name: 'Baritone', notes: ['D3', 'G3', 'B3', 'E4'] },
    ],
  },
]

export function getInstrument(id: string): Instrument | undefined {
  return instruments.find((instrument) => instrument.id === id)
}

export function getTuning(instrument: Instrument, tuningId: string): Tuning | undefined {
  return instrument.tunings.find((tuning) => tuning.id === tuningId)
}
