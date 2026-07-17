<script setup lang="ts">
import { ref, watch } from 'vue'
import type { LogEntry, LogListResponse } from '@/types'
import { fetchLogs } from '@/api'
import LogFilter from '@/components/logs/LogFilter.vue'
import LogTable from '@/components/logs/LogTable.vue'
import LogDetail from '@/components/logs/LogDetail.vue'

const target = ref('')
const status = ref('')
const page = ref(1)
const limit = ref(20)
const data = ref<LogListResponse | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const selectedLog = ref<LogEntry | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await fetchLogs({
      page: page.value,
      limit: limit.value,
      target: target.value || undefined,
      status: status.value || undefined,
    })
  } catch (err: any) {
    error.value = err.message || '加载日志失败'
  } finally {
    loading.value = false
  }
}

watch([target, status, page], load, { immediate: true })

function selectLog(log: LogEntry) {
  selectedLog.value = log
}
</script>

<template>
  <div class="space-y-4">
    <LogFilter
      :target="target"
      :status="status"
      :page="page"
      :total="data?.total ?? 0"
      :limit="limit"
      @update:target="target = $event"
      @update:status="status = $event"
      @update:page="page = $event"
    />

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div v-if="error" class="text-center py-12">
        <svg class="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-red-500 dark:text-red-400 mb-3">{{ error }}</p>
        <button @click="load" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">点击重试</button>
      </div>
      <LogTable v-else :logs="data?.data ?? []" :loading="loading" @select="selectLog" />
    </div>

    <div v-if="data" class="text-xs text-gray-400 dark:text-gray-500 text-right">
      共 {{ data.total }} 条记录
    </div>

    <LogDetail :log="selectedLog" @close="selectedLog = null" />
  </div>
</template>
