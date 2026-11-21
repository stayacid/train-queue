export type Rank = 'R3' | 'R4' | 'R5'

export type Officer = {
  name: string
  rank: Rank
}

export type TripRecord = Officer & {
  /** ISO-дата, например "2026-11-20" */
  date: string
}
