import { ref, type Ref } from 'vue'

export interface UseAsyncDataReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  execute: () => Promise<void>
}

export function useAsyncData<T>(fetcher: () => Promise<T>): UseAsyncDataReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher()
    } catch (err: any) {
      error.value = err.message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
