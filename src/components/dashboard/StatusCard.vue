<script setup lang="ts">
import type { ServiceInfo, HealthResponse } from '@/types'

defineProps<{
  info: ServiceInfo | null
  health: HealthResponse | null
}>()
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">服务状态</h3>
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">服务名</span>
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ info?.service ?? '-' }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">版本</span>
        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">v{{ info?.version ?? '-' }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">状态</span>
        <span
          class="inline-flex items-center gap-1 text-sm font-medium"
          :class="health?.status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
        >
          <span class="w-2 h-2 rounded-full" :class="health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'" />
          {{ health?.status === 'ok' ? '运行中' : '异常' }}
        </span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">Gemini API</span>
        <span
          class="text-sm font-medium"
          :class="{
            'text-green-600 dark:text-green-400': health?.gemini === 'up',
            'text-yellow-600 dark:text-yellow-400': health?.gemini === 'unconfigured',
            'text-orange-600 dark:text-orange-400': health?.gemini === 'quota_exhausted',
            'text-red-600 dark:text-red-400': health?.gemini === 'down',
          }"
        >
          {{ health?.gemini === 'up' ? '已配置' : health?.gemini === 'unconfigured' ? '未配置' : health?.gemini === 'quota_exhausted' ? '配额耗尽' : 'API 不可用' }}
        </span>
      </div>
      <div v-if="health?.model" class="flex items-center justify-between">
        <span class="text-sm text-gray-600 dark:text-gray-400">当前模型</span>
        <span class="text-sm font-medium text-purple-600 dark:text-purple-400">{{ health.model }}</span>
      </div>
      <div v-if="health?.detail" class="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
        <p class="text-xs text-red-600 dark:text-red-400">{{ health.detail }}</p>
      </div>
      <div v-if="health?.exhaustedModels?.length" class="mt-2">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">已耗尽模型：</p>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="model in health.exhaustedModels"
            :key="model"
            class="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded"
          >
            {{ model }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
