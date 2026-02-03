# Info Radar 📡

> 个人信息雷达系统 - 打破信息差，主动捕获关键信息

---

## 🎯 项目目标

**解决信息不对称问题**：
- ❌ 不再被动等待别人喂信息
- ❌ 不再因为信息滞后做错决策
- ❌ 不再被信息过载淹没
- ✅ 主动扫描关键领域
- ✅ 自动过滤和验证信息
- ✅ 快速获取决策所需的高质量信息

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
│   ├─ RSS订阅                                         │
│   ├─ API抓取                                         │
│   ├─ 网页爬虫                                        │
│   └─ 社交媒体监控                                     │
│                                                      │
│  🧠 信息处理层                                        │
│   ├─ AI过滤（相关性判断）                             │
│   ├─ 信息验证（多源交叉对比）                          │
│   ├─ 自动摘要                                        │
│   └─ 优先级排序                                       │
│                                                      │
│  📊 知识管理层                                        │
│   ├─ 知识图谱                                        │
│   ├─ 决策记录                                        │
│   └─ 信息源评估                                       │
│                                                      │
│  📱 推送层                                            │
│   ├─ Telegram 每日摘要                               │
│   ├─ 邮件周报                                        │
│   └─ Dashboard 可视化                                │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 第一步：定义你的信息边界

填写 [`info-scope.md`](./info-scope.md)：
- ✅ 明确3-5个关键领域  
- ✅ 定义决策场景
- ✅ 设定信息质量标准

**重要**：不要贪多！聚焦最重要的领域。

### 第二步：安装和配置

```bash
# 克隆项目
git clone https://github.com/Constantine1916/info-radar.git
cd info-radar

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env，填入你的Telegram凭证
```

### 第三步：运行系统

```bash
# 手动运行一次
npm run collect

# 或设置定时任务（推荐）
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
├── docs/                  # 文档
│   ├── architecture.md    # 架构设计
│   ├── setup-guide.md     # 配置指南
│   └── api-docs.md        # API文档
├── src/                   # 源代码
│   ├── collectors/        # 信息采集器
│   ├── processors/        # 信息处理器
│   ├── storage/           # 数据存储
│   └── notifications/     # 推送模块
├── config/                # 配置文件
│   ├── sources.json       # 信息源配置
│   └── filters.json       # 过滤规则
└── knowledge/             # 知识库
    ├── domains/           # 领域知识
    ├── decisions/         # 决策记录
    └── sources/           # 信息源评估
```

---

## 🛠️ 技术栈

**后端**：
- Node.js / TypeScript
- 数据采集：RSS Parser, Puppeteer, Axios
- AI处理：OpenAI API / 本地模型
- 数据存储：SQLite / PostgreSQL

**前端**（Dashboard）：
- Next.js 14
- TailwindCSS
- 数据可视化：Recharts / D3.js

**通知**：
- Telegram Bot API
- 邮件：Nodemailer

---

## 🎯 功能路线图

### MVP v0.1（核心功能）✅ 已完成！
- [x] 项目初始化
- [x] info-scope.md 模板
- [x] RSS订阅采集（9个信息源）
- [x] 简单的关键词过滤（标题党、时效性）
- [x] Telegram每日推送
- [x] 按领域分类展示
- [ ] 基础知识库存储（下一步）

### v0.2（智能化）
- [ ] AI相关性判断
- [ ] 信息去重
- [ ] 自动摘要生成
- [ ] 多源交叉验证

### v0.3（可视化）
- [ ] Web Dashboard
- [ ] 知识图谱可视化
- [ ] 信息流趋势分析
- [ ] 决策复盘工具

### v1.0（完整系统）
- [ ] 完整的信息验证系统
- [ ] 个性化推荐
- [ ] 决策辅助AI
- [ ] 移动端支持

---

## 🤝 贡献

这是一个个人项目，但欢迎：
- 🐛 提Issue报告问题
- 💡 分享你的使用经验
- 🔧 提PR改进功能
- 📝 完善文档

---

## 📜 许可证

MIT License - 自由使用和修改

---

## 👤 作者

**Constantine** - 全栈开发者，信息焦虑患者，决心用技术解决信息不对称问题

**Ryan (AI Assistant)** - 协助开发和维护

---

## 🙏 致谢

感谢所有为信息透明和开放做出贡献的人

---

**开始日期**：2026-02-01  
**当前版本**：v0.1.0-alpha  
**状态**：🚧 初始开发中
