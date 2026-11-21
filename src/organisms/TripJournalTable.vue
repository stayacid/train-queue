<script setup lang="ts">
import RankTag from '@/atoms/RankTag.vue'
import SectionTitle from '@/atoms/SectionTitle.vue'
import PagedTable from '@/molecules/PagedTable.vue'
import { formatDate } from '@/utils/format'
import type { TableColumn } from '@/types/table'
import type { TripRecord } from '@/types/train'

defineProps<{ trips: TripRecord[] }>()

const columns: TableColumn[] = [
  { prop: 'name', label: 'Имя' },
  { prop: 'date', label: 'Дата', width: 140 },
  { prop: 'rank', label: 'Ранг', width: 110 },
]
</script>

<template>
  <section class="table-section">
    <SectionTitle title="Журнал поездок" />
    <PagedTable :columns="columns" :data="trips">
      <!--
        Element Plus вызывает эти слоты также с пустой row: {} для детекта
        вложенных колонок — поэтому проверяем наличие данных строки.
      -->
      <template #date="{ row }">
        {{ row.date !== undefined ? formatDate(row.date) : '' }}
      </template>
      <template #rank="{ row }">
        <RankTag v-if="row.rank !== undefined" :rank="row.rank" />
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
