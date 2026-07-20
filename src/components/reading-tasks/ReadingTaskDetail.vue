<script setup lang="ts">
import { ref } from 'vue'
import type { ReadingTaskEntry } from '@/types'
import { adminCancelReadingTask } from '@/api'
import { resolveImageUrl } from '@/utils/url'

const props = defineProps<{
  task: ReadingTaskEntry | null
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'cancelled'): void
}>()

const cancelling = ref(false)
const readingExpanded = ref(false)

async function handleCancel() {
  if (!props.task) return
  if (!confirm(`确定要强制取消该任务吗？\n\n将退还用户 1 次解读额度。`)) return

  cancelling.value = true
  try {
    await adminCancelReadingTask(props.task.id)
    emit('cancelled')
  } catch (err: any) {
    alert(err.message || '取消失败')
  } finally {
    cancelling.value = false
  }
}

const statusLabel: Record<string, string> = {
  pending: '等待中',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
}

const statusStyle: Record<string, string> = {
  pending: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '-'
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function parseCards(cardsJson: string | null): { name: string; orientation: string }[] {
  if (!cardsJson) return []
  try {
    const arr = JSON.parse(cardsJson)
    if (!Array.isArray(arr)) return []
    return arr.map((c: any) => ({
      name: c.name ?? c.cardName ?? `#${c.id ?? '?'}`,
      orientation: c.orientation === 'upright' ? '正位' : c.orientation === 'reversed' ? '逆位' : c.orientation ?? '?',
    }))
  } catch {
    return []
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="emit('close')">
        <div class="absolute inset-0 bg-black/50 dark:bg-black/70"></div>
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">任务详情</h3>
            <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6" v-if="task">
            <!-- 基本信息 -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">任务 ID</label>
                <p class="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">{{ task.id }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">状态</label>
                <p class="text-sm">
                  <span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full" :class="statusStyle[task.status] || statusStyle.pending">
                    {{ statusLabel[task.status] || task.status }}
                  </span>
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">创建时间</label>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ new Date(task.created_at).toLocaleString() }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">更新时间</label>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ task.updated_at ? new Date(task.updated_at).toLocaleString() : '-' }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">耗时</label>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ formatDuration(task.duration_ms) }}</p>
              </div>
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400">模型</label>
                <p class="text-sm text-gray-900 dark:text-gray-100">{{ task.model ?? '-' }}</p>
              </div>
              <div v-if="task.incomplete">
                <label class="text-sm text-gray-500 dark:text-gray-400">完整性</label>
                <p class="text-sm">
                  <span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">不完整</span>
                </p>
              </div>
            </div>

            <!-- 用户信息 -->
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400 block mb-2">用户</label>
              <div class="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div v-if="task.user_avatar" class="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                  <img :src="resolveImageUrl(task.user_avatar)" alt="" class="w-full h-full object-cover" />
                </div>
                <div>
                  <p class="text-sm text-gray-900 dark:text-gray-100 font-medium">{{ task.user_nickname ?? '匿名用户' }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ task.user_email ?? '无邮箱' }}</p>
                </div>
              </div>
            </div>

            <!-- 问题 -->
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">问题</label>
              <p class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-1">{{ task.question ?? '-' }}</p>
            </div>

            <!-- 卡牌 -->
            <div v-if="task.cards_json">
              <label class="text-sm text-gray-500 dark:text-gray-400">卡牌</label>
              <div class="mt-1 flex flex-wrap gap-2">
                <span
                  v-for="(card, idx) in parseCards(task.cards_json)"
                  :key="idx"
                  class="inline-block px-2.5 py-1 text-xs rounded-lg border"
                  :class="card.orientation === '逆位' ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'"
                >
                  {{ card.name }} <span class="opacity-60">{{ card.orientation }}</span>
                </span>
              </div>
            </div>

            <!-- 警告 -->
            <div v-if="task.warning" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <label class="text-sm font-medium text-yellow-700 dark:text-yellow-300">⚠ 警告</label>
              <p class="text-sm text-yellow-600 dark:text-yellow-400 mt-1">{{ task.warning }}</p>
            </div>

            <!-- 解读内容 -->
            <div v-if="task.reading">
              <label class="text-sm text-gray-500 dark:text-gray-400">
                解读内容
                <span class="text-xs text-gray-400 ml-1">({{ task.reading.length }} 字)</span>
              </label>
              <div class="mt-1 relative">
                <div
                  class="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 whitespace-pre-wrap"
                  :class="{ 'max-h-60 overflow-y-auto': !readingExpanded && task.reading.length > 500 }"
                >{{ task.reading }}</div>
                <button
                  v-if="task.reading.length > 500"
                  @click="readingExpanded = !readingExpanded"
                  class="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >{{ readingExpanded ? '收起' : '展开全部' }}</button>
              </div>
            </div>

            <!-- 错误信息 -->
            <div v-if="task.error_msg && task.status !== 'cancelled'" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <label class="text-sm font-medium text-red-700 dark:text-red-300">❌ 错误信息</label>
              <p class="text-sm text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap">{{ task.error_msg }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              v-if="task?.status === 'pending'"
              @click="handleCancel"
              :disabled="cancelling"
              class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
            >{{ cancelling ? '取消中...' : '强制取消任务' }}</button>
            <div v-else></div>
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
