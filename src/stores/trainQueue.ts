import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { Officer, R3WeeklyTop, TripRecord } from '@/types/train'
import { computeCurrentDriver } from '@/utils/queue'
import { currentGameDay, gameDaysAgo } from '@/utils/gameDay'

export const useTrainQueueStore = defineStore('trainQueue', () => {
  /** Журнал поездок */
  const trips = ref<TripRecord[]>([])
  /** Список R4/R5 в порядке очереди */
  const r4r5Roster = ref<Officer[]>([])
  /** Топ-3 R3 на игровую неделю: ключ — понедельник недели (ISO-дата) */
  const r3WeeklyTop = ref<R3WeeklyTop>({})

  /** Журнал в порядке убывания даты */
  const sortedTrips = computed(() => [...trips.value].sort((a, b) => b.date.localeCompare(a.date)))

  /** Чья очередь сегодня (назначение считается по поездкам до текущего игрового дня) */
  const currentDriver = computed<Officer | null>(() =>
    computeCurrentDriver(trips.value, r4r5Roster.value, r3WeeklyTop.value),
  )

  /** Поездка текущего игрового дня (фактический машинист); null — записи нет */
  const todayTrip = computed<TripRecord | null>(() => {
    const today = currentGameDay()
    if (today === null) {
      return null
    }
    return sortedTrips.value.find((trip) => trip.date === today) ?? null
  })

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

  /** Загрузить данные в стор (таблица Google Sheets или мок) */
  function load(journal: TripRecord[], roster: Officer[], weeklyTop: R3WeeklyTop) {
    trips.value = journal
    r4r5Roster.value = roster
    r3WeeklyTop.value = weeklyTop
  }

  return {
    trips,
    r4r5Roster,
    r3WeeklyTop,
    sortedTrips,
    currentDriver,
    todayTrip,
    lastTripDaysAgo,
    lastTripOf,
    load,
  }
})

export type TrainQueueStore = ReturnType<typeof useTrainQueueStore>
