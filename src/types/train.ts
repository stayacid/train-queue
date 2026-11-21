export type Rank = 'R3' | 'R4' | 'R5'

export type Officer = {
  name: string
  rank: Rank
}

export type TripRecord = Officer & {
  /** ISO-дата, например "2026-11-20" */
  date: string
}

/** Строка таблицы лидеров VS R3: офицер + данные о последней поездке */
export type VsLeaderRow = Officer & {
  /** ISO-дата последней поездки; null, если в журнале поездок нет */
  lastTripDate: string | null
  /** Игровых дней с последней поездки; null, если поездок нет */
  daysAgo: number | null
}
