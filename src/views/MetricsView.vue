<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'vue-chartjs'
import { fetchMetricsRaw, parsePrometheusMetrics } from '@/api'
import type { MetricsSnapshot } from '@/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const metrics = ref<Partial<MetricsSnapshot>>({})
const loading = ref(true)
const error = ref<string | null>(null)

const chartData = ref({
  labels: ['请求数', '错误数'],
  datasets: [
    {
      label: '指标',
      data: [0, 0],
      backgroundColor: ['#6366f1', '#ef4444'],
      borderRadius: 6,
    },
  ],
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } },
  },
}

// 监听 metrics 变化，整体替换 chartData 以触发 Vue 响应式
watch(metrics, (newMetrics) => {
  chartData.value = {
    ...chartData.value,
    datasets: [{
      ...chartData.value.datasets[0],
      data: [
        newMetrics.totalRequests ?? 0,
        newMetrics.errorCount ?? 0,
      ]
    }]
  }
}, { deep: true })

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const raw = await fetchMetricsRaw()
    metrics.value = parsePrometheusMetrics(raw)
  } catch (err: any) {
    error.value = err.message || '加载指标失败'
  } finally {
    loading.value = false
  }
}

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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">总请求</p>
          <p class="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {{ metrics.totalRequests ?? 0 }}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">错误数</p>
          <p class="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
            {{ metrics.errorCount ?? 0 }}
          </p>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">平均耗时</p>
          <p class="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {{ (metrics.avgTotalMs ?? 0).toFixed(0) }}ms
          </p>
          <p class="text-xs text-gray-400 mt-1">
            P50: {{ (metrics.totalP50 ?? 0).toFixed(0) }}ms |
            P95: {{ (metrics.totalP95 ?? 0).toFixed(0) }}ms
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">请求分布</p>
          <div class="h-64">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">样本统计</p>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">总样本</span>
              <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">{{ metrics.sampleCount ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
