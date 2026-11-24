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
 * Дней с последней поездки игрока (все поездки, любой ранг);
 * null, если игрок ни разу не ездил.
 */
function lastTripDaysAgo(name: string, allTrips: TripRecord[], nowMs: number): number | null {
  const lastTrip = allTrips.find((trip) => trip.name === name)
  return lastTrip === undefined ? null : gameDaysAgo(lastTrip.date, nowMs)
}

/**
 * Тот, кто дольше всех без поездки: никогда не ездивший — в приоритете,
 * затем — тот, чья последняя поездка дальше в прошлом; при равенстве —
 * по порядку в списке. Учитываются ВСЕ поездки игрока (R3, R4, R5),
 * включая сегодняшний день.
 */
function pickLongestWait(
  officers: Officer[],
  allTrips: TripRecord[],
  nowMs: number,
): Officer | null {
  let best: Officer | null = null
  let bestDays = -1
  for (const officer of officers) {
    const daysAgo = lastTripDaysAgo(officer.name, allTrips, nowMs)
    const wait = daysAgo === null ? Number.POSITIVE_INFINITY : daysAgo
    if (wait > bestDays) {
      best = officer
      bestDays = wait
    }
  }
  return best
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
 * - **День R4/R5**: из списка R4/R5 — тот, кто дольше всех без поездки
 *   (никогда не ездивший — в приоритете; при равенстве — по порядку в списке).
 * - **День R3**: из топ-3 R3 за предыдущую игровую неделю (неделя начинается
 *   в понедельник 05:00 МСК) — тот, кто дольше всех без поездки (при равенстве
 *   — по порядку в тройке). Если выбранный на кулдауне (< 10 дней) — мягкое
 *   предупреждение в UI, не блокировка. Если топ-3 за предыдущую неделю не
 *   найден — ближайшая предыдущая неделя; если и её нет — водитель не
 *   определяется (null).
 * - **Пустой журнал** → старт цикла: день R4/R5, голова списка (никто не ездил).
 *
 * Кулдаун не блокирует водителя: это мягкое предупреждение в UI.
 * Подсчёт ожидания учитывает все поездки игрока, включая сегодняшний день.
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
    return r3DriverForToday(trips, r3WeeklyTop, nowMs)
  }
  return pickLongestWait(r4r5Roster, trips, nowMs)
}

/** Водитель R3 на сегодня: из тройки за предыдущую игровую неделю — тот, кто дольше всех без поездки */
function r3DriverForToday(
  allTrips: TripRecord[],
  r3WeeklyTop: R3WeeklyTop,
  nowMs: number,
): Officer | null {
  const weekTop = weekTopForCurrentWeek(r3WeeklyTop, nowMs)
  if (weekTop === null) {
    return null
  }
  return pickLongestWait(weekTop.officers, allTrips, nowMs)
}
