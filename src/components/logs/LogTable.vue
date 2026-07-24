<script setup lang="ts">
import type { LogEntry } from '@/types'

defineProps<{
  logs: LogEntry[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'select', log: LogEntry): void
}>()

function statusColor(code: number): string {
  if (code < 300) return 'text-green-600 dark:text-green-400'
  if (code < 400) return 'text-blue-600 dark:text-blue-400'
  if (code < 500) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

function formatMs(ms: number | null): string {
  if (ms === null || ms === undefined) return '-'
  return `${ms}ms`
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">时间</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">方法+路径</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">状态</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">耗时</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">IP</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">用户</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="6" class="py-8 text-center text-gray-400 dark:text-gray-500">加载中...</td>
        </tr>
        <tr v-else-if="logs.length === 0">
          <td colspan="6" class="py-8 text-center text-gray-400 dark:text-gray-500">暂无数据</td>
        </tr>
        <tr
          v-for="log in logs"
          :key="log.id"
          @click="emit('select', log)"
          class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
        >
          <td class="py-3 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {{ new Date(log.created_at).toLocaleString() }}
          </td>
          <td class="py-3 px-4 text-gray-900 dark:text-gray-100 font-mono text-xs">
            <span class="inline-block px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium mr-1">{{ log.method }}</span>
            {{ log.path }}
          </td>
          <td class="py-3 px-4">
            <span class="font-medium" :class="statusColor(log.status_code)">{{ log.status_code }}</span>
          </td>
          <td class="py-3 px-4 text-gray-600 dark:text-gray-400">{{ formatMs(log.duration_ms) }}</td>
          <td class="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{{ log.ip_address ?? '-' }}</td>
          <td class="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[140px] truncate">
            {{ log.user_nickname ?? log.user_email ?? (log.user_id ? '匿名' : '-') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
