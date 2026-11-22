import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { Officer, R3WeeklyTop, TripRecord } from '@/types/train'
import { computeCurrentDriver } from '@/utils/queue'
import { gameDaysAgo } from '@/utils/gameDay'

export const useTrainQueueStore = defineStore('trainQueue', () => {
  /** Журнал поездок (этап 2 — мок, этап 3 — Google Sheets) */
  const trips = ref<TripRecord[]>([])
  /** Ростер R4/R5 в порядке очереди */
  const r4r5Roster = ref<Officer[]>([])
  /** Топ-3 R3 по VS на игровую неделю: ключ — понедельник недели (ISO-дата) */
  const r3WeeklyTop = ref<R3WeeklyTop>({})
  /** Лидеры R3 по VS в порядке рейтинга игры (таблица на странице + фолбэк, если топ-3 за неделю не найден) */
  const r3VsLeaders = ref<Officer[]>([])

  /** Журнал в порядке убывания даты */
  const sortedTrips = computed(() => [...trips.value].sort((a, b) => b.date.localeCompare(a.date)))

  /** Чья очередь сегодня (расчёт по журналу на вчерашний день) */
  const currentDriver = computed<Officer | null>(() =>
    computeCurrentDriver(trips.value, r4r5Roster.value, r3WeeklyTop.value, r3VsLeaders.value),
  )

  /** Дней с последней поездки текущего водителя; null — записей нет */
  const lastTripDaysAgo = computed<number | null>(() => {
    const driver = currentDriver.value
    if (driver === null) {
      return null
    }
    const last = sortedTrips.value.find((trip) => trip.name === driver.name)
    if (last === undefined) {
      return null
    }
    return gameDaysAgo(last.date)
  })

  /** Последняя поездка офицера (журнал отсортирован, новые сверху); null, если нет */
  const lastTripOf = (name: string): TripRecord | null =>
    sortedTrips.value.find((trip) => trip.name === name) ?? null

  /** Загрузить данные в стор (этап 2 — мок, этап 3 — Google Sheets) */
  function load(journal: TripRecord[], roster: Officer[], weeklyTop: R3WeeklyTop, leaders: Officer[]) {
    trips.value = journal
    r4r5Roster.value = roster
    r3WeeklyTop.value = weeklyTop
    r3VsLeaders.value = leaders
  }

  return {
    trips,
    r4r5Roster,
    r3WeeklyTop,
    r3VsLeaders,
    sortedTrips,
    currentDriver,
    lastTripDaysAgo,
    lastTripOf,
    load,
  }
})
