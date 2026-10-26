/** Root-mean-square level of a buffer, used to ignore silence and room noise. */
export function rms(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) sum += buffer[i]! * buffer[i]!
  return buffer.length === 0 ? 0 : Math.sqrt(sum / buffer.length)
}
