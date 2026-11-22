import { MIN_DAYS_R3 } from '@/constants'
import type { Officer, R3WeeklyTop, TripRecord } from '@/types/train'
import { addGameDays, currentGameDay, gameDaysAgo, gameWeekMonday } from '@/utils/gameDay'

/** Сколько недель назад ищем топ-3, если на прошлой неделе записи нет */
const MAX_WEEKS_BACK = 52

/** Поездка была сделана офицером R4/R5 */
function isR4R5Trip(trip: TripRecord): boolean {
  return trip.rank === 'R4' || trip.rank === 'R5'
}

/**
 * Топ-3 для игровой недели `weekMonday` (понедельник, ISO-дата):
 * если записи за точную неделю нет — идём назад по неделям
 * (до MAX_WEEKS_BACK включительно), если ничего нет — null.
 */
function top3ForWeek(weeklyTop: R3WeeklyTop, weekMonday: string): Officer[] | null {
  for (let i = 0; i <= MAX_WEEKS_BACK; i++) {
    const key = addGameDays(weekMonday, -7 * i)
    if (key === null) {
      return null
    }
    const entry = weeklyTop[key]
    if (entry !== undefined && entry.length > 0) {
      return entry
    }
  }
  return null
}

/**
 * Кто сегодня управляет поездом.
 *
 * - **Чередование** сохраняется 1:1: фаза определяется из последней записи
 *   журнала — последний водитель R4/R5 → сегодня день R3; R3 → день R4/R5.
 * - **День R4/R5**: следующий в ростере после последнего R4/R5-водителя
 *   (циклически).
 * - **День R3**: поезд ведут топ-3 R3 по VS за предыдущую игровую неделю
 *   (неделя начинается в понедельник 05:00 МСК), по порядку: 1-й R3-день
 *   недели → #1, 2-й → #2, 3-й → #3, 4-й и далее — по кругу (снова #1).
 *   Слот = количество R3-поездок в журнале за текущую игровую неделю.
 *   Если назначенный на кулдауне (< 10 дней) — следующий доступный из тройки
 *   по порядку; если все на кулдауне — назначенный (мягкое предупреждение
 *   в UI). Если топ-3 за неделю не найден — ближайшая предыдущая неделя,
 *   если и её нет — первые три из рейтинга VS (фолбэк).
 * - **Пустой журнал** → старт цикла: день R4/R5, голова ростера.
 * - **Последний R4/R5-водитель отсутствует в ростере** → очередь стартует с головы.
 *
 * Кулдаун не блокирует водителя: это мягкое предупреждение в UI,
 * кроме выбора следующего доступного из тройки R3.
 */
export function computeCurrentDriver(
  trips: TripRecord[],
  r4r5Roster: Officer[],
  r3WeeklyTop: R3WeeklyTop,
  r3VsLeaders: Officer[],
  nowMs: number = Date.now(),
): Officer | null {
  const sorted = [...trips].sort((a, b) => b.date.localeCompare(a.date))
  const last = sorted[0]
  if (last !== undefined && isR4R5Trip(last)) {
    return r3DriverForToday(sorted, r3WeeklyTop, r3VsLeaders, nowMs)
  }

  const lastR4R5 = sorted.find(isR4R5Trip)
  if (lastR4R5 === undefined) {
    return r4r5Roster[0] ?? null
  }
  const index = r4r5Roster.findIndex((officer) => officer.name === lastR4R5.name)
  if (index === -1) {
    return r4r5Roster[0] ?? null
  }
  return r4r5Roster[(index + 1) % r4r5Roster.length] ?? null
}

/** Водитель R3 на сегодня: слот из тройки за предыдущую игровую неделю */
function r3DriverForToday(
  sortedTrips: TripRecord[],
  r3WeeklyTop: R3WeeklyTop,
  r3VsLeaders: Officer[],
  nowMs: number,
): Officer | null {
  const today = currentGameDay(nowMs)
  const weekMonday = gameWeekMonday(today)
  if (weekMonday === null) {
    return r3VsLeaders[0] ?? null
  }

  const prevWeekMonday = addGameDays(weekMonday, -7) ?? weekMonday
  const top3 = top3ForWeek(r3WeeklyTop, prevWeekMonday) ?? r3VsLeaders.slice(0, 3)
  if (top3.length === 0) {
    return null
  }

  // Слот: число R3-поездок в журнале за текущую игровую неделю
  let slot = 0
  for (const trip of sortedTrips) {
    if (trip.rank === 'R3' && trip.date >= weekMonday && trip.date <= today) {
      slot++
    }
  }

  const onCooldown = (name: string): boolean => {
    const lastTrip = sortedTrips.find((trip) => trip.name === name)
    return lastTrip !== undefined && gameDaysAgo(lastTrip.date, nowMs) < MIN_DAYS_R3
  }

  const count = top3.length
  for (let k = 0; k < count; k++) {
    const candidate = top3[(slot + k) % count]
    if (candidate !== undefined && !onCooldown(candidate.name)) {
      return candidate
    }
  }
  // Все на кулдауне — назначенный, UI покажет мягкое предупреждение
  return top3[slot % count] ?? null
}
