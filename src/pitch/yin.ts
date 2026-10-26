// YIN pitch detection (de Cheveigné & Kawahara, 2002). Pure function, no DOM or Web Audio.

export type YinOptions = {
  sampleRate: number
  minHz: number
  maxHz: number
  /** Cumulative mean normalized difference threshold. Lower is stricter. */
  threshold?: number
}

export type PitchResult = {
  frequency: number
  /** 0..1, how periodic the signal is (1 - normalized difference at the chosen lag). */
  clarity: number
}

const DEFAULT_THRESHOLD = 0.15

/**
 * Estimate the fundamental frequency of a buffer, searching only within
 * [minHz, maxHz]. Returns null if no clear pitch is found.
 * The buffer must be longer than twice the longest period (sampleRate / minHz).
 */
export function detectPitchYin(buffer: Float32Array, options: YinOptions): PitchResult | null {
  const { sampleRate, minHz, maxHz, threshold = DEFAULT_THRESHOLD } = options
  const minTau = Math.max(2, Math.floor(sampleRate / maxHz))
  // +1 so parabolic interpolation always has a neighbour on the right.
  const maxTau = Math.ceil(sampleRate / minHz) + 1
  const window = buffer.length - maxTau
  if (window < maxTau) {
    throw new Error(
      `Buffer of ${buffer.length} samples is too short for ${minHz} Hz at ${sampleRate} Hz`,
    )
  }

  // Step 1: difference function d(tau).
  const diff = new Float32Array(maxTau + 1)
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0
    for (let j = 0; j < window; j++) {
      const delta = buffer[j]! - buffer[j + tau]!
      sum += delta * delta
    }
    diff[tau] = sum
  }

  // Step 2: cumulative mean normalized difference d'(tau).
  const cmnd = new Float32Array(maxTau + 1)
  cmnd[0] = 1
  let runningSum = 0
  for (let tau = 1; tau <= maxTau; tau++) {
    runningSum += diff[tau]!
    cmnd[tau] = runningSum === 0 ? 1 : (diff[tau]! * tau) / runningSum
  }

  // Step 3: first dip below the threshold, then follow it down to its local minimum.
  let tau = -1
  for (let t = minTau; t < maxTau; t++) {
    if (cmnd[t]! < threshold) {
      while (t + 1 < maxTau && cmnd[t + 1]! < cmnd[t]!) t++
      tau = t
      break
    }
  }
  if (tau === -1) return null

  // Step 4: parabolic interpolation on the raw difference function for sub-sample accuracy.
  const left = diff[tau - 1]!
  const centre = diff[tau]!
  const right = diff[tau + 1]!
  const denominator = left - 2 * centre + right
  const shift = denominator > 0 ? (left - right) / (2 * denominator) : 0
  const period = tau + Math.max(-1, Math.min(1, shift))

  const frequency = sampleRate / period
  if (frequency < minHz || frequency > maxHz) return null
  return { frequency, clarity: 1 - cmnd[tau]! }
}
