import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录', layout: 'blank' },
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: '仪表盘' },
    },
    {
      path: '/logs',
      name: 'logs',
      component: () => import('@/views/LogsView.vue'),
      meta: { title: '日志' },
    },
    {
      path: '/health',
      name: 'health',
      component: () => import('@/views/HealthView.vue'),
      meta: { title: '健康监控' },
    },
    {
      path: '/metrics',
      name: 'metrics',
      component: () => import('@/views/MetricsView.vue'),
      meta: { title: '指标' },
    },
    {
      path: '/config',
      name: 'config',
      component: () => import('@/views/ConfigView.vue'),
      meta: { title: '配置' },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { title: '用户管理' },
    },
  ],
})

router.beforeEach((to) => {
  document.title = `${(to.meta as any).title || 'Admin'} - Tarot Admin`
})

router.beforeEach((to, from, next) => {
  const { isLoggedIn } = useAuth()

  // 访问登录页：已登录则重定向到首页
  if (to.path === '/login') {
    if (isLoggedIn.value) return next('/')
    return next()
  }

  // 访问普通页面：未登录则重定向到登录页
  if (!isLoggedIn.value) return next('/login')

  next()
})

export default router
