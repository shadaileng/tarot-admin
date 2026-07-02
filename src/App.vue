<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const route = useRoute()
const isBlank = computed(() => (route.meta as any).layout === 'blank')
</script>

<template>
  <AppLayout v-if="!isBlank">
    <RouterView />
  </AppLayout>
  <RouterView v-else />
  <ToastContainer />
</template>
