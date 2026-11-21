<template>
  <div class="train-queue-template">
    <div class="train-queue-template__header">
      <slot name="header" />
    </div>
    <main class="train-queue-template__main">
      <slot name="driver" />
      <div class="train-queue-template__tables">
        <slot name="tables" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.train-queue-template {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.train-queue-template__header {
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.train-queue-template__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.train-queue-template__tables {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
</style>
