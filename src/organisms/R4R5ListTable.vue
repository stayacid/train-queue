<script setup lang="ts">
import RankTag from '@/atoms/RankTag.vue'
import SectionTitle from '@/atoms/SectionTitle.vue'
import LastTripCell from '@/molecules/LastTripCell.vue'
import PagedTable from '@/molecules/PagedTable.vue'
import type { TableColumn } from '@/types/table'
import type { OfficerWithLastTrip } from '@/types/train'
import { cooldownDaysFor } from '@/utils/cooldown'

defineProps<{ rows: OfficerWithLastTrip[] }>()

const columns: TableColumn[] = [
  { prop: 'name', label: 'Имя' },
  { prop: 'rank', label: 'Ранг', width: 110 },
  { prop: 'lastTripDate', label: 'Последняя поездка', width: 250 },
]
</script>

<template>
  <section class="table-section">
    <SectionTitle title="Список R4/R5" />
    <PagedTable :columns="columns" :data="rows">
      <!--
        Element Plus вызывает этот слот дважды: один раз с настоящей строкой,
        второй раз с пустой row: {} для детекта вложенных колонок.
        Поэтому рендерим ячейку только когда данные строки присутствуют.
      -->
      <template #rank="{ row }">
        <RankTag v-if="row.rank !== undefined" :rank="row.rank" />
      </template>
      <template #lastTripDate="{ row }">
        <LastTripCell
          v-if="row.lastTripDate !== undefined || row.daysAgo !== undefined"
          :last-trip-date="row.lastTripDate ?? null"
          :days-ago="row.daysAgo ?? null"
          :cooldown-days="cooldownDaysFor(row.rank)"
        />
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
</style>
