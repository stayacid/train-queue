<script setup lang="ts">
import { computed } from 'vue'

import { formatDate, pluralDays } from '@/utils/format'

const props = defineProps<{
  /** ISO-дата последней поездки; null, если в журнале поездок нет */
  lastTripDate: string | null
  /** Игровых дней с последней поездки; null, если поездок нет */
  daysAgo: number | null
  /** Порог кулдауна в игровых днях для ранга офицера (R3 — 10, R4/R5 — 14) */
  cooldownDays: number
}>()

// `== null` покрывает и null, и undefined: el-table-column (Element Plus)
// вызывает default-слот с пустой строкой row: {}, поэтому пропсы могут
// прийти undefined во время «детект-рендера» колонки.
const isOnCooldown = computed(
  () => props.daysAgo != null && props.daysAgo < props.cooldownDays,
)

const label = computed(() => {
  if (props.lastTripDate == null || props.daysAgo == null) {
    return ''
  }
  return `${formatDate(props.lastTripDate)} · ${props.daysAgo} ${pluralDays(props.daysAgo)}`
})
</script>

<template>
  <span v-if="lastTripDate == null" class="last-trip-cell__none">—</span>
  <span v-else :class="{ 'last-trip-cell__cooldown': isOnCooldown }">
    {{ label }}
    <el-tag v-if="isOnCooldown" type="danger" size="small" class="last-trip-cell__tag">
      на кулдауне
    </el-tag>
  </span>
</template>

<style scoped>
.last-trip-cell__none {
  color: var(--el-text-color-secondary);
}

.last-trip-cell__cooldown {
  color: var(--el-color-danger);
}

.last-trip-cell__tag {
  margin-left: 8px;
}
</style>
