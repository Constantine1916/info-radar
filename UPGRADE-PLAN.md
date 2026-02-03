# Info Radar v2.0 - 多用户平台升级计划

## 🎯 目标

从单用户CLI工具升级为多用户SaaS平台

## 📊 数据库设计 (Supabase)

### 表结构

**1. users (Supabase Auth内置)**
- id (uuid, primary key)
- email
- created_at

**2. user_profiles**
- id (uuid, primary key, references auth.users)
- telegram_chat_id (text, unique)
- telegram_verified (boolean, default: false)
- verification_code (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

**3. subscriptions**
- id (uuid, primary key)
- user_id (uuid, references user_profiles)
- domain (text) - AI, FullStack, ChinaPolicy, WorldPolitics, Investment
- enabled (boolean, default: true)
- created_at (timestamp)

**4. info_items (缓存采集的信息)**
- id (uuid, primary key)
- item_id (text, unique) - 来自RSS的hash
- title (text)
- link (text)
- content (text)
- source (text)
- domain (text)
- published_at (timestamp)
- collected_at (timestamp)
- credibility_score (int)

**5. push_history**
- id (uuid, primary key)
- user_id (uuid, references user_profiles)
- items_count (int)
- domains (text[])
- sent_at (timestamp)
- success (boolean)

## 🏗️ 架构设计

### Frontend (Next.js)
```
pages/
├── index.tsx              # 首页（未登录：介绍页，已登录：跳转dashboard）
├── auth/
│   ├── login.tsx         # 登录页
│   └── signup.tsx        # 注册页
├── dashboard/
│   ├── index.tsx         # 用户仪表板
│   ├── subscriptions.tsx # 订阅配置
│   └── telegram.tsx      # Telegram绑定
├── history.tsx           # 推送历史
└── api/
    ├── auth/[...nextauth].ts  # NextAuth或Supabase Auth
    ├── collect.ts            # 采集信息（Cron触发）
    ├── push.ts               # 推送给用户（Cron触发）
    ├── telegram/
    │   └── verify.ts         # Telegram验证回调
    └── subscriptions/
        ├── get.ts
        └── update.ts
```

### Backend Logic

**定时任务（Vercel Cron）：**
1. **每天早上8:00** - `/api/collect`
   - 采集所有RSS源
   - 存入`info_items`表
   
2. **每天早上9:00** - `/api/push`
   - 读取所有active用户
   - 按用户订阅过滤信息
   - 推送到各自的Telegram

**Telegram绑定流程：**
1. 用户在Web生成验证码
2. 用户发送验证码给Bot
3. Bot webhook回调验证
4. 绑定chat_id到用户

## 🎨 UI设计

### 技术栈
- Next.js 14 (App Router)
- TailwindCSS
- shadcn/ui (组件库)
- Supabase Auth
- React Hook Form

### 页面流程
```
未登录 → 首页（介绍） → 注册/登录
    ↓
已登录 → Dashboard
    ├── 订阅配置（勾选题材）
    ├── Telegram绑定（生成验证码）
    └── 推送历史
```

## 📦 依赖包

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "tailwindcss": "^3.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0"
  }
}
```

## 🚀 部署配置

### Vercel环境变量
```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
TELEGRAM_BOT_TOKEN=
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=
```

### Vercel Cron
```json
{
  "crons": [
    {
      "path": "/api/collect",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/push",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## 📝 实现步骤

### Phase 1: 数据库 & Auth
- [ ] Supabase表结构创建
- [ ] Supabase Auth配置
- [ ] 注册/登录页面

### Phase 2: 订阅系统
- [ ] 订阅配置UI
- [ ] Telegram绑定流程
- [ ] API接口

### Phase 3: 采集 & 推送
- [ ] 改造采集逻辑（存入数据库）
- [ ] 推送逻辑（按用户订阅过滤）
- [ ] Vercel Cron配置

### Phase 4: UI优化
- [ ] Dashboard设计
- [ ] 推送历史页面
- [ ] 响应式适配

### Phase 5: 部署
- [ ] Vercel部署
- [ ] 环境变量配置
- [ ] 域名配置（可选）

## 🔒 安全考虑

- ✅ Row Level Security (Supabase RLS)
- ✅ API路由验证（session检查）
- ✅ Cron secret验证
- ✅ Rate limiting（防止滥用）
- ✅ HTTPS only

## 📊 预估工作量

- 数据库设计：30min
- Auth实现：1h
- 订阅系统：1.5h
- 采集推送改造：1h
- UI开发：2h
- 测试部署：30min

**总计：~6-7小时**

---

等待用户提供：
1. Supabase URL/keys
2. 确认Telegram绑定方案
3. UI设计偏好
