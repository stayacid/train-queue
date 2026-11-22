<script setup lang="ts">
import { computed } from 'vue'

import { pluralDays } from '@/utils/format'

const props = defineProps<{
  /** Водитель, назначенный алгоритмом; null — алгоритм не определил */
  username: string | null
  /** Фактический машинист дня (запись журнала на текущий игровой день); null — записи нет */
  actualDriver: string | null
  /** Дней с момента последней поездки назначенного водителя; null — записей нет */
  lastTripDaysAgo: number | null
  /** Порог кулдауна в игровых днях для ранга водителя (R3 — 10, R4/R5 — 14) */
  cooldownDays: number
}>()

/** Фактический машинист отличается от назначенного — показываем строку */
const showActualDriver = computed(
  () => props.actualDriver !== null && props.actualDriver !== props.username,
)

const lastTripText = computed(() => {
  if (props.lastTripDaysAgo === null) {
    return ''
  }
  return `В прошлый раз управлял(а): ${props.lastTripDaysAgo} ${pluralDays(props.lastTripDaysAgo)} назад`
})

/** Игрок управлял слишком недавно — показываем предупреждение */
const isTooSoon = computed(
  () => props.lastTripDaysAgo !== null && props.lastTripDaysAgo < props.cooldownDays,
)

const warningText = computed(
  () =>
    `Управлял(а) менее ${props.cooldownDays} ${pluralDays(props.cooldownDays)} назад! Рекомендуется выбрать другого игрока!`,
)
</script>

<template>
  <el-card class="driver-card" shadow="hover">
    <p v-if="username !== null" class="driver-card__text">
      Сегодня поездом должен управлять <strong class="driver-card__username">{{ username }}</strong>
    </p>
    <p v-else class="driver-card__text driver-card__text--hint">
      Водитель по алгоритму не определён — проверьте вкладку «Топ3 R3» в Google Sheets
    </p>
    <p v-if="showActualDriver" class="driver-card__actual">
      Фактический машинист сегодня: <strong class="driver-card__username">{{ actualDriver }}</strong>
    </p>
    <p v-if="username !== null && lastTripDaysAgo !== null" class="driver-card__last-trip">
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
}

.driver-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.driver-card__text {
  margin: 0;
  font-size: 20px;
  line-height: 1.4;
}

.driver-card__text--hint {
  font-size: 16px;
  color: var(--el-text-color-secondary);
}

.driver-card__username {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.driver-card__actual {
  margin: 10px 0 0;
  font-size: 16px;
}

.driver-card__last-trip {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.driver-card__last-trip__value--warning {
  color: var(--el-color-danger);
  cursor: help;
}
</style>

<style>
.driver-card__tooltip {
  background: var(--el-color-danger) !important;
  color: #fff !important;
}
</style>
