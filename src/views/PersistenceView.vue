<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'vue-chartjs'
import { fetchPersistenceStats, fetchPersistenceHistory, runPersistenceClean } from '@/api'
import type { PersistenceStats, SizeHistorySnapshot } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const stats = ref<PersistenceStats | null>(null)
const history = ref<SizeHistorySnapshot[]>([])
const loading = ref(true)
const cleaning = ref(false)
const historyDays = ref(7)
const error = ref<string | null>(null)

const LOG_TABLES = ['request_logs', 'client_event_logs', 'audit_logs', 'reading_logs', 'readings', 'poster_tasks']

const dbSizeWarning = computed(() => (stats.value?.database.sizeBytes ?? 0) > 100 * 1024 * 1024)
const dbSizePercent = computed(() => {
  if (!stats.value) return 0
  const bytes = stats.value.database.sizeBytes
  return Math.min((bytes / (100 * 1024 * 1024)) * 100, 100)
})

const dbFreePercent = computed(() => {
  if (!stats.value || stats.value.database.totalPages === 0) return 0
  return ((stats.value.database.freePages / stats.value.database.totalPages) * 100).toFixed(1)
})

const logTables = computed(() => {
  if (!stats.value) return []
  return stats.value.tables.filter(t => LOG_TABLES.includes(t.name))
})

const nonLogTables = computed(() => {
  if (!stats.value) return []
  return stats.value.tables.filter(t => !LOG_TABLES.includes(t.name))
})

const TABLE_COLORS: Record<string, string> = {
  request_logs: '#6366f1',
  client_event_logs: '#22c55e',
  audit_logs: '#f59e0b',
  reading_logs: '#ef4444',
  readings: '#8b5cf6',
  poster_tasks: '#06b6d4',
}

