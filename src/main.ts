import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// 全局异常兜底
app.config.errorHandler = (err, instance, info) => {
  console.error('[Global Error]', {
    error: err,
    component: instance?.$options?.name || 'Unknown',
    info,
  })
}

app.use(router)
app.mount('#app')
