# Info Radar 📡

> 个人信息雷达系统 - 打破信息差，主动捕获关键信息

---

## 🎯 项目目标

### 1. 每日信息采集
- **多平台AI资讯采集**：自动采集AI行业的最新新闻和资讯
- **本地 RSSHub 采集**：使用部署在 VPS 上的 RSSHub 服务获取各平台内容
- **数据存储**：所有采集的内容存入Supabase，便于后续分析和检索

### 2. 数据推送
- 📱 **Telegram** - 每日摘要推送
- 📧 **邮件推送** - 支持 Resend / SendCloud 发送每日摘要

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────┐
│                  Info Radar System                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📍 信息边界定义 (info-scope.md)                      │
│   └─ 定义关注领域、决策场景、质量标准                  │
│                                                      │
│  🔍 信息采集层                                        │
│   ├─ RSSHub (VPS本地部署)                            │
│   │   ├─ 微博/小红书/知乎等社交平台                    │
│   │   ├─ AI/科技媒体RSS订阅                          │
│   │   └─ 各类网站RSS/Atom源                          │
│   └─ 采集脚本 (scripts/local-collect.ts)            │
│                                                      │
│  🧠 信息处理层                                        │
│   ├─ AI过滤（相关性判断）                             │
│   ├─ 信息验证（多源交叉对比）                          │
│   ├─ 自动摘要                                        │
│   └─ 优先级排序                                       │
│                                                      │
│  💾 存储层                                           │
│   └─ Supabase (PostgreSQL)                          │
│                                                      │
│  📱 推送层                                            │
│   ├─ Telegram Bot 每日推送                          │
│   ├─ 邮件推送 (Resend / SendCloud)                  │
│   └─ Dashboard 可视化                                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 前置要求

1. **VPS 上部署 RSSHub**
   ```bash
   # 在你的VPS上安装并运行 RSSHub
   cd rsshub-src
   npm install
   npm start -- -p 1200
   ```

2. **Supabase 项目**
   - 创建 Supabase 项目
   - 运行 `supabase/` 目录下的 SQL 初始化数据库

### 安装和配置

```bash
# 克隆项目
cd /root/clawd/info-radar

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，配置以下内容:
# - RSSHUB_URL: 你的VPS RSSHub地址 (如 http://your-vps-ip:1200)
# - Supabase 凭证
# - Telegram Bot Token (可选)
# - 邮件服务 Resend/SendCloud 凭证 (可选)
```

### 运行系统

```bash
# 手动运行一次采集
npm run collect

# 设置定时任务 (VPS上)
crontab -e
# 添加: 0 9 * * * cd /path/to/info-radar && npm run collect
```

详细配置请查看 [`SETUP.md`](./SETUP.md)

---

## 📁 项目结构

```
info-radar/
├── info-scope.md          # 【核心】信息边界定义
├── README.md              # 项目说明
├── SETUP.md               # 安装配置指南
├── TELEGRAM-BINDING.md    # Telegram绑定教程
├── DATA-SOURCES.md        # 数据源配置
├── UI-DESIGN.md           # UI设计文档
│
├── pages/                 # Next.js 页面
│   ├── home.tsx           # 主页面 - 信息流展示
│   ├── history.tsx        # 历史记录
│   ├── settings.tsx       # 设置页面
│   └── api/               # API 路由
│
├── lib/                   # 核心库
│   ├── supabase.ts        # Supabase 客户端
│   ├── rsshub-routes.ts  # RSSHub 路由配置
│   ├── email/             # 邮件发送模块
│   │   ├── email-sender.ts
│   │   ├── resend-client.ts
│   │   ├── sendcloud-client.ts
│   │   └── templates.ts
│   └── utils.ts
│
├── scripts/
│   └── local-collect.ts   # 本地采集脚本
│
├── supabase/              # 数据库 Schema
└── components/            # React 组件
```

---

## 🛠️ 技术栈

**后端**：
- Node.js / TypeScript
- RSSHub (本地部署)
- AI处理：OpenAI API / 本地模型
- 数据存储：Supabase (PostgreSQL)

**前端**：
- Next.js 14
- TailwindCSS + Ant Design
- 数据可视化：Recharts

**推送**：
- Telegram Bot API
- 邮件：Resend (国际) / SendCloud (国内)

---

## ⚙️ 环境变量

| 变量 | 说明 | 必需 |
|------|------|------|
| `RSSHUB_URL` | VPS上RSSHub的地址 | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase项目URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `SUPABASE_SERVICE_KEY` | Supabase service key | ✅ |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | 可选 |
| `TELEGRAM_CHAT_ID` | Telegram 接收ID | 可选 |
| `RESEND_API_KEY` | Resend API Key | 可选 |
| `SENDCLOUD_API_USER` | SendCloud 用户名 | 可选 |
| `SENDCLOUD_API_KEY` | SendCloud API Key | 可选 |

---

## 🎯 功能路线图

### MVP v0.1（核心功能）✅ 已完成！
- [x] 项目初始化
- [x] info-scope.md 模板
- [x] RSSHub 采集（本地部署）
- [x] 简单的关键词过滤
- [x] Telegram 每日推送
- [x] 邮件推送 (Resend / SendCloud)
- [x] 按领域分类展示

### v0.2（智能化）
- [ ] AI相关性判断
- [ ] 信息去重
- [ ] 自动摘要生成
- [ ] 多源交叉验证

### v0.3（可视化）
- [ ] 知识图谱可视化
- [ ] 信息流趋势分析
- [ ] 决策复盘工具

---

## 🤝 贡献

欢迎：
- 🐛 提Issue报告问题
- 💡 分享使用经验
- 🔧 提PR改进功能

---

## 📜 许可证

MIT License

---

## 👤 作者

**Constantine** - 全栈开发者，信息焦虑患者，决心用技术解决信息不对称问题

**Ryan (AI Assistant)** - 协助开发和维护

---

**开始日期**：2026-02-01  
**当前版本**：v0.1.0-alpha  
