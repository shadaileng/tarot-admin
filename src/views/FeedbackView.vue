<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { fetchFeedbackList, fetchFeedbackDetail, replyFeedback, updateFeedbackStatus } from '@/api'
import type { FeedbackItem, FeedbackDetail } from '@/types'

const data = ref<FeedbackItem[]>([])
const total = ref(0)
const page = ref(1)
const limit = 20
const keyword = ref('')
const statusFilter = ref('')
const loading = ref(true)
const errorMsg = ref('')

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function triggerSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    doLoad()
  }, 300)
}

watch(keyword, triggerSearch)
watch(statusFilter, () => { page.value = 1; doLoad() })

async function doLoad() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetchFeedbackList({
      page: page.value,
      limit,
      keyword: keyword.value || undefined,
      status: statusFilter.value || undefined,
    })
    data.value = res.data
    total.value = res.total
  } catch (err: any) {
    errorMsg.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const totalPages = computed(() => Math.ceil(total.value / limit))

// 详情弹窗
const showDetail = ref(false)
const detail = ref<FeedbackDetail | null>(null)
const replyText = ref('')
const submitting = ref(false)

async function openDetail(item: FeedbackItem) {
  try {
    detail.value = await fetchFeedbackDetail(item.id)
    replyText.value = ''
    showDetail.value = true
  } catch (err: any) {
    errorMsg.value = err.message || '加载详情失败'
  }
}

function closeDetail() {
  showDetail.value = false
  detail.value = null
  replyText.value = ''
}

async function handleReply() {
  if (!detail.value || !replyText.value.trim()) return
  submitting.value = true
  try {
    await replyFeedback(detail.value.id, replyText.value.trim())
    await doLoad()
    closeDetail()
  } catch (err: any) {
    errorMsg.value = err.message || '回复失败'
  } finally {
    submitting.value = false
  }
}

async function handleClose() {
  if (!detail.value) return
  try {
    await updateFeedbackStatus(detail.value.id, 'closed')
    await doLoad()
    closeDetail()
  } catch (err: any) {
    errorMsg.value = err.message || '操作失败'
  }
}

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = { bug: 'Bug', suggestion: '建议', other: '其他' }
  return map[cat] || cat
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: '待回复', replied: '已回复', closed: '已关闭' }
  return map[status] || status
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待回复' },
  { value: 'replied', label: '已回复' },
  { value: 'closed', label: '已关闭' },
]

// 获取图片完整 URL
function getImageUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL || ''
  return `${base}${path}`
}

