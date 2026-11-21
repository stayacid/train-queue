<script setup lang="ts">
import RankTag from '@/atoms/RankTag.vue'
import SectionTitle from '@/atoms/SectionTitle.vue'
import PagedTable from '@/molecules/PagedTable.vue'
import { MIN_DAYS_BETWEEN_DRIVES } from '@/constants'
import type { TableColumn } from '@/types/table'
import type { VsLeaderRow } from '@/types/train'
import { formatDate, pluralDays } from '@/utils/format'

defineProps<{ rows: VsLeaderRow[] }>()

const columns: TableColumn[] = [
  { prop: 'name', label: 'Имя' },
  { prop: 'rank', label: 'Ранг', width: 110 },
  { prop: 'lastTripDate', label: 'Последняя поездка', width: 250 },
]

/** Строка из слота PagedTable: el-table не передаёт типизированную строку, поэтому — plain object */
type SlotRow = Record<string, unknown>

function isOnCooldown(row: SlotRow): boolean {
  const daysAgo = row.daysAgo
  return typeof daysAgo === 'number' && daysAgo < MIN_DAYS_BETWEEN_DRIVES
}

function lastTripLabel(row: SlotRow): string {
  const lastTripDate = row.lastTripDate
  const daysAgo = row.daysAgo
  if (typeof lastTripDate !== 'string' || typeof daysAgo !== 'number') {
    return ''
  }
  return `${formatDate(lastTripDate)} · ${daysAgo} ${pluralDays(daysAgo)}`
}
</script>

<template>
  <section class="table-section">
    <SectionTitle title="Список лидеров VS R3" />
    <PagedTable :columns="columns" :data="rows">
      <template #rank="{ row }">
        <RankTag :rank="row.rank" />
      </template>
      <template #lastTripDate="{ row }">
        <span v-if="row.lastTripDate === null" class="vs-table__none">—</span>
        <span v-else :class="{ 'vs-table__cooldown': isOnCooldown(row) }">
          {{ lastTripLabel(row) }}
          <el-tag
            v-if="isOnCooldown(row)"
            type="danger"
            size="small"
            class="vs-table__cooldown-tag"
          >
            на кулдауне
          </el-tag>
        </span>
      </template>
    </PagedTable>
  </section>
</template>

<style scoped>
.table-section {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.vs-table__none {
  color: var(--el-text-color-secondary);
}

.vs-table__cooldown {
  color: var(--el-color-danger);
}

.vs-table__cooldown-tag {
  margin-left: 8px;
}
</style>
