<script setup lang="ts">
import type { ReadingLogEntry } from '@/types'

defineProps<{
  logs: ReadingLogEntry[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'select', log: ReadingLogEntry): void
}>()

function truncate(text: string | null, len: number): string {
  if (!text) return '-'
  return text.length > len ? text.slice(0, len) + '...' : text
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">时间</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">问题</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">模型</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">状态</th>
          <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">解读预览</th>
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
          <td class="py-3 px-4 text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
            {{ truncate(log.question, 30) }}
          </td>
          <td class="py-3 px-4 text-gray-500 dark:text-gray-500 text-xs">{{ log.model ?? '-' }}</td>
          <td class="py-3 px-4">
            <span
              class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
              :class="log.incomplete ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'"
            >{{ log.incomplete ? '不完整' : '完整' }}</span>
          </td>
          <td class="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[300px] truncate">{{ truncate(log.reading, 50) }}</td>
          <td class="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[140px] truncate">
            {{ log.user_nickname ?? log.user_email ?? (log.user_id ? '匿名' : '-') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
