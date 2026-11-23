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

/** Текущая календарная дата (YYYY-MM-DD) в Europe/Moscow */
export function currentCalendarDay(nowMs: number = Date.now()): string {
  return moscowCalendarDay(nowMs)
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

/** Прибавить дни к игровому дню (ISO-дата); null для невалидной даты */
export function addGameDays(gameDay: string, days: number): string | null {
  const ms = gameDayToUtcMs(gameDay)
  if (ms === null) {
    return null
  }
  const date = new Date(ms + days * MS_PER_DAY)
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${date.getUTCFullYear()}-${month}-${day}`
}

/**
 * Понедельник (игровой день) игровой недели, содержащей gameDay.
 * Игровая неделя стартует в понедельник 05:00 МСК, поэтому достаточно
 * взять понедельник календарной недели игрового дня.
 */
export function gameWeekMonday(gameDay: string): string | null {
  const ms = gameDayToUtcMs(gameDay)
  if (ms === null) {
    return null
  }
  const dayOfWeek = new Date(ms).getUTCDay() // 0 — воскресенье … 6 — суббота
  const daysFromMonday = (dayOfWeek + 6) % 7
  return addGameDays(gameDay, -daysFromMonday)
}

/** Понедельник (игровой день) текущей игровой недели */
export function currentGameWeekMonday(nowMs: number = Date.now()): string | null {
  return gameWeekMonday(currentGameDay(nowMs))
}
