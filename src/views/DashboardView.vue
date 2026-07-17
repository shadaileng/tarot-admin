<script setup lang="ts">
import { onMounted } from 'vue'
import type { ServiceInfo, HealthResponse } from '@/types'
import { fetchServiceInfo, fetchHealth } from '@/api'
import { useAsyncData } from '@/composables/useAsyncData'
import StatusCard from '@/components/dashboard/StatusCard.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'

const { data: info, loading, error, execute: loadData } = useAsyncData(async () => {
  const [i, h] = await Promise.all([fetchServiceInfo(), fetchHealth()])
  return { info: i, health: h }
})

onMounted(() => loadData())
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="text-gray-400 dark:text-gray-500 text-sm py-12 text-center">加载中...</div>

    <div v-else-if="error" class="text-center py-12">
      <svg class="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p class="text-red-500 dark:text-red-400 mb-3">{{ error }}</p>
      <button @click="loadData" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">点击重试</button>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusCard :info="info?.info ?? null" :health="info?.health ?? null" />

        <div class="grid grid-cols-2 gap-4">
           <MetricCard
            label="总请求数"
            :value="info?.health?.metrics.totalRequests ?? 0"
            color="indigo"
            icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
          <MetricCard
            label="错误数"
            :value="info?.health?.metrics.errors ?? 0"
            color="red"
            icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
          <MetricCard
            label="平均耗时"
            :value="`${((info?.health?.metrics.avgTotalMs ?? 0)).toFixed(0)}ms`"
            color="blue"
            icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <MetricCard
            label="缓存命中率"
            :value="`${((info?.health?.cache.hitRate ?? 0) * 100).toFixed(1)}%`"
            color="green"
            icon="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </div>
      </div>

      <div v-if="info?.health" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">缓存使用</p>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ info.health.cache.size }} / {{ info.health.cache.maxSize }}</p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">浏览器池</p>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            <span class="text-green-600 dark:text-green-400">{{ info.health.pool.available }} 可用</span>
            <span class="text-gray-400 mx-1">/</span>
            <span class="text-blue-600 dark:text-blue-400">{{ info.health.pool.active }} 活跃</span>
            <span class="text-gray-400 mx-1">/</span>
            <span class="text-yellow-600 dark:text-yellow-400">{{ info.health.pool.waiting }} 等待</span>
          </p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">API 端点</p>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ info?.info?.endpoints ? Object.keys(info.info.endpoints).length : 0 }} 个</p>
        </div>
      </div>
    </template>
  </div>
</template>
