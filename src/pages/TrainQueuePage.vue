<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

import CurrentDriverCard from '@/molecules/CurrentDriverCard.vue'
import R4R5ListTable from '@/organisms/R4R5ListTable.vue'
import TrainQueueHeader from '@/organisms/TrainQueueHeader.vue'
import TripJournalTable from '@/organisms/TripJournalTable.vue'
import WeekTopR3Table from '@/organisms/WeekTopR3Table.vue'
import TrainQueueTemplate from '@/templates/TrainQueueTemplate.vue'
import { loadInitialData, refreshFromSheets, type DataSource } from '@/data/loader'
import { useTrainQueueStore } from '@/stores/trainQueue'
import type { Officer, OfficerWithLastTrip, WeekTopRow } from '@/types/train'
import { cooldownDaysFor } from '@/utils/cooldown'
import { gameDaysAgo } from '@/utils/gameDay'
import { weekTopForCurrentWeek } from '@/utils/queue'

const store = useTrainQueueStore()

const dataReady = ref(false)
const source = ref<DataSource | null>(null)
const fetchedAt = ref<string | null>(null)
const warnings = ref<string[]>([])
const refreshing = ref(false)

onMounted(async () => {
  try {
    const loaded = await loadInitialData(store)
    source.value = loaded.source
    fetchedAt.value = loaded.fetchedAt
  } finally {
    dataReady.value = true
  }
})

/** Кнопка «Обновить»: скачать вкладки прямо из Google Sheets и пересчитать */
async function onRefresh() {
  if (refreshing.value) {
    return
  }
  refreshing.value = true
  try {
    const { snapshot, warnings: parseWarnings } = await refreshFromSheets(store)
    source.value = 'live'
    fetchedAt.value = snapshot.fetchedAt
    warnings.value = parseWarnings
    ElMessage.success('Данные обновлены из Google Sheets')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : 'Не удалось обновить данные')
  } finally {
    refreshing.value = false
  }
}

const username = computed(() => store.currentDriver?.name ?? null)
const lastTripDaysAgo = computed(() => store.lastTripDaysAgo)

/** Порог кулдауна для ранга текущего водителя (R3 — 10, R4/R5 — 14) */
const driverCooldownDays = computed(() =>
  store.currentDriver === null ? 0 : cooldownDaysFor(store.currentDriver.rank),
)

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

/** Тройка R3, управляющая поездом на этой неделе (из топ-3 за прошлую неделю) */
const weekTop = computed(() => weekTopForCurrentWeek(store.r3WeeklyTop))
const weekTopRows = computed<WeekTopRow[]>(() =>
  (weekTop.value?.officers ?? []).map((officer, index) => ({
    ...officerRow(officer),
    position: index + 1,
  })),
)
</script>

<template>
  <TrainQueueTemplate>
    <template #header>
      <TrainQueueHeader
        :fetched-at="fetchedAt"
        :source="source"
        :refreshing="refreshing"
        @refresh="onRefresh"
      />
    </template>
    <template #driver>
      <el-skeleton v-if="!dataReady" :rows="3" animated />
      <template v-else>
        <CurrentDriverCard
          v-if="username !== null"
          :username="username"
          :last-trip-days-ago="lastTripDaysAgo"
          :cooldown-days="driverCooldownDays"
        />
        <el-empty
          v-else
          description="Водитель не определён — проверьте вкладку «Топ3 R3» в Google Sheets"
        />
      </template>
    </template>
    <template #tables>
      <el-alert
        v-for="warning in warnings"
        :key="warning"
        :title="warning"
        type="warning"
        :closable="false"
      />
      <TripJournalTable :trips="store.trips" />
      <R4R5ListTable :rows="r4r5Rows" />
      <WeekTopR3Table :rows="weekTopRows" :week-monday="weekTop?.weekMonday ?? null" />
    </template>
  </TrainQueueTemplate>
</template>
