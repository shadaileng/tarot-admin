# tarot-admin

塔罗牌后台管理面板 — 查看和管理 tarot-backend 服务的信息、配置、日志和指标

## 快速开始

### 前置条件

- Node.js 20+
- pnpm
- `tarot-backend` 运行在 `http://localhost:3000`

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（需先启动 tarot-backend）
pnpm dev
```

访问 `http://localhost:5173`。

### 生产构建

```bash
# 设置后端地址（可选，留空则需要反向代理）
VITE_API_BASE_URL=https://your-backend.example.com pnpm build

# 输出到 dist/
pnpm preview    # 本地预览
```

## 功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 仪表盘 | `/` | 服务状态、核心指标概览 |
| 日志 | `/logs` | 分页表格、target 筛选、详情弹窗 |
| 健康监控 | `/health` | Gemini 状态、缓存/浏览器池可视化 |
| 指标 | `/metrics` | Prometheus 指标解析、Chart.js 柱状图 |
| 配置 | `/config` | 环境变量列表（按类别分组，API Key 脱敏） |

支持暗色/亮色主题切换，偏好保存在 localStorage。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 4 |
| 路由 | Vue Router 4 |
| HTTP | 原生 fetch |
| 图表 | Chart.js 4 + vue-chartjs 5 |
| 包管理 | pnpm |

## 项目结构

```
tarot-admin/
├── index.html
├── package.json
├── vite.config.ts               # Vite 配置（proxy → localhost:3000）
├── .env.development             # 开发环境变量
├── .env.production              # 生产环境变量
├── docs/
│   ├── PLAN.md                  # 执行规划
│   ├── API.md                   # 后端 API 对接文档
│   └── ARCHITECTURE.md          # 架构设计文档
└── src/
    ├── api/index.ts             # fetch 封装 + API 调用
    ├── types/index.ts           # TypeScript 类型定义
    ├── router/index.ts          # 路由配置
    ├── composables/             # useTheme, useHealth
    ├── components/
    │   ├── layout/              # AppLayout, Sidebar, TopBar, ThemeToggle
    │   ├── dashboard/           # StatusCard, MetricCard
    │   ├── logs/                # LogTable, LogDetail, LogFilter
    │   └── health/              # HealthCard, CacheStatus, PoolStatus
    └── views/                   # 5 个页面视图
```

## 实现顺序

> 本节汇总 docs/ 目录下开发计划的落地时序。状态：✅ 已完成  🟡 进行中  ⬜ 待实施

### 阶段 0：基础管理面板

| 顺序 | 计划文档 | 范围 | 状态 |
|:---:|---------|------|:---:|
| 0.1 | `docs/PLAN.md` §五 Step 1-6 | Vue3 骨架 + 5 页面 + 路由 + 主题 | ✅ |
| 0.2 | `docs/API.md` | 后端 API 端点定义 | ✅ |
| 0.3 | `docs/ARCHITECTURE.md` | 前端架构与数据流 | ✅ |

### 阶段 1：可观测性消费

| 顺序 | 计划文档 | 范围 | 状态 |
|:---:|---------|------|:---:|
| 1.1 | `docs/PLAN.md` Step 4-5 | Dashboard / Health / Logs / Metrics / Config 页面 | ✅ |

### 阶段 2：Admin 认证

| 顺序 | 计划文档 | 范围 | 状态 |
|:---:|---------|------|:---:|
| 2.1 | `docs/ADMIN_LOGIN_PLAN.md` | 登录页 / useAuth / LoginView 雏形 | ✅ |
| 2.2 | `docs/ADMIN_AUTH_UPGRADE_PLAN.md` §二 | 移除 VITE_API_KEY + ChangePasswordView + TopBar 用户菜单 + 路由守卫 | ✅ |

### 阶段 3：日志与用户管理

| 顺序 | 计划文档 | 范围 | 状态 |
|:---:|---------|------|:---:|
| 3.1 | `docs/ADMIN_LOGS_USER_PLAN.md` 前端 | LogEntry 扩字段 + 表格/详情展示用户 | ⬜ |
| 3.2 | `docs/ADMIN_USERS_PLAN.md` 前端 | 用户管理页面（搜索/列表/统计） | ✅ |

### 跨项目依赖

- 📦 前置依赖：需 tarot-backend 阶段 0+1 就绪
- 📦 前置依赖：需 tarot-backend 阶段 2 就绪（Admin 登录）
- 📦 后续依赖：tarot-miniprogram 阶段 2.x 用户上线后，日志页才能显示真实数据

## 环境变量

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 基础地址 | 空（使用 Vite proxy） |

- 开发环境：留空，Vite proxy 自动转发到 `http://localhost:3000`
- 生产环境：设置为后端地址，如 `https://api.example.com`

## 开发指南

### 后端依赖

本项目为纯前端应用，所有数据来自 `tarot-backend`。开发时需确保后端运行：

```bash
# 终端 1：启动后端
cd ../tarot-backend && pnpm run dev

# 终端 2：启动前端
pnpm dev
```

### Vite Proxy

开发环境下，以下路径的请求会自动代理到 `http://localhost:3000`：

- `/reading`、`/poster`、`/health`、`/metrics`、`/logs`、`/cards`

### API 端点

本项目仅使用后端的**只读**端点：

| 端点 | 用途 |
|------|------|
| `GET /` | 服务信息 |
| `GET /health` | 健康检查 |
| `GET /logs` | 日志查询 |
| `GET /logs/:id` | 日志详情 |
| `GET /metrics` | Prometheus 指标 |

## 部署

### Cloudflare Workers（推荐）

#### 1. Wrangler CLI（一键部署）

```bash
# 先登录 Cloudflare
npx wrangler login

# 构建 + 上传
pnpm deploy:cf
```

#### 2. 手动分步

```bash
pnpm build
npx wrangler deploy
```

#### 3. GitHub Actions（推荐）

push `master` 分支自动部署，需配置以下 Secrets 和 Variables：

| 类型 | 名称 | 说明 |
|------|------|------|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| Variable | `VITE_API_BASE_URL` | 后端 API 地址（如 `https://api.example.com`） |

> SPA 路由回退通过 `wrangler.toml` 中 `not_found_handling = "single-page-application"` 配置，无需 `_redirects` 文件。

### 静态托管

```bash
pnpm build
# 将 dist/ 部署到 Nginx / Vercel 等
```

生产环境需要配置反向代理，将 API 请求转发到后端。

### Docker（示例）

```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install && pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### 同域部署

与 `tarot-backend` 部署在同一域名下，通过 Nginx 反向代理：

```nginx
location / {
    root /path/to/tarot-admin/dist;
    try_files $uri $uri/ /index.html;
}

location ~ ^/(health|logs|metrics|reading|poster|cards) {
    proxy_pass http://127.0.0.1:3000;
}
```
