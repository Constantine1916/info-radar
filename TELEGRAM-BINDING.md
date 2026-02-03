# Telegram绑定流程设计

## 用户体验流程

### 步骤1：用户在Web生成验证码
```
Dashboard → Telegram绑定 → 点击"生成验证码"
↓
显示：你的验证码是 ABC123
提示：请发送 /verify ABC123 给 @ryan1916_bot
```

### 步骤2：用户发消息给Bot
```
用户在Telegram发送: /verify ABC123
```

### 步骤3：Bot验证并绑定
```
Bot收到消息 → 查询数据库 → 找到对应用户
↓
更新 user_profiles:
  - telegram_chat_id = 用户的chat_id
  - telegram_verified = true
  - verification_code = null
↓
回复用户: ✅ 绑定成功！你将收到每日信息推送
```

### 步骤4：Web自动刷新状态
```
前端轮询检查绑定状态
↓
已绑定 → 显示: ✅ 已绑定 (chat_id: xxx)
```

---

## 技术实现

### Backend API

**1. `/api/telegram/generate-code` (POST)**
- 需要用户登录（session验证）
- 生成6位随机验证码
- 更新user_profiles.verification_code
- 返回验证码

**2. `/api/telegram/verify` (POST)**
- Bot Webhook接收消息
- 解析 `/verify CODE`
- 查询数据库匹配验证码
- 更新chat_id和verified状态
- 回复用户成功/失败

**3. `/api/telegram/status` (GET)**
- 检查当前用户绑定状态
- 返回 telegram_verified 和 chat_id

### Bot Webhook配置

在Telegram设置webhook：
```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram/verify
```

### 数据库操作

**生成验证码：**
```sql
UPDATE user_profiles
SET verification_code = 'ABC123'
WHERE id = <user_id>;
```

**验证绑定：**
```sql
UPDATE user_profiles
SET telegram_chat_id = '<chat_id>',
    telegram_verified = true,
    verification_code = null
WHERE verification_code = 'ABC123'
RETURNING id;
```

---

## 安全考虑

1. **验证码有效期**
   - 10分钟过期（可选实现）
   - 添加 verification_code_expires_at 字段

2. **防止重复绑定**
   - telegram_chat_id 设为 UNIQUE
   - 一个Telegram账号只能绑定一个用户

3. **验证码复杂度**
   - 6位字母数字混合
   - 避免易混淆字符（0/O, 1/I）

---

## UI设计

### 未绑定状态
```
┌─────────────────────────────────────┐
│ 📱 绑定Telegram                      │
├─────────────────────────────────────┤
│ 绑定后可接收每日信息推送              │
│                                      │
│ [生成验证码]                         │
└─────────────────────────────────────┘
```

### 显示验证码
```
┌─────────────────────────────────────┐
│ 📱 绑定Telegram                      │
├─────────────────────────────────────┤
│ 你的验证码：                         │
│                                      │
│    🔑 ABC123                         │
│                                      │
│ 请发送以下消息给 @ryan1916_bot:      │
│    /verify ABC123                   │
│                                      │
│ ⏰ 验证码10分钟内有效                 │
└─────────────────────────────────────┘
```

### 已绑定状态
```
┌─────────────────────────────────────┐
│ 📱 绑定Telegram                      │
├─────────────────────────────────────┤
│ ✅ 已绑定                            │
│                                      │
│ Chat ID: 7937224199                 │
│                                      │
│ [解除绑定]                           │
└─────────────────────────────────────┘
```

---

## Bot命令设计

Bot需要处理的命令：

- `/start` - 欢迎消息
- `/verify CODE` - 验证绑定
- `/help` - 帮助信息
- `/status` - 查看订阅状态（可选）

示例回复：
```
/start:
欢迎使用 Info Radar！
请先在网站 https://your-app.vercel.app 注册账号，
然后生成验证码完成绑定。

/verify ABC123:
✅ 绑定成功！
你将在每天早上9点收到个性化信息推送。

/verify WRONG:
❌ 验证码无效或已过期
请在网站重新生成验证码
```

---

等待Supabase项目创建完成后立即实现！
