// Synthetic test signals.

/** Small seeded PRNG (mulberry32) so noisy tests are reproducible. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type SignalOptions = {
  frequency: number
  sampleRate: number
  length: number
  /** Relative amplitudes of harmonics 1, 2, 3, ... Defaults to a pure sine. */
  harmonics?: number[]
  /** Peak amplitude of uniform white noise added on top. */
  noise?: number
  seed?: number
}

export function synthesize(options: SignalOptions): Float32Array {
  const { frequency, sampleRate, length, harmonics = [1], noise = 0, seed = 1 } = options
  const random = seededRandom(seed)
  // Fixed per-harmonic phase offsets, so the waveform isn't trivially symmetric.
  const phases = harmonics.map((_, i) => i * 0.7)
  const buffer = new Float32Array(length)
  for (let n = 0; n < length; n++) {
    let sample = 0
    harmonics.forEach((amplitude, i) => {
      sample +=
        amplitude * Math.sin((2 * Math.PI * frequency * (i + 1) * n) / sampleRate + phases[i]!)
    })
    if (noise > 0) sample += noise * (2 * random() - 1)
    buffer[n] = sample * 0.5
  }
  return buffer
}

/** Rough plucked-string spectrum: strong 2nd and 3rd harmonics. */
export const GUITAR_HARMONICS = [1, 0.9, 0.6, 0.4, 0.3, 0.2]
