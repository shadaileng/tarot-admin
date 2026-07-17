<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ReadingTaskEntry } from '@/types'
import { fetchReadingTasks } from '@/api'
import ReadingTaskDetail from '@/components/reading-tasks/ReadingTaskDetail.vue'

const tasks = ref<ReadingTaskEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const page = ref(1)
const total = ref(0)
const limit = 50
const stats = ref({ pending: 0, completed: 0, failed: 0, cancelled: 0, total: 0 })

const filterStatus = ref('')
const filterKeyword = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')

const selectedTask = ref<ReadingTaskEntry | null>(null)
const showDetail = ref(false)

async function loadTasks() {
  loading.value = true
  error.value = null
  try {
    const res = await fetchReadingTasks({
      page: page.value,
      limit,
      status: filterStatus.value || undefined,
      keyword: filterKeyword.value || undefined,
      dateFrom: filterDateFrom.value || undefined,
      dateTo: filterDateTo.value || undefined,
    })
    tasks.value = res.data
    total.value = res.total
    stats.value = res.stats
  } catch (err: any) {
    error.value = err.message || '加载解读任务失败'
  } finally {
    loading.value = false
  }
}

function applyFilter() {
  page.value = 1
  loadTasks()
}

function clearFilter() {
  filterStatus.value = ''
  filterKeyword.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  page.value = 1
  loadTasks()
}

function filterByStatus(status: string) {
  filterStatus.value = filterStatus.value === status ? '' : status
  applyFilter()
}

function selectTask(task: ReadingTaskEntry) {
  selectedTask.value = task
  showDetail.value = true
}

function closeDetail() {
  showDetail.value = false
  selectedTask.value = null
}

function onTaskCancelled() {
  closeDetail()
  loadTasks()
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadTasks()
  }
}

function nextPage() {
  if (page.value * limit < total.value) {
    page.value++
    loadTasks()
  }
}

function truncate(text: string | null, len: number): string {
  if (!text) return '-'
  return text.length > len ? text.slice(0, len) + '...' : text
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '-'
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
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

const cardStyle: Record<string, string> = {
  pending: 'border-l-blue-500',
  completed: 'border-l-green-500',
  failed: 'border-l-red-500',
  cancelled: 'border-l-gray-400',
}

onMounted(loadTasks)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">解读任务</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">管理异步 AI 解读任务的运行状态</p>
      </div>
      <button
        @click="loadTasks"
        class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >刷新</button>
    </div>

    <!-- 状态卡片 -->
    <div class="grid grid-cols-4 gap-4">
      <button
        v-for="s in ['pending', 'completed', 'failed', 'cancelled']"
        :key="s"
        @click="filterByStatus(s)"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 p-4 text-left hover:shadow-md transition-shadow"
        :class="[cardStyle[s], filterStatus === s ? 'ring-2 ring-offset-2 ring-blue-300 dark:ring-offset-gray-950' : '']"
      >
        <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ (stats as any)[s] ?? 0 }}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ statusLabel[s] }}</div>
      </button>
    </div>

    <!-- 筛选器 -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="filterStatus"
          @change="applyFilter"
          class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">全部状态</option>
          <option value="pending">等待中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
          <option value="cancelled">已取消</option>
        </select>
        <input
          v-model="filterKeyword"
          @keyup.enter="applyFilter"
          placeholder="搜索问题关键词..."
          class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-56"
        />
        <input
          v-model="filterDateFrom"
          type="date"
          class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <span class="text-sm text-gray-400 dark:text-gray-500">至</span>
        <input
          v-model="filterDateTo"
          type="date"
          class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          @click="applyFilter"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >筛选</button>
        <button
          @click="clearFilter"
          class="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >清除</button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div v-if="error" class="text-center py-12">
        <svg class="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text-red-500 dark:text-red-400 mb-3">{{ error }}</p>
        <button @click="loadTasks" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">点击重试</button>
      </div>
      <template v-else>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Task ID</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">用户</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">问题</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">状态</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">模型</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">耗时</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">时间</th>
                <th class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="8" class="py-8 text-center text-gray-400 dark:text-gray-500">加载中...</td>
              </tr>
              <tr v-else-if="tasks.length === 0">
                <td colspan="8" class="py-8 text-center text-gray-400 dark:text-gray-500">暂无数据</td>
            </tr>
            <tr
              v-for="task in tasks"
              :key="task.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="py-3 px-4 text-gray-500 dark:text-gray-500 font-mono text-xs whitespace-nowrap">
                {{ task.id.slice(0, 8) }}...
              </td>
              <td class="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-[120px] truncate">
                {{ task.user_nickname ?? task.user_email ?? (task.user_id ? '匿名' : '-') }}
              </td>
              <td class="py-3 px-4 text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                {{ truncate(task.question, 25) }}
              </td>
              <td class="py-3 px-4">
                <span class="inline-block px-2 py-0.5 text-xs font-medium rounded-full" :class="statusStyle[task.status] || statusStyle.pending">
                  {{ statusLabel[task.status] || task.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-500 dark:text-gray-500 text-xs">{{ task.model ?? '-' }}</td>
              <td class="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">{{ formatDuration(task.duration_ms) }}</td>
              <td class="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                {{ new Date(task.created_at).toLocaleString() }}
              </td>
              <td class="py-3 px-4">
                <button
                  @click="selectTask(task)"
                  class="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                >查看</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </template>
    </div>

    <!-- 分页 -->
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

    <!-- 详情抽屉 -->
    <ReadingTaskDetail
      :task="selectedTask"
      :show="showDetail"
      @close="closeDetail"
      @cancelled="onTaskCancelled"
    />
  </div>
</template>