const chartData = computed(() => {
  const reversed = [...history.value].reverse()
  const labels = reversed.map(s => {
    const d = new Date(s.snapshotAt)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`
  })

  const datasets = [
    {
      label: 'DB 大小 (KB)',
      data: reversed.map(s => Math.round(s.dbSizeBytes / 1024)),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      yAxisID: 'y',
    },
    ...LOG_TABLES.map(name => ({
      label: name.replace('_logs', '').replace('_', ' '),
      data: reversed.map(s => s.tableRows[name] || 0),
      borderColor: TABLE_COLORS[name] || '#9ca3af',
      backgroundColor: 'transparent',
      tension: 0.3,
      pointRadius: 2,
      borderWidth: 1.5,
      yAxisID: 'y1',
    })),
  ]

  return { labels, datasets }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { position: 'bottom' as const, labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
    tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}` } },
  },
  scales: {
    x: { ticks: { maxTicksLimit: 12, font: { size: 10 } } },
    y: {
      type: 'linear' as const,
      position: 'left' as const,
      title: { display: true, text: 'DB 大小 (KB)', font: { size: 11 } },
      beginAtZero: true,
    },
    y1: {
      type: 'linear' as const,
      position: 'right' as const,
      title: { display: true, text: '行数', font: { size: 11 } },
      beginAtZero: true,
      grid: { drawOnChartArea: false },
    },
  },
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

async function loadStats() {
  try {
    stats.value = await fetchPersistenceStats()
  } catch (err: any) {
    error.value = err.message || '加载失败'
  }
}

async function loadHistory() {
  try {
    const res = await fetchPersistenceHistory(historyDays.value)
    history.value = res.snapshots
  } catch {}
}

async function handleClean() {
  if (!confirm('确定要清理所有过期日志吗？此操作不可撤销。')) return
  cleaning.value = true
  try {
    const res = await runPersistenceClean()
    alert(res.message)
    await loadStats()
    await loadHistory()
  } catch (err: any) {
    alert(err.message || '清理失败')
  } finally {
    cleaning.value = false
  }
}

onMounted(async () => {
  loading.value = true
  await Promise.all([loadStats(), loadHistory()])
  loading.value = false
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">持久化监控</h1>
      <button
        @click="handleClean"
        :disabled="cleaning"
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
      >
        {{ cleaning ? '清理中...' : '一键清理所有日志' }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">加载中...</div>
    <div v-else-if="error" class="text-center py-12 text-red-500">{{ error }}</div>

    <template v-else-if="stats">
      <!-- 数据库概览 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">数据库大小</div>
          <div class="text-2xl font-bold" :class="dbSizeWarning ? 'text-red-600' : 'text-gray-900 dark:text-white'">
            {{ stats.database.sizeHuman }}
          </div>
          <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all"
              :class="dbSizeWarning ? 'bg-red-500' : 'bg-indigo-500'"
              :style="{ width: dbSizePercent + '%' }"
            />
          </div>
          <div class="text-xs text-gray-400 mt-1">阈值 100 MB</div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">总页数</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatNumber(stats.database.totalPages) }}</div>
          <div class="text-xs text-gray-400 mt-2">空闲页：{{ formatNumber(stats.database.freePages) }}（{{ dbFreePercent }}%）</div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">总占用</div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totalSizeHuman }}</div>
          <div class="text-xs text-gray-400 mt-2">
            头像 {{ stats.files.uploads.avatar.sizeHuman }} · 反馈 {{ stats.files.uploads.feedback.sizeHuman }}
          </div>
        </div>
      </div>

      <!-- 保留策略 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">保留策略</h2>
        <div class="flex gap-6 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">日志保留：</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ stats.retention.logRetentionDays }} 天</span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">审计日志保留：</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ stats.retention.auditLogRetentionDays }} 天</span>
          </div>
        </div>
      </div>

      <!-- 日志表行数 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">日志表</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">表名</th>
                <th class="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">行数</th>
                <th class="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">保留天数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in logTables" :key="t.name" class="border-b border-gray-100 dark:border-gray-700/50">
                <td class="py-2 font-mono text-gray-900 dark:text-gray-100">{{ t.name }}</td>
                <td class="py-2 text-right font-medium" :class="t.rows > 100000 ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'">
                  {{ formatNumber(t.rows) }}
                </td>
                <td class="py-2 text-right text-gray-600 dark:text-gray-400">{{ t.retentionDays || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 其他表行数 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">其他表</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">表名</th>
                <th class="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">行数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in nonLogTables" :key="t.name" class="border-b border-gray-100 dark:border-gray-700/50">
                <td class="py-2 font-mono text-gray-900 dark:text-gray-100">{{ t.name }}</td>
                <td class="py-2 text-right font-medium text-gray-900 dark:text-gray-100">{{ formatNumber(t.rows) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 增长趋势 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">增长趋势</h2>
          <div class="flex gap-2">
            <button
              v-for="d in [7, 30, 90]" :key="d"
              @click="historyDays = d; loadHistory()"
              class="px-3 py-1 text-xs rounded-lg transition-colors"
              :class="historyDays === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'"
            >
              {{ d }}天
            </button>
          </div>
        </div>

        <div v-if="history.length === 0" class="text-center py-8 text-gray-400 text-sm">暂无历史数据（每小时快照一次）</div>

        <div v-else class="space-y-4">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            最新快照：{{ new Date(history[0].snapshotAt).toLocaleString() }}，
            数据库 {{ formatBytes(history[0].dbSizeBytes) }}
          </div>

          <!-- 折线图 -->
          <div class="h-72">
            <Line :data="chartData" :options="chartOptions" />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="text-left py-1 text-gray-500 dark:text-gray-400 font-medium">时间</th>
                  <th class="text-right py-1 text-gray-500 dark:text-gray-400 font-medium">DB 大小</th>
                  <th v-for="t in LOG_TABLES" :key="t" class="text-right py-1 text-gray-500 dark:text-gray-400 font-medium">{{ t.replace('_logs', '').replace('_', ' ') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in history.slice(0, 20)" :key="s.snapshotAt" class="border-b border-gray-100 dark:border-gray-700/50">
                  <td class="py-1 text-gray-600 dark:text-gray-400">{{ new Date(s.snapshotAt).toLocaleString() }}</td>
                  <td class="py-1 text-right font-medium text-gray-900 dark:text-gray-100">{{ formatBytes(s.dbSizeBytes) }}</td>
                  <td v-for="t in LOG_TABLES" :key="t" class="py-1 text-right text-gray-600 dark:text-gray-400">
                    {{ formatNumber(s.tableRows[t] || 0) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
