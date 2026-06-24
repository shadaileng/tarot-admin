<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchConfig, updateConfigItem } from '@/api'
import type { ConfigGroup, ConfigItem } from '@/types'
import { useAuth } from '@/composables/useAuth'

const { admin } = useAuth()

const groups = ref<ConfigGroup[]>([])
const loading = ref(true)
const error = ref('')

const editingKey = ref<string | null>(null)
const editValue = ref('')
const saving = ref(false)
const saveMessage = ref('')
const saveMessageType = ref<'success' | 'error'>('success')

async function loadConfig() {
  try {
    loading.value = true
    error.value = ''
    const res = await fetchConfig()
    groups.value = res.groups
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function startEdit(item: ConfigItem) {
  editingKey.value = item.key
  editValue.value = item.value
}

function cancelEdit() {
  editingKey.value = null
  editValue.value = ''
}

async function saveEdit(key: string) {
  try {
    saving.value = true
    await updateConfigItem(key, editValue.value)
    saveMessage.value = '保存成功'
    saveMessageType.value = 'success'
    editingKey.value = null
    await loadConfig()
    setTimeout(() => { saveMessage.value = '' }, 2000)
  } catch (e: any) {
    saveMessage.value = e.message || '保存失败'
    saveMessageType.value = 'error'
    setTimeout(() => { saveMessage.value = '' }, 3000)
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading && groups.length === 0" class="text-gray-400 dark:text-gray-500 text-sm py-12 text-center">加载中...</div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
      {{ error }}
    </div>

    <template v-else>
      <div v-if="saveMessage" :class="[
        'rounded-xl p-4 text-sm transition-all',
        saveMessageType === 'success'
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
      ]">
        {{ saveMessage }}
      </div>

      <div v-for="group in groups" :key="group.name" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100">{{ group.name }}</h3>
        </div>

        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="item in group.items" :key="item.key" class="flex items-center justify-between px-6 py-3 gap-4">
            <div class="flex-1 min-w-0">
              <code class="text-sm font-mono text-indigo-600 dark:text-indigo-400">{{ item.label }}</code>
              <span v-if="item.source === 'user'" class="ml-2 text-xs text-amber-600 dark:text-amber-400">已覆盖</span>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <template v-if="editingKey === item.key">
                <input
                  v-model="editValue"
                  :type="item.type === 'number' ? 'number' : 'text'"
                  class="w-40 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  @keyup.enter="saveEdit(item.key)"
                  @keyup.escape="cancelEdit"
                />
                <button
                  :disabled="saving"
                  class="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  @click="saveEdit(item.key)"
                >
                  {{ saving ? '保存中...' : '保存' }}
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  @click="cancelEdit"
                >
                  取消
                </button>
              </template>

              <template v-else>
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.value || '—' }}</span>
                <button
                  v-if="item.editable && admin?.role !== 'readonly'"
                  class="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="编辑"
                  @click="startEdit(item)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
