import { describe, expect, it } from 'vitest'
import { instruments } from '../src/data/instruments'
import { centsBetween, noteFrequency } from '../src/music/notes'
import { DEFAULT_A4 } from '../src/music/reference'
import { CHROMATIC_RANGE, tuningRange } from '../src/music/strings'
import { bufferSizeFor } from '../src/pitch/buffer'
import { rms } from '../src/pitch/level'
import { detectPitchYin } from '../src/pitch/yin'
import { GUITAR_HARMONICS, synthesize } from './signals'

const SAMPLE_RATES = [44100, 48000]

// One case per string of every built-in tuning, at each sample rate.
const cases = SAMPLE_RATES.flatMap((sampleRate) =>
  instruments.flatMap((instrument) =>
    instrument.tunings.flatMap((tuning) => {
      const range = tuningRange(tuning.notes, DEFAULT_A4)
      return tuning.notes.map((note) => ({
        label: `${instrument.name} ${tuning.name} ${note} @ ${sampleRate}`,
        frequency: noteFrequency(note, DEFAULT_A4)!,
        sampleRate,
        range,
      }))
    }),
  ),
)

function detect(
  c: (typeof cases)[number],
  signal: { harmonics?: number[]; noise?: number; frequency?: number },
) {
  const length = bufferSizeFor(c.range.minHz, c.sampleRate)
  const buffer = synthesize({ frequency: c.frequency, sampleRate: c.sampleRate, length, ...signal })
  return detectPitchYin(buffer, { sampleRate: c.sampleRate, ...c.range })
}

describe('YIN on every built-in string', () => {
  it.each(cases)('pure sine: $label', (c) => {
    const result = detect(c, {})
    expect(result).not.toBeNull()
    expect(Math.abs(centsBetween(result!.frequency, c.frequency))).toBeLessThan(1)
  })

  it.each(cases)('with harmonics: $label', (c) => {
    const result = detect(c, { harmonics: GUITAR_HARMONICS })
    expect(result).not.toBeNull()
    expect(Math.abs(centsBetween(result!.frequency, c.frequency))).toBeLessThan(1)
  })

  it.each(cases)('with harmonics and noise: $label', (c) => {
    const result = detect(c, { harmonics: GUITAR_HARMONICS, noise: 0.2 })
    expect(result).not.toBeNull()
    // Noise costs a little accuracy, but it must never jump an octave.
    expect(Math.abs(centsBetween(result!.frequency, c.frequency))).toBeLessThan(3)
  })
})

describe('YIN off-pitch and edge cases', () => {
  it('measures a detuned string accurately', () => {
    const sampleRate = 48000
    const target = noteFrequency('E2', DEFAULT_A4)!
    const range = tuningRange(['E2', 'E4'], DEFAULT_A4)
    for (const offset of [-40, -12, -3, 3, 12, 40]) {
      const frequency = target * Math.pow(2, offset / 1200)
      const buffer = synthesize({
        frequency,
        sampleRate,
        length: 2048,
        harmonics: GUITAR_HARMONICS,
      })
      const result = detectPitchYin(buffer, { sampleRate, ...range })!
      expect(centsBetween(result.frequency, target)).toBeCloseTo(offset, 0)
    }
  })

  it('works across the wide chromatic range', () => {
    const sampleRate = 48000
    const length = bufferSizeFor(CHROMATIC_RANGE.minHz, sampleRate)
    expect(length).toBe(4096)
    for (const note of ['B1', 'E2', 'A3', 'C5', 'E6']) {
      const frequency = noteFrequency(note, DEFAULT_A4)!
      const buffer = synthesize({ frequency, sampleRate, length, harmonics: GUITAR_HARMONICS })
      const result = detectPitchYin(buffer, { sampleRate, ...CHROMATIC_RANGE })!
      expect(Math.abs(centsBetween(result.frequency, frequency))).toBeLessThan(1)
    }
  })

  it('returns null for silence', () => {
    const buffer = new Float32Array(2048)
    expect(detectPitchYin(buffer, { sampleRate: 48000, minHz: 60, maxHz: 500 })).toBeNull()
  })

  it('returns null for white noise', () => {
    const buffer = synthesize({
      frequency: 100,
      sampleRate: 48000,
      length: 2048,
      harmonics: [0],
      noise: 1,
    })
    expect(detectPitchYin(buffer, { sampleRate: 48000, minHz: 60, maxHz: 500 })).toBeNull()
  })

  it('rejects a buffer too short for the range', () => {
    expect(() =>
      detectPitchYin(new Float32Array(1024), { sampleRate: 48000, minHz: 50, maxHz: 500 }),
    ).toThrow()
  })
})

describe('bufferSizeFor', () => {
  it('uses 2048 for every built-in tuning at 44.1 and 48 kHz', () => {
    for (const c of cases) expect(bufferSizeFor(c.range.minHz, c.sampleRate)).toBe(2048)
  })
})

describe('rms', () => {
  it('is 0 for silence and 1/sqrt(2) for a unit sine', () => {
    expect(rms(new Float32Array(1024))).toBe(0)
    const sine = Float32Array.from({ length: 48000 }, (_, n) =>
      Math.sin((2 * Math.PI * 100 * n) / 48000),
    )
    expect(rms(sine)).toBeCloseTo(Math.SQRT1_2, 3)
  })
})
