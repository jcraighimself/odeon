const MIN_BUFFER_SIZE = 2048

/**
 * Analysis buffer size for a detection range: the smallest power of two that
 * holds at least two periods of the lowest frequency, and never under 2048.
 * Every built-in tuning (with the default range margin) fits in 2048;
 * chromatic mode's 30 Hz floor needs 4096.
 */
export function bufferSizeFor(minHz: number, sampleRate: number): number {
  const needed = 2 * (Math.ceil(sampleRate / minHz) + 1)
  let size = MIN_BUFFER_SIZE
  while (size < needed) size *= 2
  return size
}
