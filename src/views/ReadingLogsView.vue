<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ReadingLogEntry } from '@/types'
import { fetchReadingLogs } from '@/api'
import ReadingLogTable from '@/components/reading-logs/ReadingLogTable.vue'
import ReadingLogDetail from '@/components/reading-logs/ReadingLogDetail.vue'

const logs = ref<ReadingLogEntry[]>([])
const loading = ref(true)
const page = ref(1)
const total = ref(0)
const limit = 50

const selectedLog = ref<ReadingLogEntry | null>(null)
const showDetail = ref(false)

async function loadLogs() {
  loading.value = true
  try {
    const res = await fetchReadingLogs({ page: page.value, limit })
    logs.value = res.data
    total.value = res.total
  } catch (err) {
    console.error('Failed to load reading logs:', err)
  } finally {
    loading.value = false
  }
}

function selectLog(log: ReadingLogEntry) {
  selectedLog.value = log
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedLog.value = null
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadLogs()
  }
}

function nextPage() {
  if (page.value * limit < total.value) {
    page.value++
    loadLogs()
  }
}

onMounted(loadLogs)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">解读日志</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">查看 AI 解读的详细日志记录</p>
    </div>

    <!-- 分页控制 -->
    <div class="flex items-center justify-between">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        共 {{ total }} 条记录
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="prevPage"
          :disabled="page <= 1"
          class="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >上一页</button>
        <span class="text-sm text-gray-600 dark:text-gray-400">第 {{ page }} 页</span>
        <button
          @click="nextPage"
          :disabled="page * limit >= total"
          class="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >下一页</button>
      </div>
    </div>

    <!-- 日志表格 -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <ReadingLogTable :logs="logs" :loading="loading" @select="selectLog" />
    </div>

    <!-- 详情弹窗 -->
    <ReadingLogDetail :log="selectedLog" :show="showDetail" @close="closeDetail" />
  </div>
</template>
