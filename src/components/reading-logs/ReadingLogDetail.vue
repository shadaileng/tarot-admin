<script setup lang="ts">
import type { ReadingLogEntry } from '@/types'

defineProps<{
  log: ReadingLogEntry | null
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="emit('close')">
        <div class="absolute inset-0 bg-black/50 dark:bg-black/70"></div>
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">解读日志详情</h3>
            <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6" v-if="log">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">日志 ID</label>
                <p class="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">{{ log.id }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">时间</label>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ new Date(log.created_at).toLocaleString() }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">模型</label>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ log.model ?? '-' }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">状态</label>
                <p class="text-sm">
                  <span
                    class="inline-block px-2 py-0.5 text-xs font-medium rounded-full"
                    :class="log.incomplete ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'"
                  >{{ log.incomplete ? '不完整' : '完整' }}</span>
                </p>
              </div>
            </div>

            <!-- 用户信息 -->
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">用户</label>
              <p class="text-sm text-gray-900 dark:text-gray-100">
                {{ log.user_nickname ?? log.user_email ?? (log.user_id ? '匿名' : '-') }}
              </p>
            </div>

            <!-- 问题 -->
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">问题</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">{{ log.question ?? '-' }}</p>
            </div>

            <!-- 卡片信息 -->
            <div v-if="log.cards_json">
              <label class="text-sm text-gray-500 dark:text-gray-400">卡片信息</label>
              <pre class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto">{{ log.cards_json }}</pre>
            </div>

            <!-- 解读内容 -->
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">解读内容</label>
              <div class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap max-h-60 overflow-y-auto">{{ log.reading ?? '-' }}</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              @click="emit('close')"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >关闭</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
