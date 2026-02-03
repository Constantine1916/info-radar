# Supabase 设置指南

## 方式1：在Supabase网站创建（推荐）

### 步骤1：创建项目
1. 访问 https://supabase.com/dashboard
2. 点击 "New Project"
3. 填写：
   - Name: `info-radar`
   - Database Password: (自己设置，记住)
   - Region: Singapore (距离中国最近)
4. 等待创建完成（~2分钟）

### 步骤2：执行数据库迁移
1. 进入项目 → 左侧菜单 → SQL Editor
2. 点击 "New Query"
3. 复制粘贴 `migrations/20260202_init_schema.sql` 的全部内容
4. 点击 "Run" 执行

### 步骤3：获取API密钥
1. 进入 Settings → API
2. 复制以下信息：
   ```
   Project URL: https://xxx.supabase.co
   anon public key: eyJ...
   service_role key: eyJ...
   ```

### 步骤4：配置环境变量
在 `/root/clawd/info-radar/.env` 添加：
```env
NEXT_PUBLIC_SUPABASE_URL=你的Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key
SUPABASE_SERVICE_KEY=你的service_role key
```

### 步骤5：启用Email Auth
1. 进入 Authentication → Providers
2. 确保 "Email" 已启用
3. (可选) 配置SMTP或使用Supabase默认邮件

---

## 方式2：使用Supabase CLI

**需要Docker运行**

```bash
# 启动本地Supabase
supabase start

# 应用迁移
supabase db reset

# 获取本地密钥
supabase status
```

---

## 验证设置是否成功

在项目根目录运行：
```bash
npm run db:verify
```

或手动测试：
```bash
curl "你的SUPABASE_URL/rest/v1/user_profiles" \
  -H "apikey: 你的ANON_KEY"
```

应该返回 `[]` (空数组)，说明表已创建。

---

## 数据库表结构

创建后会有以下表：

- **user_profiles** - 用户资料（扩展auth.users）
- **subscriptions** - 用户订阅配置
- **info_items** - 信息缓存
- **push_history** - 推送历史

所有表都启用了Row Level Security (RLS)。
