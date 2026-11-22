import { MIN_DAYS_R3 } from '@/constants'
import type { Officer, R3WeeklyTop, TripRecord } from '@/types/train'
import { addGameDays, currentGameDay, currentGameWeekMonday, gameDaysAgo } from '@/utils/gameDay'

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
 * Тройка R3, которая управляет поездом в ТЕКУЩЕЙ игровой неделе.
 * Берём топ-3 за предыдущую игровую неделю (неделя начинается в
 * понедельник 05:00 МСК); если там записи нет — идём назад по неделям.
 * Возвращает найденный понедельник и тройку, либо null, если топ-3
 * не найден вовсе (вкладка «Топ3 R3» пуста).
 */
export function weekTopForCurrentWeek(
  weeklyTop: R3WeeklyTop,
  nowMs: number = Date.now(),
): { weekMonday: string; officers: Officer[] } | null {
  const weekMonday = currentGameWeekMonday(nowMs)
  if (weekMonday === null) {
    return null
  }
  const prevWeekMonday = addGameDays(weekMonday, -7) ?? weekMonday
  const officers = top3ForWeek(weeklyTop, prevWeekMonday)
  if (officers === null || officers.length === 0) {
    return null
  }
  return { weekMonday: prevWeekMonday, officers }
}

/**
 * Кто сегодня должен управлять поездом (назначение на текущий игровой день).
 *
 * Направление считается по поездкам, сделанным **до** текущего игрового дня:
 * поездка сегодняшнего дня в журнале — это результат дня (кто реально ездил),
 * а не вход в назначение. Фактический машинист дня берётся отдельно из записи
 * журнала на текущий игровой день (UI: «Фактический машинист сегодня»).
 *
 * - **Чередование** сохраняется 1:1: фаза определяется из последней записи
 *   журнала (до сегодняшнего дня) — последний водитель R4/R5 → сегодня
 *   день R3; R3 → день R4/R5.
 * - **День R4/R5**: следующий в списке R4/R5 после последнего R4/R5-водителя
 *   (циклически).
 * - **День R3**: поезд ведут топ-3 R3 за предыдущую игровую неделю
 *   (неделя начинается в понедельник 05:00 МСК), по порядку: 1-й R3-день
 *   недели → #1, 2-й → #2, 3-й → #3, 4-й и далее — по кругу (снова #1).
 *   Слот = количество R3-поездок до сегодняшнего дня за текущую игровую
 *   неделю.
 *   Если назначенный на кулдауне (< 10 дней) — следующий доступный из тройки
 *   по порядку; если все на кулдауне — назначенный (мягкое предупреждение
 *   в UI). Если топ-3 за предыдущую неделю не найден — ближайшая
 *   предыдущая неделя; если и её нет — водитель не определяется (null).
 * - **Пустой журнал** → старт цикла: день R4/R5, голова списка.
 * - **Последний R4/R5-водитель отсутствует в списке** → очередь стартует с головы.
 *
 * Кулдаун не блокирует водителя: это мягкое предупреждение в UI,
 * кроме выбора следующего доступного из тройки R3. Проверка кулдауна
 * учитывает все поездки, включая сегодняшний день.
 */
export function computeCurrentDriver(
  trips: TripRecord[],
  r4r5Roster: Officer[],
  r3WeeklyTop: R3WeeklyTop,
  nowMs: number = Date.now(),
): Officer | null {
  // Направление на сегодня — без поездок текущего игрового дня
  const today = currentGameDay(nowMs)
  const pastTrips = today === null ? trips : trips.filter((trip) => trip.date < today)
  const sorted = [...pastTrips].sort((a, b) => b.date.localeCompare(a.date))
  const last = sorted[0]
  if (last !== undefined && isR4R5Trip(last)) {
    return r3DriverForToday(sorted, trips, r3WeeklyTop, nowMs)
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
  sortedPastTrips: TripRecord[],
  allTrips: TripRecord[],
  r3WeeklyTop: R3WeeklyTop,
  nowMs: number,
): Officer | null {
  const weekTop = weekTopForCurrentWeek(r3WeeklyTop, nowMs)
  if (weekTop === null) {
    return null
  }
  const top3 = weekTop.officers
  const weekMonday = currentGameWeekMonday(nowMs)
  if (weekMonday === null) {
    return null
  }

  // Слот: число R3-поездок до сегодняшнего дня за текущую игровую неделю
  let slot = 0
  for (const trip of sortedPastTrips) {
    if (trip.rank === 'R3' && trip.date >= weekMonday) {
      slot++
    }
  }

  // Кулдаун проверяется по всем поездкам, включая сегодняшний день
  const onCooldown = (name: string): boolean => {
    const lastTrip = allTrips.find((trip) => trip.name === name)
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
