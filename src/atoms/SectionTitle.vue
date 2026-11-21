<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <h2 class="section-title">{{ title }}</h2>
</template>

<style scoped>
.section-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
