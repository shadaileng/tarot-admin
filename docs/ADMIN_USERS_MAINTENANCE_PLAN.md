# Admin 用户管理 — 维护功能 + 软删除方案

> 版本：v1.0 | 最后更新：2026-06-27 | 状态：待实施

## 背景

当前 Admin 用户管理页面只支持查看列表和搜索，无法维护用户。同时存在两个问题：

1. **微信用户不显示在第 1 页**：`ORDER BY last_request_at DESC` 将 `NULL` 排到最后，无请求记录的微信用户不出现
2. **账号合并时硬删除**：`mergeAccount` 直接 `DELETE FROM users`，数据不可恢复

## 需求

- 解除邮箱绑定（解除时自动恢复被合并的原邮箱用户）
- 逻辑删除用户（可恢复）
- 恢复已删除用户
- 排序修正：所有用户可见

## 涉及项目与文件

| 项目 | 文件 | 操作 |
|------|------|------|
| tarot-backend | `src/db/index.ts` | 修改（+deleted_at 列 + 更新唯一索引） |
| tarot-backend | `src/types/auth.ts` | 修改（UserRow +deleted_at） |
| tarot-backend | `src/db/user.ts` | 修改（mergeAccount 软删除 + 新增 3 函数 + queryUsers 改造） |
| tarot-backend | `src/index.ts` | 修改（新增 3 路由 + GET 增加 deleted 参数） |
| tarot-admin | `src/types/index.ts` | 修改（UserEntry +deleted_at） |
| tarot-admin | `src/api/index.ts` | 修改（新增 3 API + fetchUsers 增加 deleted 参数） |
| tarot-admin | `src/views/UsersView.vue` | 修改（Tab/操作列/确认弹窗/Toast） |

---

## §1 数据库变更

### 1.1 新增 `deleted_at` 列

`src/db/index.ts` — `initSchema()` 末尾添加兼容迁移：

```typescript
try { database.run('ALTER TABLE users ADD COLUMN deleted_at TEXT') } catch {}
```

`deleted_at IS NULL` → 正常用户，有值 → 已删除。

### 1.2 更新邮箱唯一索引

允许软删除用户保留邮箱（用于解绑时恢复查找）：

```typescript
try {
  database.run('DROP INDEX IF EXISTS idx_users_email')
  database.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
    ON users(email) WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL`)
} catch {}
```

---

## §2 后端类型变更

`src/types/auth.ts` — `UserRow` 新增 `deleted_at: string | null`

---

## §3 后端核心函数变更

### 3.1 `mergeAccount` → 软删除

- 改为 `UPDATE users SET deleted_at = ?` 而非 `DELETE`
- 将源用户的 `email`、`password_hash` 转移到目标用户
- 源用户保留 email 字段（供解绑时恢复查找）

### 3.2 新增 `unbindEmail(userId)`

1. 清空当前用户的 `email` / `password_hash`
2. 查找 `WHERE email = ? AND deleted_at IS NOT NULL` 的原邮箱用户
3. 恢复之：`SET deleted_at = NULL`
4. 若没有匹配的已删除用户，仅清空邮箱

### 3.3 新增 `softDeleteUser(userId)`

设置 `deleted_at = now`

### 3.4 新增 `restoreUser(userId)`

设置 `deleted_at = NULL`

### 3.5 `queryUsers` 改造

| 变更 | 说明 |
|------|------|
| `deleted` 参数 | `true`=已删除用户，`false/undefined`=正常用户 |
| 正常用户排序 | `COALESCE(last_request_at, last_login_at, created_at) DESC` |
| 已删除用户排序 | `deleted_at DESC`（最近删除排最前） |
| `AdminUserRow` | 新增 `deleted_at: string \| null` |

---

## §4 后端路由变更

### 4.1 `GET /api/admin/users` — 增加 `deleted` 查询参数

```typescript
const deleted = req.query.deleted === 'true'
const result = await queryUsers(page, limit, keyword, deleted)
```

### 4.2 新增 3 个管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `PUT` | `/api/admin/users/:id/unbind-email` | 解除邮箱（自动恢复原邮箱用户） |
| `DELETE` | `/api/admin/users/:id` | 逻辑删除用户 |
| `PUT` | `/api/admin/users/:id/restore` | 恢复已删除用户 |

所有接口 `adminAuthMiddleware` 保护，返回 `{ message: string }`。

---

## §5 前端类型变更

`src/types/index.ts` — `UserEntry` 新增 `deleted_at: string | null`

---

## §6 前端 API 变更

### 6.1 `fetchUsers` — 增加 `deleted` 参数

```typescript
export function fetchUsers(params: {
  page?: number; limit?: number; keyword?: string; deleted?: boolean
} = {}): Promise<UserListResponse>
```

### 6.2 新增 3 个 API 函数

```typescript
export function unbindEmail(userId: string): Promise<{ message: string }>
export function deleteUser(userId: string): Promise<{ message: string }>
export function restoreUser(userId: string): Promise<{ message: string }>
```

---

## §7 前端页面改造

`src/views/UsersView.vue` 改造内容：

| 模块 | 说明 |
|------|------|
| Tab 切换 | 正常用户 / 已删除用户 |
| 操作列 | 解除邮箱（有邮箱时）、删除、恢复（已删除时） |
| 确认弹窗 | 删除前确认 + 提示可恢复 |
| Toast 反馈 | 成功/错误提示，2 秒自动消失 |
| 视觉标识 | 已删除行 `opacity-50`，表头动态切换 |
| 分页重置 | Tab 切换时 page 归 1 |

---

## §8 软删除恢复流程

```
合并前：
  [A] 微信 (openid=xxx, email=null)
  [B] 邮箱 (email=a@test.com, pwd=hash)

mergeAccount(A, B) 后：
  [A] 微信 (email=a@test.com, pwd=hash)         ← 继承邮箱
  [B] 邮箱 (email=a@test.com, deleted_at=now)    ← 软删除

Admin 解除 A 的邮箱绑定：
  [A] 微信 (email=null, pwd=null)                 ← 清空
  [B] 邮箱 (email=a@test.com, deleted_at=NULL)    ← 自动恢复
```

---

## §9 实施步骤

| 步 | 文件 | 内容 | 依赖 |
|:--:|------|------|:----:|
| 1 | `tarot-backend/src/db/index.ts` | +deleted_at 列 + 更新唯一索引 | — |
| 2 | `tarot-backend/src/types/auth.ts` | UserRow +deleted_at | — |
| 3 | `tarot-backend/src/db/user.ts` | mergeAccount 软删除 + 3 新函数 + queryUsers 改造 | 1 |
| 4 | `tarot-backend/src/index.ts` | 3 新路由 + GET 参数扩展 | 3 |
| 5 | `tarot-admin/src/types/index.ts` | UserEntry +deleted_at | — |
| 6 | `tarot-admin/src/api/index.ts` | 3 新 API + fetchUsers 扩展 | 4 |
| 7 | `tarot-admin/src/views/UsersView.vue` | Tab/操作列/弹窗/Toast | 5,6 |
| 8 | `pnpm build` × 2 | 构建检查 | 全部完成 |
