<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ClientEventEntry } from '@/types'
import { fetchClientEvents } from '@/api'

const data = ref<ClientEventEntry[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const categoryFilter = ref('')
const levelFilter = ref('')
const userIdFilter = ref('')
const eventFilter = ref('')
const startDate = ref('')
const endDate = ref('')
const loading = ref(true)

const showDetail = ref(false)
const detailRow = ref<ClientEventEntry | null>(null)

const CATEGORY_LABELS: Record<string, string> = {
  auth: '🔐 认证',
  reading: '🔮 解读',
  sync: '☁️ 同步',
  poster: '🖼️ 海报',
  page: '📄 页面',
  user_action: '👤 用户行为',
  error: '❌ 异常',
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  reading: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  sync: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  poster: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  page: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  user_action: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const LEVEL_LABELS: Record<string, string> = {
  info: 'ℹ️ Info',
  warn: '⚠️ Warn',
  error: '❌ Error',
}

const LEVEL_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  warn: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const EVENT_LABELS: Record<string, string> = {
  // 认证类
  wechat_login_start: '微信登录开始',
  wechat_login_success: '微信登录成功',
  wechat_login_fail: '微信登录失败',
  email_login_success: '邮箱登录成功',
  email_register_success: '邮箱注册成功',
  auto_login_recovery_success: '自动恢复登录成功',
  auto_login_recovery_fail: '自动恢复登录失败',
  token_expired: 'Token过期',
  logout: '登出',
  profile_update: '更新资料',
  // 解读类
  draw_cards: '抽牌',
  fetch_reading_start: '获取解读开始',
  fetch_reading_success: '获取解读成功',
  fetch_reading_fallback_local: '降级本地解读',
  fetch_reading_error: '获取解读失败',
  upgrade_to_online: '升级在线解读',
  // 同步类
  record_sync_upload: '上传记录',
  record_pull_merge: '拉取合并记录',
  record_delete_sync: '删除云端记录',
  // 海报类
  poster_generate_start: '生成海报开始',
  poster_generate_success: '生成海报成功',
  poster_generate_fail: '生成海报失败',
  poster_share_success: '分享海报',
  poster_share_cancel: '取消分享',
  // 页面生命周期
  app_launch: '应用启动',
  app_show: '应用前台',
  app_hide: '应用后台',
  health_check_result: '健康检查',
  page_config_load: '页面配置加载',
  app_config_load: '应用配置加载',
  // 用户行为
  checkin: '签到',
  task_claim: '领取任务',
  invite_bind: '绑定邀请码',
  feedback_submit: '提交反馈',
  // 异常类
  api_request_fail: '请求失败',
  api_request_timeout: '请求超时',
  storage_read_fail: '读取Storage失败',
  storage_write_fail: '写入Storage失败',
  image_load_fail: '图片加载失败',
  network_unavailable: '网络不可用',
  // 补充事件
  flip_animation_complete: '翻牌动画完成',
  app_update_available: '检测到更新',
  retry_success: '重试成功',
  permission_denied: '权限被拒',
  reading_model_version: '解读模型版本',
}

async function doLoad() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      limit: limit.value,
    }
    if (categoryFilter.value) params.category = categoryFilter.value
    if (levelFilter.value) params.level = levelFilter.value
    if (userIdFilter.value) params.userId = userIdFilter.value
    if (eventFilter.value) params.event = eventFilter.value
    if (startDate.value) params.from = new Date(startDate.value).toISOString()
    if (endDate.value) params.to = new Date(endDate.value + 'T23:59:59').toISOString()

    const res = await fetchClientEvents(params)
    data.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

watch([categoryFilter, levelFilter, userIdFilter, eventFilter, startDate, endDate], () => {
  if (page.value !== 1) {
    page.value = 1
  } else {
    doLoad()
  }
})

watch(page, doLoad, { immediate: true })

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatJson(jsonStr: string | null): string {
  if (!jsonStr) return '-'
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2)
  } catch {
    return jsonStr
  }
}

function openDetail(row: ClientEventEntry) {
  detailRow.value = row
  showDetail.value = true
}

function truncateId(id: string) {
  return id.length > 12 ? id.slice(0, 12) + '...' : id
}

