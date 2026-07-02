import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { HealthResponse } from '@/types'
import { fetchHealth } from '@/api'
import { useAuth } from './useAuth'

export function useHealth(intervalMs = 10000) {
  const data = ref<HealthResponse | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(true)
  let timer: ReturnType<typeof setInterval> | null = null
  const { isLoggedIn } = useAuth()

  async function refresh() {
    try {
      data.value = await fetchHealth()
      error.value = null
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function stopPolling() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  watch(isLoggedIn, (loggedIn) => {
    if (!loggedIn) {
      stopPolling()
    }
  })

  onMounted(() => {
    if (isLoggedIn.value) {
      refresh()
      timer = setInterval(refresh, intervalMs)
    }
  })

  onUnmounted(() => {
    stopPolling()
  })

  return { data, error, loading, refresh }
}
