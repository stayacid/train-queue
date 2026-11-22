<script setup lang="ts">
import { computed } from 'vue'

import CurrentDriverCard from '@/molecules/CurrentDriverCard.vue'
import R4R5ListTable from '@/organisms/R4R5ListTable.vue'
import TrainQueueHeader from '@/organisms/TrainQueueHeader.vue'
import TripJournalTable from '@/organisms/TripJournalTable.vue'
import VsLeadersR3Table from '@/organisms/VsLeadersR3Table.vue'
import TrainQueueTemplate from '@/templates/TrainQueueTemplate.vue'
import { mockR3VsLeaders, mockR3WeeklyTop, mockR4R5Officers, mockTrips } from '@/data/mock'
import { useTrainQueueStore } from '@/stores/trainQueue'
import type { Officer, OfficerWithLastTrip } from '@/types/train'
import { gameDaysAgo } from '@/utils/gameDay'

const store = useTrainQueueStore()

// Этап 2: данные из мока; этап 3: загрузка из Google Sheets
store.load(mockTrips, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders)

const username = computed(() => store.currentDriver?.name ?? null)
const lastTripDaysAgo = computed(() => store.lastTripDaysAgo)

/** Строка таблицы офицеров: офицер + дата последней поездки и дней назад */
function officerRow(officer: Officer): OfficerWithLastTrip {
  const last = store.lastTripOf(officer.name)
  return {
    name: officer.name,
    rank: officer.rank,
    lastTripDate: last?.date ?? null,
    daysAgo: last === null ? null : gameDaysAgo(last.date),
  }
}

const r4r5Rows = computed<OfficerWithLastTrip[]>(() => store.r4r5Roster.map(officerRow))
const vsLeaderRows = computed<OfficerWithLastTrip[]>(() => store.r3VsLeaders.map(officerRow))
</script>

<template>
  <TrainQueueTemplate>
    <template #header>
      <TrainQueueHeader />
    </template>
    <template #driver>
      <CurrentDriverCard
        v-if="username !== null"
        :username="username"
        :last-trip-days-ago="lastTripDaysAgo"
      />
      <el-empty v-else description="Не удалось определить водителя" />
    </template>
    <template #tables>
      <TripJournalTable :trips="store.trips" />
      <R4R5ListTable :rows="r4r5Rows" />
      <VsLeadersR3Table :rows="vsLeaderRows" />
    </template>
  </TrainQueueTemplate>
</template>
