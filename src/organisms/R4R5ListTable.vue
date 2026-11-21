<script setup lang="ts">
import RankTag from '@/atoms/RankTag.vue'
import SectionTitle from '@/atoms/SectionTitle.vue'
import PagedTable from '@/molecules/PagedTable.vue'
import type { TableColumn } from '@/types/table'
import type { Officer } from '@/types/train'

defineProps<{ officers: Officer[] }>()

const columns: TableColumn[] = [
  { prop: 'name', label: 'Имя' },
  { prop: 'rank', label: 'Ранг', width: 110 },
]
</script>

<template>
  <section class="table-section">
    <SectionTitle title="Список R4/R5" />
    <PagedTable :columns="columns" :data="officers">
      <template #rank="{ row }">
        <RankTag :rank="row.rank" />
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
