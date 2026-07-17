<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { MenuItem } from '@/types'
import { fetchAllMenus, createMenu, updateMenu, deleteMenu } from '@/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const menus = ref<MenuItem[]>([])
const loading = ref(true)

async function loadMenus() {
  loading.value = true
  try {
    const res = await fetchAllMenus()
    menus.value = res.menus
  } catch (err: any) {
    showToast(err.message || '加载菜单失败', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(loadMenus)

const menuTree = computed(() => {
  const groups = menus.value.filter(m => !m.parentId)
  return groups.map(g => ({
    ...g,
    children: menus.value.filter(m => m.parentId === g.id).sort((a, b) => a.sortOrder - b.sortOrder)
  })).sort((a, b) => a.sortOrder - b.sortOrder)
})

function getParentOptions(currentId?: string) {
  return menus.value.filter(m => !m.parentId && m.id !== currentId)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function visibleLabel(visible: boolean): string {
  return visible ? '启用' : '禁用'
}

function roleLabel(role: string | null): string {
  if (!role) return '所有角色'
  return role === 'admin' ? '超级管理员' : '只读'
}

// --- 新建弹窗 ---
const showCreate = ref(false)
const createForm = ref({
  parentId: null as string | null,
  routeName: '',
  label: '',
  icon: '',
  sortOrder: 0,
  isVisible: true,
  requireRole: null as string | null,
})
const createSubmitting = ref(false)
const createError = ref('')

function openCreate() {
  createForm.value = {
    parentId: null,
    routeName: '',
    label: '',
    icon: '',
    sortOrder: 0,
    isVisible: true,
    requireRole: null,
  }
  createError.value = ''
  showCreate.value = true
}

async function handleCreate() {
  createSubmitting.value = true
  createError.value = ''
  try {
    await createMenu({
      ...createForm.value,
      icon: createForm.value.icon || undefined,
      requireRole: createForm.value.requireRole || undefined,
    })
    showCreate.value = false
    await loadMenus()
    showToast('创建成功', 'success')
  } catch (err: any) {
    createError.value = err.message || '创建失败'
  } finally {
    createSubmitting.value = false
  }
}

// --- 编辑弹窗 ---
const showEdit = ref(false)
const editTarget = ref<MenuItem | null>(null)
const editForm = ref({
  parentId: null as string | null,
  routeName: '',
  label: '',
  icon: '',
  sortOrder: 0,
  isVisible: true,
  requireRole: null as string | null,
})
const editSubmitting = ref(false)
const editError = ref('')

function openEdit(menu: MenuItem) {
  editTarget.value = menu
  editForm.value = {
    parentId: menu.parentId,
    routeName: menu.routeName,
    label: menu.label,
    icon: menu.icon || '',
    sortOrder: menu.sortOrder,
    isVisible: menu.isVisible,
    requireRole: menu.requireRole,
  }
  editError.value = ''
  showEdit.value = true
}

async function handleEdit() {
  if (!editTarget.value) return
  editSubmitting.value = true
  editError.value = ''
  try {
    await updateMenu(editTarget.value.id, {
      ...editForm.value,
      icon: editForm.value.icon || undefined,
      requireRole: editForm.value.requireRole || undefined,
    })
    showEdit.value = false
    await loadMenus()
    showToast('保存成功', 'success')
  } catch (err: any) {
    editError.value = err.message || '保存失败'
  } finally {
    editSubmitting.value = false
  }
}

// --- 删除确认 ---
const showDeleteConfirm = ref(false)
const deleteTarget = ref<MenuItem | null>(null)
const deleteSubmitting = ref(false)
const deleteError = ref('')

function openDelete(menu: MenuItem) {
  deleteTarget.value = menu
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleteSubmitting.value = true
  deleteError.value = ''
  try {
    await deleteMenu(deleteTarget.value.id)
    showDeleteConfirm.value = false
    await loadMenus()
    showToast('删除成功', 'success')
  } catch (err: any) {
    deleteError.value = err.message || '删除失败'
  } finally {
    deleteSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 操作栏 -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 flex-1">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">菜单管理</h2>
        <span v-if="menus.length" class="text-xs text-gray-400 dark:text-gray-500">
          共 {{ menus.length }} 个菜单项
        </span>
      </div>
      <button
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        @click="openCreate"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        新建菜单
      </button>
    </div>

    <!-- 表格 -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">菜单名称</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">路由名称</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">排序</th>
              <th class="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">状态</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">角色限制</th>
              <th class="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">操作</th>
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
            <tr v-else-if="menus.length === 0">
              <td colspan="6" class="px-4 py-16 text-center text-gray-400">
                <div class="flex flex-col items-center gap-2">
                  <svg class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span>暂无菜单数据</span>
                </div>
              </td>
            </tr>
            <!-- 分组行 -->
            <template v-for="group in menuTree" :key="group.id">
              <tr class="border-b border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-800/20">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span class="font-semibold text-gray-900 dark:text-gray-100">{{ group.label }}</span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">({{ group.children.length }} 个子菜单)</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">-</td>
                <td class="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">{{ group.sortOrder }}</td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="group.isVisible
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="group.isVisible ? 'bg-green-500' : 'bg-red-500'" />
                    {{ visibleLabel(group.isVisible) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ roleLabel(group.requireRole) }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      @click="openEdit(group)"
                    >
                      编辑
                    </button>
                    <button
                      class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      @click="openDelete(group)"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
              <!-- 子菜单行 -->
              <tr
                v-for="item in group.children"
                :key="item.id"
                class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td class="px-4 py-3 pl-10">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span class="text-gray-700 dark:text-gray-300">{{ item.label }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs font-mono">{{ item.routeName }}</td>
                <td class="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-xs">{{ item.sortOrder }}</td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="item.isVisible
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="item.isVisible ? 'bg-green-500' : 'bg-red-500'" />
                    {{ visibleLabel(item.isVisible) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ roleLabel(item.requireRole) }}</td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      @click="openEdit(item)"
                    >
                      编辑
                    </button>
                    <button
                      class="px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      @click="openDelete(item)"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ===== 新建菜单弹窗 ===== -->
    <Teleport to="body">
      <div
        v-if="showCreate"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="showCreate = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">新建菜单</h3>
            <button
              class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @click="showCreate = false"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div
              v-if="createError"
              class="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400"
            >
              {{ createError }}
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">父级菜单</label>
              <select
                v-model="createForm.parentId"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              >
                <option :value="null">无（顶级菜单/分组）</option>
                <option v-for="g in menuTree" :key="g.id" :value="g.id">{{ g.label }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">菜单名称 <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.label"
                type="text"
                placeholder="例如：仪表盘"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">路由名称 <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.routeName"
                type="text"
                placeholder="例如：dashboard"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">图标 (SVG path)</label>
              <input
                v-model="createForm.icon"
                type="text"
                placeholder="M4 6h16M4 12h16M4 18h16"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow font-mono"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">排序</label>
                <input
                  v-model.number="createForm.sortOrder"
                  type="number"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">角色限制</label>
                <select
                  v-model="createForm.requireRole"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                >
                  <option :value="null">所有角色</option>
                  <option value="admin">仅超级管理员</option>
                  <option value="readonly">仅只读</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">显示状态</label>
              <button
                type="button"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="createForm.isVisible ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'"
                @click="createForm.isVisible = !createForm.isVisible"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="createForm.isVisible ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
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
              :disabled="createSubmitting || !createForm.label || !createForm.routeName"
              class="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleCreate"
            >
              {{ createSubmitting ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== 编辑菜单弹窗 ===== -->
    <Teleport to="body">
      <div
        v-if="showEdit && editTarget"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="showEdit = false"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">编辑菜单 — {{ editTarget.label }}</h3>
            <button
              class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              @click="showEdit = false"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-5 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div
              v-if="editError"
              class="px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400"
            >
              {{ editError }}
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">父级菜单</label>
              <select
                v-model="editForm.parentId"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              >
                <option :value="null">无（顶级菜单/分组）</option>
                <option v-for="g in getParentOptions(editTarget.id)" :key="g.id" :value="g.id">{{ g.label }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">菜单名称</label>
              <input
                v-model="editForm.label"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">路由名称</label>
              <input
                v-model="editForm.routeName"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">图标 (SVG path)</label>
              <input
                v-model="editForm.icon"
                type="text"
                class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow font-mono"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">排序</label>
                <input
                  v-model.number="editForm.sortOrder"
                  type="number"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">角色限制</label>
                <select
                  v-model="editForm.requireRole"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                >
                  <option :value="null">所有角色</option>
                  <option value="admin">仅超级管理员</option>
                  <option value="readonly">仅只读</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-xs font-medium text-gray-700 dark:text-gray-300">显示状态</label>
              <button
                type="button"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="editForm.isVisible ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'"
                @click="editForm.isVisible = !editForm.isVisible"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="editForm.isVisible ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
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
              :disabled="editSubmitting || !editForm.label || !editForm.routeName"
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
              确定要删除菜单 <span class="font-medium text-gray-900 dark:text-gray-100">{{ deleteTarget.label }}</span> 吗？
            </p>
            <p v-if="!deleteTarget.parentId" class="text-xs text-amber-600 dark:text-amber-400">
              此菜单为分组，删除后其下所有子菜单也将被删除。
            </p>

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
  </div>
</template>
