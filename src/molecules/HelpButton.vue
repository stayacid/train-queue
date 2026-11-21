<script setup lang="ts">
import { QuestionFilled } from '@element-plus/icons-vue'
</script>

<template>
  <el-popover trigger="click" :width="380" placement="bottom-end">
    <template #reference>
      <el-button circle :icon="QuestionFilled" aria-label="Правила" />
    </template>
    <div class="help-rules">
      <p class="help-rules__intro">
        Эта страница показывает, чья сегодня очередь водить поезд. Правила такие:
      </p>
      <ul class="help-rules__list">
        <li>Поезд запускается раз в день</li>
        <li>Офицеры R3 и R4-R5 водят поезд по очереди</li>
        <li>Офицеры R4/R5 водят поезд по простой очереди</li>
        <li>Среди офицеров R3 выбираются лидеры по VS</li>
      </ul>
    </div>
  </el-popover>
</template>

<style scoped>
.help-rules__intro {
  margin: 0 0 8px;
}

.help-rules__list {
  margin: 0;
  padding-left: 18px;
}

.help-rules__list li + li {
  margin-top: 4px;
}
</style>
