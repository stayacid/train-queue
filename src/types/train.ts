export type Rank = 'R3' | 'R4' | 'R5'

export type Officer = {
  name: string
  rank: Rank
}

export type TripRecord = Officer & {
  /** ISO-дата, например "2026-11-20" */
  date: string
}

/** Строка таблицы офицеров: офицер + данные о последней поездке */
export type OfficerWithLastTrip = Officer & {
  /** ISO-дата последней поездки; null, если в журнале поездок нет */
  lastTripDate: string | null
  /** Игровых дней с последней поездки; null, если поездок нет */
  daysAgo: number | null
}

/**
 * Строка таблицы «Лидеры R3 по VS»: игрок из вкладки «Топ3 R3»
 * + данные о последней поездке (из журнала).
 */
export type WeekTopRow = OfficerWithLastTrip & {
  /** Место в топ-3 недели (1–3) */
  position: number
  /** ISO-номер недели из колонки «Неделя» вкладки «Топ3 R3» */
  weekNumber: number
  /** Неделя строки — текущая календарная неделя */
  isCurrentWeek: boolean
}

/**
 * Топ-3 R3 по VS на игровую неделю: ключ — понедельник недели (ISO-дата).
 * Тройка недели управляет поездом на следующей неделе.
 */
export type R3WeeklyTop = Record<string, Officer[]>