function truncateUserId(userId: string | null) {
  if (!userId) return '匿名'
  return userId.length > 8 ? userId.slice(0, 8) + '...' : userId
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">客户端事件</h2>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ total }} 条</span>
        <select v-model="categoryFilter"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer">
          <option value="">全部分类</option>
          <option v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="levelFilter"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer">
          <option value="">全部级别</option>
          <option v-for="(label, key) in LEVEL_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <input v-model="userIdFilter" type="text" placeholder="用户ID" 
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-32" />
        <select v-model="eventFilter"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer">
          <option value="">全部事件</option>
          <option v-for="(label, key) in EVENT_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <input v-model="startDate" type="date" placeholder="起始日期"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        <input v-model="endDate" type="date" placeholder="结束日期"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
      </div>
    </div>

    <!-- 表格 -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div v-if="loading" class="p-8 text-center text-gray-400 dark:text-gray-500">加载中...</div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">时间</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">用户</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">分类</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">事件</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">级别</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">结果</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">平台</th>
            <th class="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="data.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">暂无数据</td>
          </tr>
          <tr v-for="row in data" :key="row.id"
            class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
            @click="openDetail(row)">
            <td class="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ formatDate(row.created_at) }}</td>
            <td class="px-4 py-3">
              <span class="text-xs font-mono text-gray-500 dark:text-gray-400" :title="row.user_id || '匿名'">
                {{ truncateUserId(row.user_id) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', CATEGORY_COLORS[row.category] || 'bg-gray-100 text-gray-700']">
                {{ CATEGORY_LABELS[row.category] || row.category }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span class="text-gray-900 dark:text-white font-medium">{{ EVENT_LABELS[row.event] || row.event }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', LEVEL_COLORS[row.level] || 'bg-gray-100 text-gray-700']">
                {{ LEVEL_LABELS[row.level] || row.level }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600 dark:text-gray-400">{{ row.result || '-' }}</td>
            <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ row.platform || '-' }}</td>
            <td class="px-4 py-3">
              <button class="text-blue-600 dark:text-blue-400 hover:underline text-xs">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
      <span>第 {{ (page - 1) * limit + 1 }}-{{ Math.min(page * limit, total) }} 条</span>
      <div class="flex items-center gap-2">
        <button :disabled="page <= 1" @click="page--"
          class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800">
          上一页
        </button>
        <span>第 {{ page }} / {{ Math.ceil(total / limit) || 1 }} 页</span>
        <button :disabled="page >= Math.ceil(total / limit)" @click="page++"
          class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800">
          下一页
        </button>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDetail && detailRow" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="showDetail = false">
          <div class="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">事件详情</h3>
                <button @click="showDetail = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
              </div>
              
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">事件ID</label>
                    <p class="text-sm text-gray-900 dark:text-white font-mono break-all">{{ detailRow.id }}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">时间</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ formatDate(detailRow.created_at) }}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">用户ID</label>
                    <p class="text-sm text-gray-900 dark:text-white font-mono">{{ detailRow.user_id || '匿名' }}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">分类</label>
                    <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', CATEGORY_COLORS[detailRow.category] || 'bg-gray-100 text-gray-700']">
                      {{ CATEGORY_LABELS[detailRow.category] || detailRow.category }}
                    </span>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">事件</label>
                    <p class="text-sm text-gray-900 dark:text-white font-medium">{{ EVENT_LABELS[detailRow.event] || detailRow.event }}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">级别</label>
                    <span :class="['px-2 py-0.5 rounded-full text-xs font-medium', LEVEL_COLORS[detailRow.level] || 'bg-gray-100 text-gray-700']">
                      {{ LEVEL_LABELS[detailRow.level] || detailRow.level }}
                    </span>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">结果</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ detailRow.result || '-' }}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">处理方式</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ detailRow.action || '-' }}</p>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">平台</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ detailRow.platform || '-' }}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">设备型号</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ detailRow.device_model || '-' }}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">系统版本</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ detailRow.system_version || '-' }}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">SDK版本</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ detailRow.sdk_version || '-' }}</p>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">应用版本</label>
                    <p class="text-sm text-gray-900 dark:text-white">{{ detailRow.app_version || '-' }}</p>
                  </div>
                </div>

                <div>
                  <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">附加数据 (data)</label>
                  <pre class="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto max-h-48">{{ formatJson(detailRow.data_json) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
