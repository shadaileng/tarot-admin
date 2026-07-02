<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all"
        :class="t.type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'"
      >
        {{ t.message }}
      </div>
    </div>
  </Teleport>
</template>
