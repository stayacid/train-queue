<script setup lang="ts">
import HelpButton from '@/molecules/HelpButton.vue'
</script>

<template>
  <header class="train-queue-header">
    <h1 class="train-queue-header__title">Очередь на поезд</h1>
    <HelpButton />
  </header>
</template>

<style scoped>
.train-queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.train-queue-header__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}
</style>
