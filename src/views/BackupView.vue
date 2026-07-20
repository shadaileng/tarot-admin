<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useAuth } from '@/composables/useAuth'
import { createBackup, listBackups, downloadBackupBlob, deleteBackup, restoreBackup } from '@/api'
import type { BackupInfo } from '@/types'

const { showToast } = useToast()
const { admin } = useAuth()

const loading = ref(true)
const creating = ref(false)
const deleting = ref<string | null>(null)
const restoring = ref(false)
const backups = ref<BackupInfo[]>([])
const totalSize = ref(0)
const error = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString()
}

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await listBackups()
    backups.value = res.backups
    totalSize.value = res.totalSize
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  creating.value = true
  try {
    const res = await createBackup()
    if (res.success) {
      showToast('备份创建成功', 'success')
      await load()
    } else {
      showToast(res.error || '备份失败')
    }
  } catch (err: any) {
    showToast(err.message || '备份失败')
  } finally {
    creating.value = false
  }
}

async function handleDownload(item: BackupInfo) {
  try {
    const blob = await downloadBackupBlob(item.filename)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    showToast(err.message || '下载失败')
  }
}

async function handleDelete(item: BackupInfo) {
  if (!confirm(`确定要删除备份「${item.name}」吗？`)) return
  deleting.value = item.filename
  try {
    const res = await deleteBackup(item.filename)
    if (res.success) {
      showToast('备份已删除', 'success')
      await load()
    } else {
      showToast(res.message || '删除失败')
    }
  } catch (err: any) {
    showToast(err.message || '删除失败')
  } finally {
    deleting.value = null
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]
  }
}

async function handleRestore() {
  if (!selectedFile.value) {
    showToast('请选择备份文件')
    return
  }
  if (!confirm(`确定要从「${selectedFile.value.name}」恢复数据吗？此操作将覆盖当前数据。`)) return
  restoring.value = true
  try {
    const res = await restoreBackup(selectedFile.value)
    if (res.success) {
      showToast(res.message, 'success')
      selectedFile.value = null
      await load()
    } else {
      showToast(res.message || '恢复失败')
    }
  } catch (err: any) {
    showToast(err.message || '恢复失败')
  } finally {
    restoring.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">备份恢复</h1>
      <div class="flex gap-3">
        <button
          v-if="admin?.role !== 'readonly'"
          @click="handleCreate"
          :disabled="creating"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
        >
          {{ creating ? '备份中...' : '触发备份' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">加载中...</div>
    <div v-else-if="error" class="text-center py-12 text-red-500">{{ error }}</div>

    <template v-else>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">备份列表</h2>
          <div v-if="backups.length > 0" class="text-xs text-gray-400">
            共 {{ backups.length }} 个，总大小 {{ formatSize(totalSize) }}
          </div>
        </div>

        <div v-if="backups.length === 0" class="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
          暂无备份，点击「触发备份」创建第一个备份
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">备份名称</th>
                <th class="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">大小</th>
                <th class="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">创建时间</th>
                <th class="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in backups" :key="item.name" class="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="py-3 font-mono text-xs text-gray-900 dark:text-gray-100 max-w-xs truncate" :title="item.name">
                  {{ item.name }}
                </td>
                <td class="py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                  {{ formatSize(item.size) }}
                </td>
                <td class="py-3 text-right text-gray-600 dark:text-gray-400 text-xs">
                  {{ formatTime(item.createdAt) }}
                </td>
                <td class="py-3 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      @click="handleDownload(item)"
                      class="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      下载
                    </button>
                    <button
                      v-if="admin?.role !== 'readonly'"
                      @click="handleDelete(item)"
                      :disabled="deleting === item.filename"
                      class="px-3 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                    >
                      {{ deleting === item.filename ? '删除中...' : '删除' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="admin?.role !== 'readonly'" class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">恢复数据</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          上传一个之前下载的 .tar.gz 备份文件，恢复数据库和上传文件。<br>
          <span class="text-yellow-600 dark:text-yellow-400">⚠️ 恢复操作将覆盖当前数据，请谨慎操作。</span>
        </p>
        <div class="flex items-center gap-4">
          <label class="flex-1">
            <input
              type="file"
              accept=".tar.gz"
              @change="onFileChange"
              class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 cursor-pointer"
            />
          </label>
          <button
            @click="handleRestore"
            :disabled="!selectedFile || restoring"
            class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors whitespace-nowrap"
          >
            {{ restoring ? '恢复中...' : '开始恢复' }}
          </button>
        </div>
        <div v-if="selectedFile" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          已选择：{{ selectedFile.name }}（{{ formatSize(selectedFile.size) }}）
        </div>
      </div>
    </template>
  </div>
</template>
