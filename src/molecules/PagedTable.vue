<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed, ref, watch } from 'vue'

import type { TableColumn } from '@/types/table'

const props = withDefaults(
  defineProps<{
    columns: TableColumn[]
    data: readonly T[]
    pageSize?: number
  }>(),
  {
    pageSize: 5,
  },
)

const page = ref(1)

const pageCount = computed(() => Math.max(1, Math.ceil(props.data.length / props.pageSize)))

watch(pageCount, (max) => {
  if (page.value > max) {
    page.value = max
  }
})

const pagedData = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return props.data.slice(start, start + props.pageSize)
})
</script>

<template>
  <div class="paged-table">
    <el-table :data="pagedData" border stripe>
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        align="center"
      >
        <!--
          ВАЖНО: Element Plus вызывает этот default-слот дважды. Первый раз —
          с настоящей строкой данных. Второй раз — с пустой row: {} (и
          column: {}, $index: -1), чтобы «детектить» вложенные колонки.
          Поэтому любой именованный слот :name="col.prop" обязан проверять
          наличие полей row перед использованием (например, через v-if),
          иначе на пустой строке упадёт с undefined.
        -->
        <template #default="{ row }">
          <slot :name="col.prop" :row="row">
            {{ row[col.prop] }}
          </slot>
        </template>
      </el-table-column>
    </el-table>
    <div class="paged-table__pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="data.length"
        layout="prev, pager, next, total"
        background
      />
    </div>
  </div>
</template>

<style scoped>
.paged-table__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
