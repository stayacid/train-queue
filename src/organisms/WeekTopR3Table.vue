<script setup lang="ts">
import SectionTitle from '@/atoms/SectionTitle.vue'
import PagedTable from '@/molecules/PagedTable.vue'
import type { TableColumn } from '@/types/table'
import type { WeekTopRow } from '@/types/train'

defineProps<{
  rows: WeekTopRow[]
}>()

const columns: TableColumn[] = [
  { prop: 'position', label: 'Место', width: 90 },
  { prop: 'name', label: 'Никнейм' },
  { prop: 'week', label: 'Неделя', width: 150 },
]
</script>

<template>
  <section class="table-section">
    <SectionTitle title="Лидеры R3 по VS" />
    <PagedTable v-if="rows.length > 0" :columns="columns" :data="rows">
      <!--
        Element Plus вызывает этот слот дважды: один раз с настоящей строкой,
        второй раз с пустой row: {} для детекта вложенных колонок.
        Поэтому рендерим ячейку только когда данные строки присутствуют.
      -->
      <template #position="{ row }">
        <span v-if="row.position !== undefined">#{{ row.position }}</span>
      </template>
      <template #week="{ row }">
        <span v-if="row.weekNumber !== undefined">
          {{ row.weekNumber }}
          <el-tag v-if="row.isCurrentWeek" type="primary" size="small" class="week-tag">
            текущая
          </el-tag>
        </span>
      </template>
    </PagedTable>
    <el-empty
      v-else
      description="Нет данных — заполните вкладку «Топ3 R3» в Google Sheets"
      :image-size="64"
    />
  </section>
</template>

<style scoped>
.table-section {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.week-tag {
  margin-left: 6px;
}
</style>
