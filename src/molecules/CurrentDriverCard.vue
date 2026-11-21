<script setup lang="ts">
import { computed } from 'vue'

import { MIN_DAYS_BETWEEN_DRIVES } from '@/constants'
import { pluralDays } from '@/utils/format'

const props = defineProps<{
  username: string
  /** Дней с момента последней поездки этого водителя; null — записей нет */
  lastTripDaysAgo: number | null
}>()

const lastTripText = computed(() => {
  if (props.lastTripDaysAgo === null) {
    return ''
  }
  return `В прошлый раз управлял(а): ${props.lastTripDaysAgo} ${pluralDays(props.lastTripDaysAgo)} назад`
})

/** Игрок управлял слишком недавно — показываем предупреждение */
const isTooSoon = computed(
  () => props.lastTripDaysAgo !== null && props.lastTripDaysAgo < MIN_DAYS_BETWEEN_DRIVES,
)

const warningText = `Управлял(а) менее ${MIN_DAYS_BETWEEN_DRIVES} ${pluralDays(MIN_DAYS_BETWEEN_DRIVES)} назад! Рекомендуется выбрать другого игрока!`
</script>

<template>
  <el-card class="driver-card" shadow="hover">
    <p class="driver-card__text">
      Сегодня поездом управляет <strong class="driver-card__username">{{ username }}</strong>
    </p>
    <p v-if="lastTripDaysAgo !== null" class="driver-card__last-trip">
      <el-tooltip
        v-if="isTooSoon"
        :content="warningText"
        placement="top"
        popper-class="driver-card__tooltip"
      >
        <span class="driver-card__last-trip__value driver-card__last-trip__value--warning">
          {{ lastTripText }}
        </span>
      </el-tooltip>
      <span v-else class="driver-card__last-trip__value">{{ lastTripText }}</span>
    </p>
  </el-card>
</template>

<style scoped>
.driver-card {
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
}

.driver-card__text {
  margin: 0;
  font-size: 20px;
}

.driver-card__username {
  font-size: 22px;
  color: var(--el-color-primary);
}

.driver-card__last-trip {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.driver-card__last-trip__value--warning {
  color: var(--el-color-danger);
}
</style>

<style>
/* Поппер телепортируется в body, поэтому стили не scoped */
.driver-card__tooltip {
  max-width: 280px;
  white-space: normal;
}
</style>
