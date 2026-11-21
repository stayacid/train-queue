import { createRouter, createWebHistory } from 'vue-router'

import TrainQueuePage from '@/pages/TrainQueuePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'train-queue',
      component: TrainQueuePage,
    },
  ],
})

export default router
