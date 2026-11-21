import type { Officer, TripRecord } from '@/types/train'

/** Поездка сделана офицером R4/R5 */
function isR4R5Trip(trip: TripRecord): boolean {
  return trip.rank === 'R4' || trip.rank === 'R5'
}

/**
 * Чья очередь управлять поездом сегодня.
 *
 * - Последняя поездка в журнале была R4/R5 → сегодня день R3: водитель —
 *   лидер #1 по VS (рейтинг за день D−1, если D−1 воскресенье — за субботу;
 *   список нумерует сама игра, равенств нет).
 * - Иначе → сегодня день R4/R5: следующий в ростере после последней
 *   R4/R5-поездки (позиция в ростере — первичный ключ).
 * - Пустой журнал → старт цикла: день R4/R5, голова ростера.
 * - Последний R4/R5-водитель отсутствует в ростере → очередь стартует с головы.
 *
 * Кулдаун здесь не учитывается: это мягкое предупреждение в UI,
 * решение принимает человек.
 */
export function computeCurrentDriver(
  trips: TripRecord[],
  r4r5Roster: Officer[],
  r3VsLeaders: Officer[],
): Officer | null {
  const sorted = [...trips].sort((a, b) => b.date.localeCompare(a.date))
  const last = sorted[0]
  if (last !== undefined && isR4R5Trip(last)) {
    return r3VsLeaders[0] ?? null
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
