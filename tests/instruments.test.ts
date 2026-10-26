import { describe, expect, it } from 'vitest'
import { getInstrument, getTuning, instruments } from '../src/data/instruments'
import { validateTuning } from '../src/data/validate'

describe('built-in tunings', () => {
  for (const instrument of instruments) {
    describe(instrument.name, () => {
      it('has unique tuning ids', () => {
        const ids = instrument.tunings.map((t) => t.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      for (const tuning of instrument.tunings) {
        it(`${tuning.name} is valid`, () => {
          expect(validateTuning(instrument, tuning)).toEqual([])
        })
      }
    })
  }

  it('has unique instrument ids', () => {
    const ids = instruments.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('lookups', () => {
  it('finds instruments and tunings by id', () => {
    const guitar = getInstrument('guitar')!
    expect(getTuning(guitar, 'drop-d')?.notes[0]).toBe('D2')
    expect(getInstrument('theremin')).toBeUndefined()
  })
})

describe('validateTuning', () => {
  const guitar = getInstrument('guitar')!

  it('reports a wrong string count', () => {
    expect(validateTuning(guitar, { id: 'x', name: 'X', notes: ['E2', 'A2'] })).toHaveLength(1)
  })

  it('reports bad note names and a missing name', () => {
    const errors = validateTuning(guitar, {
      id: 'x',
      name: ' ',
      notes: ['E2', 'A2', 'D3', 'G3', 'H3', 'E'],
    })
    expect(errors).toHaveLength(3)
  })
})
