<script setup lang="ts">
defineProps<{ username: string }>()
</script>

<template>
  <el-card class="driver-card" shadow="hover">
    <p class="driver-card__text">
      Сегодня поездом управляет <strong class="driver-card__username">{{ username }}</strong>
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
</style>
