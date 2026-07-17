<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { AuditLogEntry } from '@/types'
import { fetchAuditLogs, cleanAuditLogs } from '@/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const data = ref<AuditLogEntry[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(20)
const categoryFilter = ref('')
const actionFilter = ref('')
const actorTypeFilter = ref('')
const startDate = ref('')
const endDate = ref('')
const loading = ref(true)
const jumpPage = ref(1)

const showDetail = ref(false)
const detailRow = ref<AuditLogEntry | null>(null)
const showCleanConfirm = ref(false)

const ACTION_LABELS: Record<string, string> = {
  checkin: '签到',
  task_claim: '领取任务奖励',
  quota_consume: '消耗解读额度',
  points_earn: '获得积分',
  level_up: '等级提升',
  user_login: '用户登录',
  user_register: '用户注册',
  bind_email: '绑定邮箱',
  bind_phone: '绑定手机',
  invite_bind: '绑定邀请码',
  admin_login: '管理员登录',
  admin_adjust_points: '调整用户积分',
  admin_reset_quota: '重置用户额度',
  admin_clear_invite: '清除邀请绑定',
  admin_complete_invite: '完成邀请',
  admin_delete_invite: '删除邀请',
  admin_delete_user: '软删除用户',
  admin_restore_user: '恢复用户',
  admin_unbind_email: '解绑用户邮箱',
  admin_update_config: '更新配置',
  admin_update_page_section: '更新页面区块',
  admin_update_level: '更新等级定义',
  admin_update_task: '更新任务定义',
  admin_create_admin: '创建管理员',
  admin_update_admin: '更新管理员',
  admin_delete_admin: '删除管理员',
  admin_reset_password: '重置管理员密码',
  admin_change_password: '修改自身密码',
  admin_clean_audit_logs: '清理审计日志',
  admin_reply_feedback: '回复反馈',
  admin_update_feedback_status: '更新反馈状态',
  admin_cancel_reading: '管理员取消解读',
  user_merge_account: '合并账号',
  user_update_profile: '更新个人资料',
  user_delete_record: '删除记录',
  user_cancel_reading: '用户取消解读',
  user_create_feedback: '提交反馈',
  user_upload_image: '上传图片',
  quota_daily_reset: '每日额度重置',
}

