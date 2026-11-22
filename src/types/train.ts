export type Rank = 'R3' | 'R4' | 'R5'

export type Officer = {
  name: string
  rank: Rank
}

export type TripRecord = Officer & {
  /** ISO-дата, например "2026-11-20" */
  date: string
}

/** Строка таблицы офицеров (R4/R5 и лидеры VS R3): офицер + данные о последней поездке */
export type OfficerWithLastTrip = Officer & {
  /** ISO-дата последней поездки; null, если в журнале поездок нет */
  lastTripDate: string | null
  /** Игровых дней с последней поездки; null, если поездок нет */
  daysAgo: number | null
}

/**
 * Топ-3 R3 по VS на игровую неделю: ключ — понедельник недели (ISO-дата).
 * Тройка недели управляет поездом на следующей неделе.
 */
export type R3WeeklyTop = Record<string, Officer[]>
