import { describe, expect, it } from 'vitest'
import {
  centsBetween,
  frequencyToMidi,
  midiToFrequency,
  midiToNoteName,
  nearestNote,
  noteFrequency,
  parseNote,
} from '../src/music/notes'
import { DEFAULT_A4 } from '../src/music/reference'

const A4 = DEFAULT_A4

describe('parseNote', () => {
  it.each([
    ['C4', 60],
    ['A4', 69],
    ['E2', 40],
    ['D2', 38],
    ['F#3', 54],
    ['Eb2', 39],
    ['Bb3', 58],
    ['B#3', 60],
    ['Cb4', 59],
    ['C-1', 0],
    ['g4', 67],
  ])('%s -> %i', (name, midi) => {
    expect(parseNote(name)).toBe(midi)
  })

  it.each(['', 'H2', 'E', 'E#', '4', 'Ebb2', 'E 2', '#E2'])('rejects %j', (name) => {
    expect(parseNote(name)).toBeNull()
  })
})

describe('frequency conversions', () => {
  it('matches known frequencies at A4 = 440', () => {
    expect(noteFrequency('A4', A4)).toBeCloseTo(440, 6)
    expect(noteFrequency('E2', A4)).toBeCloseTo(82.4069, 3)
    expect(noteFrequency('D2', A4)).toBeCloseTo(73.4162, 3)
    expect(noteFrequency('E4', A4)).toBeCloseTo(329.6276, 3)
  })

  it('follows the reference pitch', () => {
    expect(noteFrequency('A4', 432)).toBeCloseTo(432, 6)
    expect(noteFrequency('A3', 432)).toBeCloseTo(216, 6)
  })

  it('round-trips MIDI and frequency', () => {
    for (let midi = 20; midi <= 100; midi++) {
      expect(frequencyToMidi(midiToFrequency(midi, 445), 445)).toBeCloseTo(midi, 9)
    }
  })

  it('names MIDI notes with sharps', () => {
    expect(midiToNoteName(40)).toBe('E2')
    expect(midiToNoteName(54)).toBe('F#3')
    expect(midiToNoteName(0)).toBe('C-1')
  })
})

describe('cents', () => {
  it('is 1200 per octave and 100 per semitone', () => {
    expect(centsBetween(880, 440)).toBeCloseTo(1200, 9)
    expect(centsBetween(440 * Math.pow(2, 1 / 12), 440)).toBeCloseTo(100, 9)
    expect(centsBetween(440, 440)).toBe(0)
    expect(centsBetween(430, 440)).toBeLessThan(0)
  })
})

describe('nearestNote', () => {
  it('finds the note and cents offset', () => {
    const result = nearestNote(442, A4)
    expect(result.name).toBe('A')
    expect(result.octave).toBe(4)
    expect(result.cents).toBeCloseTo(centsBetween(442, 440), 9)
  })

  it('handles octave boundaries between B and C', () => {
    const b3 = noteFrequency('B3', A4)!
    const c4 = noteFrequency('C4', A4)!
    expect(midiToNoteName(nearestNote(b3 * Math.pow(2, 40 / 1200), A4).midi)).toBe('B3')
    expect(midiToNoteName(nearestNote(c4 * Math.pow(2, -40 / 1200), A4).midi)).toBe('C4')
  })

  it('keeps cents in [-50, 50) near the halfway point', () => {
    const e2 = noteFrequency('E2', A4)!
    const justBelow = nearestNote(e2 * Math.pow(2, 49.9 / 1200), A4)
    expect(midiToNoteName(justBelow.midi)).toBe('E2')
    expect(justBelow.cents).toBeCloseTo(49.9, 6)

    const justAbove = nearestNote(e2 * Math.pow(2, 50.1 / 1200), A4)
    expect(midiToNoteName(justAbove.midi)).toBe('F2')
    expect(justAbove.cents).toBeCloseTo(-49.9, 6)

    for (let f = 60; f < 1000; f *= 1.0137) {
      const { cents } = nearestNote(f, A4)
      expect(cents).toBeGreaterThanOrEqual(-50)
      expect(cents).toBeLessThan(50)
    }
  })
})
