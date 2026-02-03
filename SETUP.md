# Info Radar - 快速开始

## 📦 安装

```bash
git clone https://github.com/Constantine1916/info-radar.git
cd info-radar
npm install
```

## ⚙️ 配置

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 编辑 `.env`，填入你的Telegram凭证：
```env
TELEGRAM_BOT_TOKEN=你的bot_token
TELEGRAM_CHAT_ID=你的chat_id
```

**如何获取？**
- Bot Token: 在Telegram搜索 `@BotFather`，创建bot后获得
- Chat ID: 发消息给bot，然后访问 `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`

## 🚀 运行

### 手动运行一次
```bash
npm run collect
```

### 设置定时任务（每天早上9点）

**Linux/Mac (cron):**
```bash
# 编辑crontab
crontab -e

# 添加这一行（根据实际路径调整）
0 9 * * * cd /root/clawd/info-radar && npm run collect >> /tmp/info-radar.log 2>&1
```

**或使用Clawdbot cron (推荐):**
```bash
# 让Clawdbot每天早上9点自动运行
clawdbot cron add \
  --schedule "0 9 * * *" \
  --text "运行info-radar采集并推送每日信息摘要"
```

## 📊 输出示例

运行后会：
1. 📡 采集各个RSS源的最新信息
2. 🔍 过滤低质量内容（标题党、过期信息）
3. 📝 按领域分类生成摘要
4. 📱 推送到你的Telegram

示例输出：
```
🚀 Info Radar starting...
📡 Collecting from 9 sources...
✅ Collected 1135 items
🔍 Filtering...
✅ Filtered down to 72 high-quality items
📱 Sending to Telegram...
✅ Sent successfully
```

## 🔧 自定义

### 1. 修改关注领域

编辑 `info-scope.md` 定义你的关注领域

### 2. 添加/修改信息源

编辑 `src/config/sources.ts`:
```typescript
{
  name: '你的信息源',
  url: 'https://example.com/rss',
  type: 'rss',
  domain: 'AI', // AI, FullStack, ChinaPolicy, WorldPolitics, Investment
  credibility: 4 // 1-5
}
```

### 3. 调整过滤规则

编辑 `src/processors/filter.ts` 的 `filter()` 方法

## 🐛 故障排查

**问题: 某些RSS源失败**
- 检查URL是否正确
- 某些网站可能屏蔽了请求头，需要添加User-Agent

**问题: Telegram发送失败**
- 检查`.env`配置是否正确
- 确认bot已经start（在Telegram中点击bot并发送/start）
- 检查chat_id是否正确

**问题: 采集的信息太多/太少**
- 调整`src/processors/filter.ts`中的过滤规则
- 调整时间窗口（目前是7天内的信息）

## 📈 下一步

- [ ] 添加AI过滤（智能判断信息相关性）
- [ ] 添加信息验证（多源交叉对比）
- [ ] 添加Web Dashboard
- [ ] 数据持久化（SQLite）
- [ ] 信息去重

查看 `README.md` 了解完整路线图。
