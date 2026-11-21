<script setup lang="ts">
import { computed } from 'vue'

import type { Rank } from '@/types/train'

const props = defineProps<{ rank: Rank }>()

const tagType = computed<'danger' | 'warning' | 'success'>(() => {
  switch (props.rank) {
    case 'R3':
      return 'danger'
    case 'R4':
      return 'warning'
    default:
      return 'success'
  }
})
</script>

<template>
  <el-tag :type="tagType" effect="light">{{ rank }}</el-tag>
</template>
