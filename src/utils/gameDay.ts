import { GAME_DAY_START_HOUR, TIMEZONE } from '@/constants'

const MS_PER_DAY = 86_400_000
const DAY_START_OFFSET_MS = GAME_DAY_START_HOUR * 60 * 60 * 1000

/** Календарная дата (YYYY-MM-DD) в Europe/Moscow на указанный момент времени */
function moscowCalendarDay(instantMs: number): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instantMs))
  const partValue = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${partValue('year')}-${partValue('month')}-${partValue('day')}`
}

/**
 * Текущий игровой день. Игровой день начинается в GAME_DAY_START_HOUR МСК,
 * поэтому до 05:00 «сегодня» — это ещё вчерашний игровой день.
 */
export function currentGameDay(nowMs: number = Date.now()): string {
  return moscowCalendarDay(nowMs - DAY_START_OFFSET_MS)
}

function gameDayToUtcMs(gameDay: string): number | null {
  const [year, month, day] = gameDay.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  return Date.UTC(year, month - 1, day)
}

/** Число полных игровых дней от указанного игрового дня до текущего */
export function gameDaysAgo(gameDay: string, nowMs: number = Date.now()): number {
  const thenMs = gameDayToUtcMs(gameDay)
  const todayMs = gameDayToUtcMs(currentGameDay(nowMs))
  if (thenMs === null || todayMs === null) {
    return 0
  }
  return Math.round((todayMs - thenMs) / MS_PER_DAY)
}