const ACTION_COLORS: Record<string, string> = {
  checkin: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  task_claim: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  quota_consume: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  points_earn: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  level_up: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  user_login: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  user_register: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  bind_email: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  bind_phone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  invite_bind: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin_login: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  admin_adjust_points: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  admin_reset_quota: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  admin_clear_invite: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  admin_complete_invite: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  admin_delete_invite: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  admin_delete_user: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  admin_restore_user: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  admin_unbind_email: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  admin_update_config: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  admin_update_page_section: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  admin_update_level: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  admin_update_task: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  admin_create_admin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  admin_update_admin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  admin_delete_admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  admin_reset_password: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  admin_change_password: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  admin_clean_audit_logs: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  admin_reply_feedback: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  admin_update_feedback_status: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  admin_cancel_reading: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  user_merge_account: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  user_update_profile: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  user_delete_record: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  user_cancel_reading: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  user_create_feedback: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  user_upload_image: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  quota_daily_reset: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const ACTOR_TYPE_LABELS: Record<string, string> = {
  user: '用户',
  admin: '管理员',
  system: '系统',
}

// 分类定义
const ACTION_CATEGORIES: Record<string, string[]> = {
  'admin-management': ['admin_login', 'admin_create_admin', 'admin_update_admin', 'admin_delete_admin', 'admin_reset_password', 'admin_change_password'],
  'user-management': ['admin_delete_user', 'admin_restore_user', 'admin_unbind_email', 'user_merge_account', 'admin_adjust_points', 'admin_reset_quota', 'user_update_profile', 'user_delete_record'],
  'points-tasks': ['checkin', 'task_claim', 'points_earn', 'level_up', 'admin_update_level', 'admin_update_task'],
  reading: ['quota_consume', 'quota_daily_reset', 'user_cancel_reading', 'admin_cancel_reading'],
  feedback: ['user_create_feedback', 'user_upload_image', 'admin_reply_feedback', 'admin_update_feedback_status'],
  'system-config': ['admin_update_config', 'admin_update_page_section', 'admin_clear_invite', 'admin_complete_invite', 'admin_delete_invite'],
  auth: ['user_login', 'user_register', 'bind_email', 'bind_phone', 'invite_bind'],
  maintenance: ['admin_clean_audit_logs'],
}

const CATEGORY_LABELS: Record<string, string> = {
  'admin-management': '🛡️ 管理员管理',
  'user-management': '👥 用户管理',
  'points-tasks': '🎁 积分与任务',
  reading: '🔮 解读任务',
  feedback: '💬 反馈系统',
  'system-config': '⚙️ 系统配置',
  auth: '🔐 账号认证',
  maintenance: '🧹 维护',
}

const CATEGORY_COLORS: Record<string, string> = {
  'admin-management': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'user-management': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'points-tasks': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  reading: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  feedback: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'system-config': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  auth: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  maintenance: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

// 查找 action 所属分类
function getCategoryForAction(action: string): string {
  for (const [cat, actions] of Object.entries(ACTION_CATEGORIES)) {
    if (actions.includes(action)) return cat
  }
  return ''
}

// 根据分类动态过滤操作下拉选项
const filteredActionOptions = computed(() => {
  if (!categoryFilter.value) return ACTION_LABELS
  const actions = ACTION_CATEGORIES[categoryFilter.value] || []
  const result: Record<string, string> = {}
  for (const action of actions) {
    if (ACTION_LABELS[action]) {
      result[action] = ACTION_LABELS[action]
    }
  }
  return result
})

function resolveActions(): string | string[] | undefined {
  // 如果选了具体操作，优先使用（下拉已按分类过滤）
  if (actionFilter.value) return actionFilter.value
  // 如果只选了分类，展开为分类下所有 action
  if (categoryFilter.value) {
    return ACTION_CATEGORIES[categoryFilter.value] || undefined
  }
  return undefined
}

async function doLoad() {
  loading.value = true
  try {
    const res = await fetchAuditLogs({
      page: page.value,
      limit: limit.value,
      action: resolveActions(),
      actorType: actorTypeFilter.value || undefined,
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined,
    })
    data.value = res.data
    total.value = res.total
  } catch (err: any) {
    showToast(err.message || '加载失败', 'error')
  } finally {
    loading.value = false
  }
}

const totalPages = computed(() => Math.ceil(total.value / limit.value))

function handleJump() {
  if (jumpPage.value >= 1 && jumpPage.value <= totalPages.value) {
    page.value = jumpPage.value
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function triggerSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; doLoad() }, 300)
}

watch([categoryFilter, actionFilter, actorTypeFilter, startDate, endDate], async () => {
  // 重置actionFilter（分类变化时）
  if (categoryFilter.value) {
    actionFilter.value = ''
  }
  
  // 等待DOM更新后再加载
  await nextTick()
  
  if (page.value !== 1) {
    page.value = 1
  } else {
    doLoad()
  }
})

// 分类变更时联动重置操作筛选
watch(categoryFilter, () => {
  actionFilter.value = ''
})

watch(page, doLoad, { immediate: true })

// 同步页码输入框
watch(page, (newPage) => { jumpPage.value = newPage })

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

function highlightJson(jsonStr: string | null): string {
  if (!jsonStr) return '-'
  try {
    const formatted = formatJson(jsonStr)
    // 简单的语法高亮：字符串、数字、布尔值、null
    return formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)"(?=\s*:)/g, '<span class="text-purple-600 dark:text-purple-400">"$1"</span>')
      .replace(/:\s*"([^"]*)"/g, ': <span class="text-green-600 dark:text-green-400">"$1"</span>')
      .replace(/:\s*(\d+)/g, ': <span class="text-blue-600 dark:text-blue-400">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="text-yellow-600 dark:text-yellow-400">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="text-gray-500 dark:text-gray-400">$1</span>')
  } catch {
    return jsonStr || '-'
  }
}

