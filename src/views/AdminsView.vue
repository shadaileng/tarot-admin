<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import type { AdminEntry, AdminListResponse } from '@/types'
import { fetchAdmins, createAdmin, updateAdmin, deleteAdmin, resetAdminPassword } from '@/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const { admin: currentAdmin } = useAuth()

// --- 列表数据 ---
const search = ref('')
const page = ref(1)
const pageSize = ref(20)
const data = ref<AdminListResponse | null>(null)
const loading = ref(true)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function doLoad() {
  loading.value = true
  fetchAdmins({ page: page.value, pageSize: pageSize.value, search: search.value || undefined })
    .then((res) => {
      if (res.success) {
        data.value = res.data
      } else {
        showToast((res as any).error || '加载失败', 'error')
      }
    })
    .catch((err: Error) => {
      showToast(err.message || '加载管理员列表失败', 'error')
    })
    .finally(() => {
      loading.value = false
    })
}

function triggerSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    doLoad()
  }, 300)
}

watch(search, triggerSearch)
watch(page, doLoad, { immediate: true })

const totalPages = computed(() => {
  if (!data.value) return 0
  return Math.ceil(data.value.total / data.value.pageSize)
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

function roleLabel(role: string): string {
  return role === 'admin' ? '超级管理员' : '只读'
}

function roleBadgeClass(role: string): string {
  return role === 'admin'
    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
}

// --- 新建弹窗 ---
const showCreate = ref(false)
const createForm = ref({ username: '', displayName: '', password: '', role: 'admin' })
const createSubmitting = ref(false)
const createError = ref('')

async function handleCreate() {
  createSubmitting.value = true
  createError.value = ''
  try {
    const res = await createAdmin({ ...createForm.value })
    if (res.success) {
      showCreate.value = false
      resetCreateForm()
      doLoad()
    } else {
      createError.value = (res as any).error || '创建失败'
    }
  } catch (err: any) {
    createError.value = err.message || '创建管理员失败'
  } finally {
    createSubmitting.value = false
  }
}

function resetCreateForm() {
  createForm.value = { username: '', displayName: '', password: '', role: 'admin' }
  createError.value = ''
}

function openCreate() {
  resetCreateForm()
  showCreate.value = true
}

// --- 编辑弹窗 ---
const showEdit = ref(false)
const editTarget = ref<AdminEntry | null>(null)
const editForm = ref({ displayName: '', role: 'admin', isActive: true })
const editSubmitting = ref(false)
const editError = ref('')

function openEdit(admin: AdminEntry) {
  editTarget.value = admin
  editForm.value = { displayName: admin.displayName, role: admin.role, isActive: admin.isActive }
  editError.value = ''
  showEdit.value = true
}

async function handleEdit() {
  if (!editTarget.value) return
  editSubmitting.value = true
  editError.value = ''
  const payload: Record<string, any> = {}
  if (editForm.value.displayName !== editTarget.value.displayName) payload.displayName = editForm.value.displayName
  if (editForm.value.role !== editTarget.value.role) payload.role = editForm.value.role
  if (editForm.value.isActive !== editTarget.value.isActive) payload.isActive = editForm.value.isActive

  try {
    const res = await updateAdmin(editTarget.value.id, payload)
    if (res.success) {
      showEdit.value = false
      editTarget.value = null
      doLoad()
    } else {
      editError.value = (res as any).error || '更新失败'
    }
  } catch (err: any) {
    editError.value = err.message || '更新管理员失败'
  } finally {
    editSubmitting.value = false
  }
}

// --- 删除确认 ---
const showDeleteConfirm = ref(false)
const deleteTarget = ref<AdminEntry | null>(null)
const deleteSubmitting = ref(false)
const deleteError = ref('')

function openDelete(admin: AdminEntry) {
  deleteTarget.value = admin
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleteSubmitting.value = true
  deleteError.value = ''
  try {
    const res = await deleteAdmin(deleteTarget.value.id)
    if (res.success) {
      showDeleteConfirm.value = false
      deleteTarget.value = null
      doLoad()
    } else {
      deleteError.value = (res as any).error || '删除失败'
    }
  } catch (err: any) {
    deleteError.value = err.message || '删除管理员失败'
  } finally {
    deleteSubmitting.value = false
  }
}

// --- 重置密码 ---
const showResetPassword = ref(false)
const resetTarget = ref<AdminEntry | null>(null)
const resetPassword = ref('')
const resetSubmitting = ref(false)
const resetError = ref('')

function openReset(admin: AdminEntry) {
  resetTarget.value = admin
  resetPassword.value = ''
  resetError.value = ''
  showResetPassword.value = true
}

async function handleReset() {
  if (!resetTarget.value) return
  resetSubmitting.value = true
  resetError.value = ''
  try {
    const res = await resetAdminPassword(resetTarget.value.id, { password: resetPassword.value })
    if (res.success) {
      showResetPassword.value = false
      resetTarget.value = null
    } else {
      resetError.value = (res as any).error || '重置失败'
    }
  } catch (err: any) {
    resetError.value = err.message || '重置密码失败'
  } finally {
    resetSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 操作栏 -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 flex-1">
        <div class="relative flex-1 max-w-md">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="搜索用户名或显示名..."
            class="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
          />
        </div>
        <span v-if="data" class="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          共 {{ data.total }} 位管理员
        </span>
      </div>
      <button
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        @click="openCreate"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        新建管理员
      </button>
    </div>

    <!-- 表格 -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">用户名</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">显示名</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">角色</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">状态</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">最后登录</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">创建时间</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody>
            <!-- 加载中 -->
            <tr v-if="loading">
              <td colspan="7" class="px-4 py-16 text-center text-gray-400">
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
            <tr v-else-if="!data || data.list.length === 0">
              <td colspan="7" class="px-4 py-16 text-center text-gray-400">
                <div class="flex flex-col items-center gap-2">
                  <svg class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>{{ search ? '未找到匹配的管理员' : '暂无管理员数据' }}</span>
                </div>
              </td>
            </tr>
            <!-- 数据行 -->
            <tr
              v-for="admin in data?.list ?? []"
              :key="admin.id"
              class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="font-medium text-gray-900 dark:text-gray-100">{{ admin.username }}</span>
              </td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ admin.displayName }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="roleBadgeClass(admin.role)">
                  {{ roleLabel(admin.role) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                  :class="admin.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="admin.isActive ? 'bg-green-500' : 'bg-red-500'" />
                  {{ admin.isActive ? '启用' : '禁用' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ formatDate(admin.lastLoginAt) }}</td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ formatDate(admin.createdAt) }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    @click="openEdit(admin)"
                  >
                    编辑
                  </button>
                  <button
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                    @click="openReset(admin)"
                  >
                    重置密码
                  </button>
                  <button
                    v-if="admin.id !== currentAdmin?.id"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    @click="openDelete(admin)"
                  >
                    删除
                  </button>
                </div>
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

    <!-- ===== 新建管理员弹窗 ===== -->
    <Teleport to="body">
      <div
        v-if="showCreate"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="showCreate = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">新建管理员</h3>
            <button
              class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @click="showCreate = false"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-5 py-5 space-y-4">
            <!-- 错误提示 -->
            <div
              v-if="createError"
              class="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400"
            >
              {{ createError }}
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">用户名 <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.username"
                type="text"
                placeholder="英文或数字，用于登录"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">显示名 <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.displayName"
                type="text"
                placeholder="例如：张三"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">密码 <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.password"
                type="password"
                placeholder="至少 8 位，包含字母和数字"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">角色</label>
              <select
                v-model="createForm.role"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              >
                <option value="admin">超级管理员</option>
                <option value="readonly">只读</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="showCreate = false"
            >
              取消
            </button>
            <button
              :disabled="createSubmitting || !createForm.username || !createForm.displayName || !createForm.password"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleCreate"
            >
              {{ createSubmitting ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== 编辑管理员弹窗 ===== -->
    <Teleport to="body">
      <div
        v-if="showEdit && editTarget"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="showEdit = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">编辑管理员 — {{ editTarget.username }}</h3>
            <button
              class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @click="showEdit = false"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-5 py-5 space-y-4">
            <div
              v-if="editError"
              class="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400"
            >
              {{ editError }}
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">显示名</label>
              <input
                v-model="editForm.displayName"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">角色</label>
              <select
                v-model="editForm.role"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              >
                <option value="admin">超级管理员</option>
                <option value="readonly">只读</option>
              </select>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">启用状态</label>
              <button
                type="button"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="editForm.isActive ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'"
                :disabled="editTarget.id === currentAdmin?.id"
                @click="editForm.isActive = !editForm.isActive"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="editForm.isActive ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <div v-if="editTarget.id === currentAdmin?.id" class="text-xs text-amber-600 dark:text-amber-400">
              你不能禁用自己
            </div>
          </div>

          <div class="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="showEdit = false"
            >
              取消
            </button>
            <button
              :disabled="editSubmitting"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleEdit"
            >
              {{ editSubmitting ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== 删除确认弹窗 ===== -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm && deleteTarget"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="showDeleteConfirm = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-800">
          <div class="px-5 py-5 text-center">
            <div class="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">确认删除</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              确定要删除管理员 <span class="font-medium text-gray-900 dark:text-gray-100">{{ deleteTarget.username }}</span> 吗？
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500">此操作将禁用该管理员账号，不可恢复。</p>

            <div
              v-if="deleteError"
              class="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400"
            >
              {{ deleteError }}
            </div>
          </div>

          <div class="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="showDeleteConfirm = false"
            >
              取消
            </button>
            <button
              :disabled="deleteSubmitting"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleDelete"
            >
              {{ deleteSubmitting ? '删除中...' : '确认删除' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== 重置密码弹窗 ===== -->
    <Teleport to="body">
      <div
        v-if="showResetPassword && resetTarget"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="showResetPassword = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">重置密码 — {{ resetTarget.username }}</h3>
            <button
              class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @click="showResetPassword = false"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-5 py-5 space-y-4">
            <div
              v-if="resetError"
              class="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400"
            >
              {{ resetError }}
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">新密码 <span class="text-red-500">*</span></label>
              <input
                v-model="resetPassword"
                type="password"
                placeholder="至少 8 位，包含字母和数字"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div class="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p class="text-xs text-amber-700 dark:text-amber-400">
                重置后该管理员下次登录时需要修改密码。
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="showResetPassword = false"
            >
              取消
            </button>
            <button
              :disabled="resetSubmitting || !resetPassword"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleReset"
            >
              {{ resetSubmitting ? '重置中...' : '确认重置' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
