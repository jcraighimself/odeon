import { describe, expect, it } from 'vitest'
import { getInstrument, getTuning, instruments } from '../src/data/instruments'
import { noteFrequency } from '../src/music/notes'
import { DEFAULT_A4 } from '../src/music/reference'
import { matchString, tuningRange } from '../src/music/strings'

const A4 = DEFAULT_A4
const ukulele = getInstrument('ukulele')!
const reentrant = getTuning(ukulele, 'standard')!.notes

describe('matchString on re-entrant ukulele (G4 C4 E4 A4)', () => {
  it.each([
    ['G4', 0],
    ['C4', 1],
    ['E4', 2],
    ['A4', 3],
  ])('an in-tune %s matches string %i', (note, index) => {
    expect(matchString(noteFrequency(note, A4)!, reentrant, A4)?.index).toBe(index)
  })

  it('matches a flat G4 to the G string, not by position', () => {
    const flatG = noteFrequency('G4', A4)! * Math.pow(2, -30 / 1200)
    const match = matchString(flatG, reentrant, A4)!
    expect(match.index).toBe(0)
    expect(match.cents).toBeCloseTo(-30, 6)
  })

  it('matches a sharp C4 to the C string even though G4 is next to it', () => {
    const sharpC = noteFrequency('C4', A4)! * Math.pow(2, 80 / 1200)
    expect(matchString(sharpC, reentrant, A4)?.index).toBe(1)
  })

  it('matches a G4 played an octave low (G3) to the nearest string', () => {
    // G3 is far below everything; C4 is nearest.
    expect(matchString(noteFrequency('G3', A4)!, reentrant, A4)?.index).toBe(1)
  })
})

describe('matchString on every built-in tuning', () => {
  for (const instrument of instruments) {
    for (const tuning of instrument.tunings) {
      it(`${instrument.name} ${tuning.name}`, () => {
        tuning.notes.forEach((note, index) => {
          const match = matchString(noteFrequency(note, A4)!, tuning.notes, A4)!
          expect(tuning.notes[match.index]).toBe(tuning.notes[index])
          expect(match.cents).toBeCloseTo(0, 9)
        })
      })
    }
  }
})

describe('tuningRange', () => {
  it('spans the lowest to highest note with margins, regardless of string order', () => {
    const { minHz, maxHz } = tuningRange(reentrant, A4, 0, 0)
    expect(minHz).toBeCloseTo(noteFrequency('C4', A4)!, 6)
    expect(maxHz).toBeCloseTo(noteFrequency('A4', A4)!, 6)
  })

  it('applies semitone margins', () => {
    const { minHz, maxHz } = tuningRange(['E2', 'E4'], A4, 12, 12)
    expect(minHz).toBeCloseTo(noteFrequency('E1', A4)!, 6)
    expect(maxHz).toBeCloseTo(noteFrequency('E5', A4)!, 6)
  })
})
