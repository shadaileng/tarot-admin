<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import type { TaskDefinitionEntry, CreateTaskDefinitionRequest, UpdateTaskDefinitionRequest } from '@/types'
import { fetchTaskDefinitions, createTaskDefinition, updateTaskDefinition } from '@/api'
import { useToast } from '@/composables/useToast'

const { showToast } = useToast()

const { admin } = useAuth()
const tasks = ref<TaskDefinitionEntry[]>([])
const loading = ref(true)

const showCreate = ref(false)
const showEdit = ref(false)
const editTarget = ref<TaskDefinitionEntry | null>(null)
const saving = ref(false)

const emptyForm = () => ({
  id: '',
  title: '',
  description: '',
  type: 'daily',
  requirement_type: 'read_count',
  requirement_count: 1,
  points_reward: 0,
  extra_quota_reward: 0,
  icon: '',
  sort_order: 0,
})

const createForm = ref<CreateTaskDefinitionRequest & { id: string }>(emptyForm())
const editForm = ref<UpdateTaskDefinitionRequest>({})

async function loadTasks() {
  loading.value = true
  try {
    const res = await fetchTaskDefinitions()
    tasks.value = res.tasks
  } catch (err: any) {
    showToast(err.message || '加载任务定义失败', 'error')
  } finally {
    loading.value = false
  }
}

function resetCreateForm() {
  createForm.value = emptyForm()
}

async function doCreate() {
  saving.value = true
  try {
    await createTaskDefinition(createForm.value)
    showToast('创建成功', 'success')
    showCreate.value = false
    await loadTasks()
  } catch (err: any) {
    showToast(err.message || '创建失败', 'error')
  } finally {
    saving.value = false
  }
}

function openEdit(task: TaskDefinitionEntry) {
  editTarget.value = task
  editForm.value = {
    title: task.title,
    description: task.description,
    type: task.type,
    requirement_type: task.requirement_type,
    requirement_count: task.requirement_count,
    points_reward: task.points_reward,
    extra_quota_reward: task.extra_quota_reward,
    icon: task.icon,
    sort_order: task.sort_order,
    is_active: task.is_active,
  }
  showEdit.value = true
}

async function doEdit() {
  if (!editTarget.value) return
  saving.value = true
  try {
    await updateTaskDefinition(editTarget.value.id, editForm.value)
    showToast('保存成功', 'success')
    showEdit.value = false
    await loadTasks()
  } catch (err: any) {
    showToast(err.message || '保存失败', 'error')
  } finally {
    saving.value = false
  }
}

function toggleActive(task: TaskDefinitionEntry) {
  updateTaskDefinition(task.id, { is_active: task.is_active ? 0 : 1 }).then(loadTasks)
}

onMounted(loadTasks)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">任务定义管理</h2>
      <button v-if="admin?.role === 'admin'" @click="showCreate = true; resetCreateForm()"
        class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        + 新建任务
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>

    <div v-else class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">ID</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">标题</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">类型</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">条件</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">积分奖励</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">额度奖励</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">状态</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400">{{ task.id }}</td>
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ task.title }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="task.type === 'daily' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'">
                  {{ task.type === 'daily' ? '每日' : '成就' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ task.requirement_type }} ≥ {{ task.requirement_count }}</td>
              <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">+{{ task.points_reward }}</td>
              <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">+{{ task.extra_quota_reward }}</td>
              <td class="px-4 py-3 text-center">
                <button @click="toggleActive(task)"
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="task.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'">
                  {{ task.is_active ? '启用' : '禁用' }}
                </button>
              </td>
              <td class="px-4 py-3 text-center">
                <button @click="openEdit(task)"
                  class="px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                  编辑
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showCreate = false">
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">新建任务</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">任务 ID</label>
              <input v-model="createForm.id" placeholder="如 daily_read_1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
              <input v-model="createForm.title"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
              <input v-model="createForm.description"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
                <select v-model="createForm.type"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="daily">每日</option>
                  <option value="achievement">成就</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">条件类型</label>
                <select v-model="createForm.requirement_type"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="read_count">占卜次数</option>
                  <option value="checkin_streak">签到连续</option>
                  <option value="invite_count">邀请数量</option>
                  <option value="share_count">分享次数</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">条件值</label>
                <input v-model.number="createForm.requirement_count" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">积分奖励</label>
                <input v-model.number="createForm.points_reward" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">额度奖励</label>
                <input v-model.number="createForm.extra_quota_reward" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">排序</label>
                <input v-model.number="createForm.sort_order" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">图标</label>
                <input v-model="createForm.icon"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="showCreate = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">取消</button>
            <button @click="doCreate" :disabled="saving"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {{ saving ? '创建中...' : '创建' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showEdit = false">
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">编辑任务 {{ editTarget?.id }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
              <input v-model="editForm.title"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
              <input v-model="editForm.description"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">条件值</label>
                <input v-model.number="editForm.requirement_count" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">积分奖励</label>
                <input v-model.number="editForm.points_reward" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">额度奖励</label>
                <input v-model.number="editForm.extra_quota_reward" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">排序</label>
                <input v-model.number="editForm.sort_order" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">图标</label>
                <input v-model="editForm.icon"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="showEdit = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">取消</button>
            <button @click="doEdit" :disabled="saving"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
