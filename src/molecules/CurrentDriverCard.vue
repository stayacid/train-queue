<script setup lang="ts">
import { pluralDays } from '@/utils/format'

defineProps<{
  username: string
  /** Дней с момента последней поездки этого водителя; null — записей нет */
  lastTripDaysAgo: number | null
}>()
</script>

<template>
  <el-card class="driver-card" shadow="hover">
    <p class="driver-card__text">
      Сегодня поездом управляет <strong class="driver-card__username">{{ username }}</strong>
    </p>
    <p v-if="lastTripDaysAgo !== null" class="driver-card__last-trip">
      В прошлый раз управлял(а): {{ lastTripDaysAgo }} {{ pluralDays(lastTripDaysAgo) }} назад
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
</style>
