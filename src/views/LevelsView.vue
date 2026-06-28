<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import type { LevelDefinitionEntry } from '@/types'
import { fetchLevelDefinitions, updateLevelDefinition } from '@/api'

const { admin } = useAuth()
const levels = ref<LevelDefinitionEntry[]>([])
const loading = ref(true)
const errorMsg = ref('')
const editingLevel = ref<LevelDefinitionEntry | null>(null)
const showEdit = ref(false)
const editForm = ref<LevelDefinitionEntry>({} as LevelDefinitionEntry)
const saving = ref(false)

async function loadLevels() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetchLevelDefinitions()
    levels.value = res.levels
  } catch (err: any) {
    errorMsg.value = err.message || '加载等级配置失败'
  } finally {
    loading.value = false
  }
}

function openEdit(level: LevelDefinitionEntry) {
  editingLevel.value = level
  editForm.value = { ...level }
  showEdit.value = true
}

async function saveLevel() {
  if (!editingLevel.value) return
  saving.value = true
  try {
    await updateLevelDefinition(editingLevel.value.level, editForm.value)
    showEdit.value = false
    await loadLevels()
  } catch (err: any) {
    errorMsg.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(loadLevels)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">等级配置管理</h2>
    </div>

    <div v-if="errorMsg" class="px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
      {{ errorMsg }}
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>

    <div v-else class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">等级</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">称号</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">所需积分</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">每日额度</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">额外额度上限</th>
              <th class="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lv in levels" :key="lv.level"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">Lv.{{ lv.level }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ lv.title }}</td>
              <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{{ lv.points_required }}</td>
              <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{{ lv.daily_quota }}</td>
              <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{{ lv.max_extra_quota }}</td>
              <td class="px-4 py-3 text-center">
                <button @click="openEdit(lv)"
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
      <div v-if="showEdit" class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="showEdit = false">
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">编辑等级 Lv.{{ editingLevel?.level }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">称号</label>
              <input v-model="editForm.title"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所需积分</label>
              <input v-model.number="editForm.points_required" type="number"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">每日额度</label>
                <input v-model.number="editForm.daily_quota" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">额外额度上限</label>
                <input v-model.number="editForm.max_extra_quota" type="number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button @click="showEdit = false"
              class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              取消
            </button>
            <button @click="saveLevel" :disabled="saving"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
