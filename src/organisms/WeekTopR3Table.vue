<script setup lang="ts">
import { computed } from 'vue'

import SectionTitle from '@/atoms/SectionTitle.vue'
import LastTripCell from '@/molecules/LastTripCell.vue'
import PagedTable from '@/molecules/PagedTable.vue'
import type { TableColumn } from '@/types/table'
import type { WeekTopRow } from '@/types/train'
import { formatDate } from '@/utils/format'

const props = defineProps<{
  rows: WeekTopRow[]
  /** Понедельник недели, за которую составлена тройка (ISO-дата); null — тройка не найдена */
  weekMonday: string | null
}>()

const columns: TableColumn[] = [
  { prop: 'position', label: 'Порядок', width: 90 },
  { prop: 'name', label: 'Имя' },
  { prop: 'lastTripDate', label: 'Последняя поездка', width: 250 },
]

const caption = computed(() =>
  props.weekMonday === null ? null : `Тройка за неделю от ${formatDate(props.weekMonday)}`,
)
</script>

<template>
  <section class="table-section">
    <SectionTitle title="Тройка R3 на эту неделю" />
    <p v-if="caption !== null" class="table-section__caption">{{ caption }}</p>
    <PagedTable v-if="rows.length > 0" :columns="columns" :data="rows">
      <!--
        Element Plus вызывает этот слот дважды: один раз с настоящей строкой,
        второй раз с пустой row: {} для детекта вложенных колонок.
        Поэтому рендерим ячейку только когда данные строки присутствуют.
      -->
      <template #position="{ row }">
        <span v-if="row.position !== undefined">#{{ row.position }}</span>
      </template>
      <template #lastTripDate="{ row }">
        <LastTripCell
          v-if="row.lastTripDate !== undefined || row.daysAgo !== undefined"
          :last-trip-date="row.lastTripDate ?? null"
          :days-ago="row.daysAgo ?? null"
          :cooldown-days="10"
        />
      </template>
    </PagedTable>
    <el-empty
      v-else
      description="Тройка R3 не найдена — заполните вкладку «Топ3 R3»"
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

.table-section__caption {
  margin: -8px 0 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
