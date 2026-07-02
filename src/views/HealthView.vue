<script setup lang="ts">
import { useHealth } from '@/composables/useHealth'
import HealthCard from '@/components/health/HealthCard.vue'
import CacheStatus from '@/components/health/CacheStatus.vue'
import PoolStatus from '@/components/health/PoolStatus.vue'
import { useToast } from '@/composables/useToast'
import { watch } from 'vue'

const { data, error, loading } = useHealth(5000)
const { showToast } = useToast()

watch(error, (val) => {
  if (val) showToast(val, 'error')
})
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading && !data" class="text-gray-400 dark:text-gray-500 text-sm py-12 text-center">加载中...</div>

    <template v-else-if="data">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <HealthCard label="服务状态" :value="data.status === 'ok' ? '正常' : '异常'" :color="data.status === 'ok' ? 'green' : 'red'" />
        <HealthCard
          label="Gemini API"
          :value="data.gemini === 'up' ? '已配置' : data.gemini === 'unconfigured' ? '未配置' : data.gemini === 'quota_exhausted' ? '配额耗尽' : 'API 不可用'"
          :color="data.gemini === 'up' ? 'green' : data.gemini === 'unconfigured' ? 'yellow' : data.gemini === 'quota_exhausted' ? 'orange' : 'red'"
        />
        <HealthCard label="总请求" :value="data.metrics.totalRequests" color="indigo" />
        <HealthCard label="平均耗时" :value="`${data.metrics.avgTotalMs}ms`" color="blue" />
        <HealthCard label="当前模型" :value="data.model ?? '未配置'" :color="data.model ? 'purple' : 'gray'" />
      </div>

      <div v-if="data.detail" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <h4 class="text-sm font-medium text-red-600 dark:text-red-400 mb-1">错误详情</h4>
        <p class="text-sm text-red-600 dark:text-red-400">{{ data.detail }}</p>
      </div>

      <div v-if="data.exhaustedModels?.length" class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
        <h4 class="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">已耗尽模型</h4>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="model in data.exhaustedModels"
            :key="model"
            class="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full"
          >
            {{ model }}
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CacheStatus :data="data" />
        <PoolStatus :data="data" />
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">指标概览</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ data.metrics.totalRequests }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">总请求</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ data.metrics.errors }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">错误数</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ data.metrics.avgTotalMs }}ms</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">平均耗时</p>
          </div>
          <div>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ (data.cache.hitRate * 100).toFixed(1) }}%</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">缓存命中率</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
