<script setup lang="ts">
import CurrentDriverCard from '@/molecules/CurrentDriverCard.vue'
import R4R5ListTable from '@/organisms/R4R5ListTable.vue'
import TrainQueueHeader from '@/organisms/TrainQueueHeader.vue'
import TripJournalTable from '@/organisms/TripJournalTable.vue'
import VsLeadersR3Table from '@/organisms/VsLeadersR3Table.vue'
import TrainQueueTemplate from '@/templates/TrainQueueTemplate.vue'
import { mockCurrentDriver, mockR3VsLeaders, mockR4R5Officers, mockTrips } from '@/data/mock'
</script>

<template>
  <TrainQueueTemplate>
    <template #header>
      <TrainQueueHeader />
    </template>
    <template #driver>
      <CurrentDriverCard :username="mockCurrentDriver" />
    </template>
    <template #tables>
      <TripJournalTable :trips="mockTrips" />
      <R4R5ListTable :officers="mockR4R5Officers" />
      <VsLeadersR3Table :officers="mockR3VsLeaders" />
    </template>
  </TrainQueueTemplate>
</template>