function getDetailSummary(row: AuditLogEntry): string {
  try {
    const ov = row.old_value ? JSON.parse(row.old_value) : null
    const nv = row.new_value ? JSON.parse(row.new_value) : null
    switch (row.action) {
      case 'checkin':
        return `+${nv?.points_earned ?? '?'} 积分，连续 ${nv?.consecutive_checkins ?? '?'} 天`
      case 'task_claim':
        return `+${nv?.points ?? 0 - (ov?.points ?? 0)} 积分`
      case 'quota_consume':
        return '额度 -1'
      case 'points_earn':
        return `+${(nv?.points ?? 0) - (ov?.points ?? 0)} 积分`
      case 'admin_adjust_points':
        return `积分 ${ov?.points ?? '?'} → ${nv?.points ?? '?'}`
      case 'admin_reset_quota':
        return `已用额度 ${ov?.daily_quota_used ?? '?'} → 0`
      case 'level_up':
        return `Lv.${ov?.level ?? '?'} → Lv.${nv?.level ?? '?'}`
      case 'admin_change_password':
        return '管理员修改自身密码'
      case 'admin_unbind_email':
        return '解绑用户邮箱'
      case 'admin_reply_feedback':
        return `回复反馈: ${nv?.reply_preview?.substring(0, 20) || '...'}`
      case 'admin_update_feedback_status':
        return `反馈状态: ${ov?.status ?? '?'} → ${nv?.status ?? '?'}`
      case 'user_merge_account':
        return `合并账号 ${ov?.source_id ?? '?'} → ${nv?.target_id ?? '?'}`
      case 'admin_cancel_reading':
        return '管理员取消解读任务'
      case 'user_cancel_reading':
        return '用户取消解读'
      case 'user_create_feedback':
        return `提交反馈: ${nv?.category ?? '?'}`
      case 'user_upload_image':
        return '上传反馈图片'
      case 'admin_complete_invite':
        return '完成邀请绑定'
      case 'admin_delete_invite':
        return '删除邀请绑定'
      case 'admin_update_page_section':
        return '更新页面区块配置'
      case 'user_update_profile':
        return '更新昵称/头像/资料'
      case 'user_delete_record':
        return '删除记录'
      case 'user_register':
        return '新用户注册'
      case 'bind_email':
        return `绑定邮箱: ${nv?.email ? '***' + nv.email.slice(-4) : '?'}`
      case 'bind_phone':
        return `绑定手机: ${nv?.phone ? '***' + nv.phone.slice(-4) : '?'}`
      case 'invite_bind':
        return `绑定邀请码: ${nv?.invite_code ?? '?'}`
      case 'quota_daily_reset':
        return '每日额度自动重置'
      default:
        return '-'
    }
  } catch {
    return '-'
  }
}

function openDetail(row: AuditLogEntry) {
  detailRow.value = row
  showDetail.value = true
}

