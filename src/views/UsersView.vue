<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { UserEntry, UserListResponse } from '@/types'
import { fetchUsers } from '@/api'

const keyword = ref('')
const page = ref(1)
const limit = ref(20)
const data = ref<UserListResponse | null>(null)
const loading = ref(true)
const selectedUser = ref<UserEntry | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function doLoad() {
  loading.value = true
  fetchUsers({ page: page.value, limit: limit.value, keyword: keyword.value || undefined })
    .then((res) => {
      data.value = res
    })
    .finally(() => {
      loading.value = false
    })
}

function triggerLoad() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    doLoad()
  }, 300)
}

watch(keyword, triggerLoad)
watch(page, doLoad, { immediate: true })

const totalPages = computed(() => {
  if (!data.value) return 0
  return Math.ceil(data.value.total / data.value.limit)
})

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getLoginType(row: UserEntry): string {
  const hasWechat = row.openid && row.openid !== ''
  const hasEmail = row.email && row.email !== ''
  if (hasWechat && hasEmail) return '微信+邮箱'
  if (hasWechat) return '微信'
  if (hasEmail) return '邮箱'
  return '未知'
}

function getLoginTypeIcon(row: UserEntry): string {
  const hasWechat = row.openid && row.openid !== ''
  const hasEmail = row.email && row.email !== ''
  if (hasWechat && hasEmail) return '📱📧'
  if (hasWechat) return '📱'
  if (hasEmail) return '📧'
  return '❓'
}

function selectUser(user: UserEntry) {
  selectedUser.value = user
}
</script>

<template>
  <div class="space-y-4">
    <!-- 搜索栏 -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="keyword"
          type="text"
          placeholder="搜索昵称或邮箱..."
          class="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
        />
      </div>
      <span v-if="data" class="text-xs text-gray-400 dark:text-gray-500 shrink-0">
        共 {{ data.total }} 位用户
      </span>
    </div>

    <!-- 表格 -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">用户</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">邮箱</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">登录方式</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">注册时间</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">最近请求</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">请求次数</th>
            </tr>
          </thead>
          <tbody>
            <!-- 加载中 -->
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-16 text-center text-gray-400">
                <div class="flex items-center justify-center gap-2">
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  加载中...
                </div>
              </td>
            </tr>
            <!-- 空状态 -->
            <tr v-else-if="!data || data.data.length === 0">
              <td colspan="6" class="px-4 py-16 text-center text-gray-400">
                <div class="flex flex-col items-center gap-2">
                  <svg class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{{ keyword ? '未找到匹配的用户' : '暂无用户数据' }}</span>
                </div>
              </td>
            </tr>
            <!-- 数据行 -->
            <tr
              v-for="user in data?.data ?? []"
              :key="user.id"
              class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
              @click="selectUser(user)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <img
                    :src="user.avatar_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22%3E%3Crect fill=%22%23e5e7eb%22 width=%2240%22 height=%2240%22/%3E%3Ctext x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%239ca3af%22 font-size=%2216%22%3E?%3C/text%3E%3C/svg%3E'"
                    class="w-8 h-8 rounded-full object-cover bg-gray-200 dark:bg-gray-700 shrink-0"
                    alt=""
                  />
                  <span class="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[160px]">
                    {{ user.nickname || '匿名用户' }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ user.email || '-' }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                  <span>{{ getLoginTypeIcon(user) }}</span>
                  <span>{{ getLoginType(user) }}</span>
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ formatDate(user.created_at) }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ formatDate(user.last_request_at) }}</td>
              <td class="px-4 py-3 text-right">
                <span
                  class="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300': user.request_count > 0,
                    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400': user.request_count === 0,
                  }"
                >
                  {{ user.request_count }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="data && totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <span class="text-xs text-gray-400 dark:text-gray-500">
          第 {{ data.page }} / {{ totalPages }} 页
        </span>
        <div class="flex gap-1">
          <button
            :disabled="page <= 1"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="page--"
          >
            上一页
          </button>
          <button
            v-for="p in totalPages"
            :key="p"
            :disabled="p === page"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
            :class="p === page
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            @click="page = p"
          >
            {{ p }}
          </button>
          <button
            :disabled="page >= totalPages"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            @click="page++"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div
        v-if="selectedUser"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="selectedUser = null"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-800">
          <!-- 头部 -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">用户详情</h3>
            <button
              class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @click="selectedUser = null"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 内容 -->
          <div class="px-5 py-5">
            <div class="flex flex-col items-center mb-6">
              <img
                :src="selectedUser.avatar_url || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 80 80%22%3E%3Crect fill=%22%23e5e7eb%22 width=%2280%22 height=%2280%22/%3E%3Ctext x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%239ca3af%22 font-size=%2232%22%3E?%3C/text%3E%3C/svg%3E'"
                class="w-20 h-20 rounded-full object-cover bg-gray-200 dark:bg-gray-700 mb-3"
                alt=""
              />
              <h4 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ selectedUser.nickname || '匿名用户' }}</h4>
              <span class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ getLoginType(selectedUser) }}</span>
            </div>

            <dl class="space-y-3">
              <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                <dt class="text-xs text-gray-500 dark:text-gray-400">用户 ID</dt>
                <dd class="text-xs font-mono text-gray-900 dark:text-gray-100 max-w-[200px] truncate">{{ selectedUser.id }}</dd>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                <dt class="text-xs text-gray-500 dark:text-gray-400">昵称</dt>
                <dd class="text-xs text-gray-900 dark:text-gray-100">{{ selectedUser.nickname || '-' }}</dd>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                <dt class="text-xs text-gray-500 dark:text-gray-400">邮箱</dt>
                <dd class="text-xs text-gray-900 dark:text-gray-100">{{ selectedUser.email || '-' }}</dd>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                <dt class="text-xs text-gray-500 dark:text-gray-400">手机号</dt>
                <dd class="text-xs text-gray-900 dark:text-gray-100">{{ selectedUser.phone || '-' }}</dd>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                <dt class="text-xs text-gray-500 dark:text-gray-400">注册时间</dt>
                <dd class="text-xs text-gray-900 dark:text-gray-100">{{ formatDate(selectedUser.created_at) }}</dd>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                <dt class="text-xs text-gray-500 dark:text-gray-400">最近登录</dt>
                <dd class="text-xs text-gray-900 dark:text-gray-100">{{ formatDate(selectedUser.last_login_at) }}</dd>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800/50">
                <dt class="text-xs text-gray-500 dark:text-gray-400">请求次数</dt>
                <dd class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{{ selectedUser.request_count }}</dd>
              </div>
              <div class="flex justify-between py-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">最近请求</dt>
                <dd class="text-xs text-gray-900 dark:text-gray-100">{{ formatDate(selectedUser.last_request_at) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
