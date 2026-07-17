<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ReadingLogEntry } from '@/types'
import { fetchReadingLogs } from '@/api'
import ReadingLogTable from '@/components/reading-logs/ReadingLogTable.vue'
import ReadingLogDetail from '@/components/reading-logs/ReadingLogDetail.vue'

const logs = ref<ReadingLogEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const page = ref(1)
const total = ref(0)
const limit = 50

const selectedLog = ref<ReadingLogEntry | null>(null)
const showDetail = ref(false)

async function loadLogs() {
  loading.value = true
  error.value = null
  try {
    const res = await fetchReadingLogs({ page: page.value, limit })
    logs.value = res.data
    total.value = res.total
  } catch (err: any) {
    error.value = err.message || '加载解读日志失败'
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
      <div v-if="error" class="text-center py-12">
        <svg class="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-red-500 dark:text-red-400 mb-3">{{ error }}</p>
        <button @click="loadLogs" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">点击重试</button>
      </div>
      <ReadingLogTable v-else :logs="logs" :loading="loading" @select="selectLog" />
    </div>

    <!-- 详情弹窗 -->
    <ReadingLogDetail :log="selectedLog" :show="showDetail" @close="closeDetail" />

    <!-- 跳转链接 -->
    <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-800">
      <router-link
        to="/reading-tasks"
        class="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
      >
        查看异步任务 →
      </router-link>
    </div>
  </div>
</template>