function previewImage(url: string) {
  window.open(getImageUrl(url), '_blank')
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <input
          v-model="keyword"
          placeholder="搜索反馈内容..."
          class="px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none w-48"
        />
        <select
          v-model="statusFilter"
          class="px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ total }} 条</span>
      </div>
    </div>

    <div v-if="errorMsg" class="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
      {{ errorMsg }}
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div v-if="loading" class="text-center py-12 text-gray-400">加载中...</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th class="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-medium">用户</th>
              <th class="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-medium">分类</th>
              <th class="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-medium">内容</th>
              <th class="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-medium">状态</th>
              <th class="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-medium">时间</th>
              <th class="px-4 py-3 text-right text-gray-500 dark:text-gray-400 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in data"
              :key="item.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <img
                    v-if="item.userAvatar"
                    :src="item.userAvatar"
                    class="w-7 h-7 rounded-full object-cover"
                  />
                  <div v-else class="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs text-indigo-600 dark:text-indigo-300">
                    {{ item.userNickname?.charAt(0) || '?' }}
                  </div>
                  <span class="text-gray-900 dark:text-gray-100 truncate max-w-[120px]">{{ item.userNickname }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': item.category === 'bug',
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': item.category === 'suggestion',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': item.category === 'other',
                  }"
                >
                  {{ getCategoryLabel(item.category) }}
                </span>
              </td>
              <td class="px-4 py-3 max-w-[250px]">
                <span class="text-gray-700 dark:text-gray-300 truncate block">{{ item.content }}</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-block px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400': item.status === 'pending',
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': item.status === 'replied',
                    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400': item.status === 'closed',
                  }"
                >
                  {{ getStatusLabel(item.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                {{ item.createdAt?.slice(0, 16).replace('T', ' ') }}
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  @click="openDetail(item)"
                  class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs font-medium"
                >
                  {{ item.status === 'pending' ? '回复' : '详情' }}
                </button>
              </td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-400">暂无反馈数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <span class="text-sm text-gray-500 dark:text-gray-400">第 {{ page }} / {{ totalPages }} 页</span>
        <div class="flex gap-2">
          <button
            :disabled="page <= 1"
            @click="page--"
            class="px-3 py-1 text-sm border rounded-md disabled:opacity-40 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            上一页
          </button>
          <button
            :disabled="page >= totalPages"
            @click="page++"
            class="px-3 py-1 text-sm border rounded-md disabled:opacity-40 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div
        v-if="showDetail && detail"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="closeDetail"
      >
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">反馈详情</h3>
              <button @click="closeDetail" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">&times;</button>
            </div>

            <!-- 用户信息 -->
            <div v-if="detail.user" class="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <img v-if="detail.user.avatarUrl" :src="detail.user.avatarUrl" class="w-10 h-10 rounded-full object-cover" />
              <div v-else class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm text-indigo-600 dark:text-indigo-300">
                {{ detail.user.nickname?.charAt(0) || '?' }}
              </div>
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ detail.user.nickname }}</div>
                <div v-if="detail.user.email" class="text-xs text-gray-500 dark:text-gray-400">{{ detail.user.email }}</div>
              </div>
            </div>

            <!-- 分类和状态 -->
            <div class="flex items-center gap-2 mb-4">
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': detail.category === 'bug',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': detail.category === 'suggestion',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': detail.category === 'other',
                }"
              >
                {{ getCategoryLabel(detail.category) }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400': detail.status === 'pending',
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': detail.status === 'replied',
                  'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400': detail.status === 'closed',
                }"
              >
                {{ getStatusLabel(detail.status) }}
              </span>
              <span class="text-xs text-gray-400 ml-auto">{{ detail.createdAt?.slice(0, 16).replace('T', ' ') }}</span>
            </div>

            <!-- 反馈内容 -->
            <div class="mb-4">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">反馈内容</label>
              <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{{ detail.content }}</div>
            </div>

            <!-- 图片 -->
            <div v-if="detail.images?.length" class="mb-4">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">截图</label>
              <div class="flex gap-2 flex-wrap">
                <img
                  v-for="(img, idx) in detail.images"
                  :key="idx"
                  :src="getImageUrl(img)"
                  class="w-20 h-20 rounded-lg object-cover cursor-pointer border border-gray-200 dark:border-gray-700"
                  @click="previewImage(img)"
                />
              </div>
            </div>

            <!-- 已有回复 -->
            <div v-if="detail.adminReply" class="mb-4">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">历史回复</label>
              <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                <p class="whitespace-pre-wrap">{{ detail.adminReply }}</p>
                <p v-if="detail.repliedAt" class="text-xs text-gray-400 mt-1">{{ detail.repliedAt.slice(0, 16).replace('T', ' ') }}</p>
              </div>
            </div>

            <!-- 回复输入 -->
            <div v-if="detail.status !== 'closed'" class="mb-4">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">回复</label>
              <textarea
                v-model="replyText"
                placeholder="输入回复内容..."
                rows="3"
                class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end gap-3 mt-6">
              <button @click="closeDetail" class="px-4 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                取消
              </button>
              <button
                v-if="detail.status === 'pending' || detail.status === 'replied'"
                @click="handleClose"
                class="px-4 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                关闭反馈
              </button>
              <button
                v-if="detail.status !== 'closed'"
                :disabled="submitting || !replyText.trim()"
                @click="handleReply"
                class="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ submitting ? '提交中...' : '提交回复' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
input[type="text"], select, textarea {
  font-family: inherit;
}
</style>