async function doClean() {
  try {
    const res = await cleanAuditLogs()
    showCleanConfirm.value = false
    showToast(res.message, 'success')
    await doLoad()
  } catch (err: any) {
    showToast(err.message || '清理失败', 'error')
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">操作日志</h2>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ total }} 条</span>
        <select v-model="categoryFilter"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer">
          <option value="">全部分类</option>
          <option v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="actionFilter"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer">
          <option value="">全部操作</option>
          <option v-for="(label, key) in filteredActionOptions" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="actorTypeFilter"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none cursor-pointer">
          <option value="">全部行为者</option>
          <option value="user">用户</option>
          <option value="admin">管理员</option>
          <option value="system">系统</option>
        </select>
        <input v-model="startDate" type="date" placeholder="起始日期"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        <input v-model="endDate" type="date" placeholder="结束日期"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        <button @click="showCleanConfirm = true"
          class="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
          清理日志
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>

    <div v-else class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-44">时间</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-28">分类</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-32">行为者</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-36">操作</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-36">目标</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">变动详情</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-36">IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data" :key="row.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              @click="openDetail(row)">
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ formatDate(row.created_at) }}</td>
              <td class="px-4 py-3">
                <span v-if="getCategoryForAction(row.action)"
                  class="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                  :class="CATEGORY_COLORS[getCategoryForAction(row.action)]">
                  {{ CATEGORY_LABELS[getCategoryForAction(row.action)] }}
                </span>
                <span v-else class="text-gray-400 text-xs">-</span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="row.actor_type === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : row.actor_type === 'system' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'">
                  {{ ACTOR_TYPE_LABELS[row.actor_type] || row.actor_type }}
                </span>
                <span v-if="row.actor_name" class="ml-1 text-gray-700 dark:text-gray-300 text-xs">{{ row.actor_name }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-xs font-medium" :class="ACTION_COLORS[row.action] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'">
                  {{ ACTION_LABELS[row.action] || row.action }}
                </span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                <span v-if="row.target_name">{{ row.target_name }}</span>
                <span v-else-if="row.target_type" class="text-gray-500">{{ row.target_type }}</span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ getDetailSummary(row) }}</td>
              <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{{ row.ip_address || '-' }}</td>
            </tr>
            <tr v-if="data.length === 0">
              <td colspan="7" class="text-center py-8 text-gray-500">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <span class="text-sm text-gray-500">第 {{ page }} / {{ totalPages }} 页</span>
        <div class="flex gap-2">
          <button :disabled="page <= 1" @click="page--"
            class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">上一页</button>
          <input v-model.number="jumpPage" type="number" :min="1" :max="totalPages" 
            class="w-16 px-2 py-1 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            @keyup.enter="handleJump" placeholder="页码" />
          <button @click="handleJump" :disabled="jumpPage < 1 || jumpPage > totalPages"
            class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">跳转</button>
          <button :disabled="page >= totalPages" @click="page++"
            class="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">下一页</button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div v-if="showDetail && detailRow" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showDetail = false">
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">操作详情</h3>

          <div class="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span class="text-gray-500">时间：</span><span class="text-gray-900 dark:text-white">{{ formatDate(detailRow.created_at) }}</span></div>
            <div><span class="text-gray-500">操作：</span><span class="text-gray-900 dark:text-white">{{ ACTION_LABELS[detailRow.action] || detailRow.action }}</span></div>
            <div><span class="text-gray-500">行为者：</span><span class="text-gray-900 dark:text-white">{{ detailRow.actor_name || detailRow.actor_id || '-' }}</span></div>
            <div><span class="text-gray-500">IP：</span><span class="text-gray-900 dark:text-white">{{ detailRow.ip_address || '-' }}</span></div>
          </div>

          <div v-if="detailRow.old_value || detailRow.new_value" class="grid grid-cols-2 gap-4">
            <div>
              <h4 class="text-sm font-medium text-red-600 dark:text-red-400 mb-2">变更前</h4>
              <pre class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-xs overflow-auto max-h-48" v-html="highlightJson(detailRow.old_value)"></pre>
            </div>
            <div>
              <h4 class="text-sm font-medium text-green-600 dark:text-green-400 mb-2">变更后</h4>
              <pre class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-xs overflow-auto max-h-48" v-html="highlightJson(detailRow.new_value)"></pre>
            </div>
          </div>

          <div v-else class="text-sm text-gray-500 mb-4">此操作无变更数据</div>

          <div class="flex justify-end mt-4">
            <button @click="showDetail = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 清理确认弹窗 -->
    <Teleport to="body">
      <div v-if="showCleanConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showCleanConfirm = false">
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">确认清理</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">将根据配置的保留天数清理过期日志。此操作不可撤销。</p>
          <div class="flex justify-end gap-3">
            <button @click="showCleanConfirm = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">取消</button>
            <button @click="doClean"
              class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">确认清理</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
