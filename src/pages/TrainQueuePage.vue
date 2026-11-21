<script setup lang="ts">
import { computed } from 'vue'

import CurrentDriverCard from '@/molecules/CurrentDriverCard.vue'
import R4R5ListTable from '@/organisms/R4R5ListTable.vue'
import TrainQueueHeader from '@/organisms/TrainQueueHeader.vue'
import TripJournalTable from '@/organisms/TripJournalTable.vue'
import VsLeadersR3Table from '@/organisms/VsLeadersR3Table.vue'
import TrainQueueTemplate from '@/templates/TrainQueueTemplate.vue'
import { mockR3VsLeaders, mockR4R5Officers, mockTrips } from '@/data/mock'
import { useTrainQueueStore } from '@/stores/trainQueue'
import type { VsLeaderRow } from '@/types/train'
import { gameDaysAgo } from '@/utils/gameDay'

const store = useTrainQueueStore()

// Этап 2: данные из мока; этап 3: загрузка из Google Sheets
store.load(mockTrips, mockR4R5Officers, mockR3VsLeaders)

const username = computed(() => store.currentDriver?.name ?? null)
const lastTripDaysAgo = computed(() => store.lastTripDaysAgo)

/** Строки таблицы лидеров VS R3: офицер + дата последней поездки и дней назад */
const vsLeaderRows = computed<VsLeaderRow[]>(() =>
  store.r3VsLeaders.map((leader) => {
    const last = store.lastTripOf(leader.name)
    return {
      name: leader.name,
      rank: leader.rank,
      lastTripDate: last?.date ?? null,
      daysAgo: last === null ? null : gameDaysAgo(last.date),
    }
  }),
)
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
      <R4R5ListTable :officers="store.r4r5Roster" />
      <VsLeadersR3Table :rows="vsLeaderRows" />
    </template>
  </TrainQueueTemplate>
</template>
