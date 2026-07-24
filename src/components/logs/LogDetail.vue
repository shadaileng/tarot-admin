<script setup lang="ts">
import type { LogEntry } from '@/types'

defineProps<{
  log: LogEntry | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function loginTypeLabel(type: string | null): string {
  switch (type) {
    case 'wechat': return '微信'
    case 'email': return '邮箱'
    case 'wechat+email': return '微信 + 邮箱'
    case 'admin': return '管理员'
    case 'anonymous': return '匿名'
    default: return type ?? '-'
  }
}

function formatMs(ms: number | null): string {
  if (ms === null || ms === undefined) return '-'
  return `${ms}ms`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="log" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="emit('close')" />
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100">请求日志详情</h3>
            <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="overflow-auto p-6 space-y-4 text-sm">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-gray-500 dark:text-gray-400">ID</span>
                <p class="font-mono text-xs text-gray-900 dark:text-gray-100 break-all">{{ log.id }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">时间</span>
                <p class="text-gray-900 dark:text-gray-100">{{ new Date(log.created_at).toLocaleString() }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">方法</span>
                <p class="text-gray-900 dark:text-gray-100">{{ log.method }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">路径</span>
                <p class="text-gray-900 dark:text-gray-100 font-mono text-xs">{{ log.path }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">查询参数</span>
                <p class="text-gray-900 dark:text-gray-100 font-mono text-xs break-all">{{ log.query_string ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">状态码</span>
                <p
                  class="font-medium"
                  :class="log.status_code < 400 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >{{ log.status_code }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">总耗时</span>
                <p class="text-gray-900 dark:text-gray-100">{{ formatMs(log.duration_ms) }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">目标</span>
                <p class="text-gray-900 dark:text-gray-100">{{ log.target ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">IP</span>
                <p class="text-gray-900 dark:text-gray-100">{{ log.ip_address ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">User-Agent</span>
                <p class="text-gray-900 dark:text-gray-100 text-xs break-all">{{ log.user_agent ?? '-' }}</p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">用户</span>
                <p class="text-gray-900 dark:text-gray-100">
                  {{ log.user_nickname ?? '匿名用户' }}
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">邮箱</span>
                <p class="text-gray-900 dark:text-gray-100">
                  {{ log.user_email ?? '-' }}
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">登录方式</span>
                <p class="text-gray-900 dark:text-gray-100">
                  {{ loginTypeLabel(log.login_type) }}
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">用户ID</span>
                <p class="font-mono text-xs text-gray-900 dark:text-gray-100 break-all">
                  {{ log.user_id ?? '-' }}
                </p>
              </div>
            </div>

            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <div>
                <span class="text-gray-500 dark:text-gray-400">请求体</span>
                <pre class="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-48">{{ log.request_body ?? '(无)' }}</pre>
                <p v-if="log.request_body_size !== null" class="text-xs text-gray-400 mt-1">
                  {{ log.request_body_size >= 2000 ? `原始大小: ${log.request_body_size} bytes（已截断）` : `大小: ${log.request_body_size} bytes` }}
                </p>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">响应体</span>
                <pre class="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-800 dark:text-gray-200 overflow-auto max-h-48">{{ log.response_body ?? '(无)' }}</pre>
                <p v-if="log.response_body_size !== null" class="text-xs text-gray-400 mt-1">
                  {{ log.response_body_size >= 2000 ? `原始大小: ${log.response_body_size} bytes（已截断）` : `大小: ${log.response_body_size} bytes` }}
                </p>
              </div>
            </div>

            <div v-if="log.error_msg">
              <span class="text-gray-500 dark:text-gray-400">错误信息</span>
              <p class="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-xs">{{ log.error_msg }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
