<script setup lang="ts">
import { computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'

import HelpButton from '@/molecules/HelpButton.vue'
import type { DataSource } from '@/data/loader'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{
  /** ISO-время UTC последней загрузки данных; null — нет (мок) */
  fetchedAt?: string | null
  /** Откуда взяты данные; null — ещё не загружены */
  source?: DataSource | null
  /** Идёт ли обновление из Google Sheets */
  refreshing?: boolean
}>()

defineEmits<{ refresh: [] }>()

const SOURCE_LABELS: Record<DataSource, string> = {
  file: 'данные из таблицы Google Sheets',
  cache: 'данные из таблицы Google Sheets (кеш браузера)',
  live: 'данные из таблицы Google Sheets',
  mock: 'демо-данные',
}

const sourceLabel = computed(() =>
  props.source === null || props.source === undefined ? null : SOURCE_LABELS[props.source],
)
const updatedLabel = computed(() =>
  props.fetchedAt === null || props.fetchedAt === undefined ? null : formatDateTime(props.fetchedAt),
)
</script>

<template>
  <header class="train-queue-header">
    <div class="train-queue-header__left">
      <h1 class="train-queue-header__title">Очередь на поезд</h1>
      <p v-if="sourceLabel !== null" class="train-queue-header__caption">
        {{ sourceLabel }}<template v-if="updatedLabel !== null"> · обновлено {{ updatedLabel }}</template>
      </p>
    </div>
    <div class="train-queue-header__actions">
      <el-button :loading="refreshing" @click="$emit('refresh')">
        <el-icon v-if="!refreshing"><Refresh /></el-icon>
        Обновить
      </el-button>
      <HelpButton />
    </div>
  </header>
</template>

<style scoped>
.train-queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.train-queue-header__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.train-queue-header__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.train-queue-header__caption {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.train-queue-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
