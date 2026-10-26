export type Tuning = {
  /** "standard", "drop-d", or a generated id for custom ones. */
  id: string
  name: string
  /** Scientific pitch notation, in the order players list them: ["E2", "A2", ...]. */
  notes: string[]
  custom?: boolean
}

export type Instrument = {
  /** "guitar", "ukulele" */
  id: string
  name: string
  stringCount: number
  tunings: Tuning[]
}
