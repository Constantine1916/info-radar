# 数据源详细清单

> 每个领域的具体数据获取方式和验证机制

---

## 🤖 领域 1: AI/技术趋势

### 数据源

| 名称 | 类型 | 访问方式 | 更新频率 | 可信度 |
|------|------|----------|----------|--------|
| **Hacker News** | RSS/API | https://hn.algolia.com/api | 实时 | ⭐⭐⭐⭐ |
| **GitHub Trending** | 爬虫 | https://github.com/trending | 每日 | ⭐⭐⭐⭐⭐ |
| **Arxiv AI** | RSS | http://export.arxiv.org/rss/cs.AI | 每日 | ⭐⭐⭐⭐⭐ |
| **OpenAI Blog** | RSS | https://openai.com/blog/rss | 不定期 | ⭐⭐⭐⭐⭐ |
| **Papers with Code** | API | https://paperswithcode.com/api/v1/ | 每日 | ⭐⭐⭐⭐⭐ |
| **r/MachineLearning** | Reddit API | reddit.com/r/MachineLearning | 实时 | ⭐⭐⭐ |

### 验证机制

**多源交叉验证**：
- 重大新闻：至少3个独立来源报道
- 技术突破：查看论文原文 + GitHub实现 + 社区讨论

**数据验证流程**：
```
1. 检查是否有论文/代码支撑
2. 查看GitHub stars/forks趋势（是否真实关注）
3. 检查作者/机构背景（Google/OpenAI等 vs 不知名）
4. 社区反应（HN/Reddit评论质量）
5. 历史验证（该源过往准确率）
```

**红旗信号**（自动过滤）：
- ❌ 只有标题，没有论文/代码链接
- ❌ 声称"突破"但没有benchmark数据
- ❌ 匿名发布的"内部消息"
- ❌ 情绪化标题（"震惊"、"颠覆"）

---

## 💻 领域 2: 全栈开发生态

### 数据源

| 名称 | 类型 | 访问方式 | 更新频率 | 可信度 |
|------|------|----------|----------|--------|
| **Next.js Blog** | RSS | https://nextjs.org/feed.xml | 每周 | ⭐⭐⭐⭐⭐ |
| **React RFC** | GitHub | https://github.com/reactjs/rfcs | 不定期 | ⭐⭐⭐⭐⭐ |
| **Node.js Blog** | RSS | https://nodejs.org/en/feed/blog.xml | 每月 | ⭐⭐⭐⭐⭐ |
| **Vercel** | RSS/API | https://vercel.com/blog/rss | 每周 | ⭐⭐⭐⭐ |
| **Frontend Focus** | 邮件 | https://frontendfoc.us | 每周 | ⭐⭐⭐⭐ |

### 验证机制

**官方 > 社区 > 个人博客**：
- 优先级：官方文档 > RFC > 知名开发者 > 普通博客

**技术可行性验证**：
```
1. 检查是否有官方文档/RFC支持
2. 查看GitHub issue/discussion（实际问题）
3. 搜索production使用案例
4. 检查性能benchmark（如果声称性能提升）
5. 查看breaking changes（升级风险）
```

**版本验证**：
- 检查npm/GitHub发布时间
- 确认是stable还是beta/alpha
- 查看changelog（实际改动）

**红旗信号**：
- ❌ "最佳实践"但没有说明适用场景
- ❌ 性能声称但没有benchmark
- ❌ 推荐工具但有明显商业利益

---

## 🇨🇳 领域 3: 中国政策/市场

### 数据源

| 名称 | 类型 | 访问方式 | 更新频率 | 可信度 |
|------|------|----------|----------|--------|
| **中国政府网** | RSS | http://www.gov.cn/pushinfo/v150203/index.htm | 每日 | ⭐⭐⭐⭐⭐ |
| **国家发改委** | 爬虫 | https://www.ndrc.gov.cn | 不定期 | ⭐⭐⭐⭐⭐ |
| **证监会** | RSS | http://www.csrc.gov.cn/csrc/c101981/common_list.shtml | 不定期 | ⭐⭐⭐⭐⭐ |
| **36氪** | RSS | https://36kr.com/feed | 每日 | ⭐⭐⭐ |
| **财新网** | 爬虫 | https://www.caixin.com | 每日 | ⭐⭐⭐⭐ |
| **国家统计局** | API | http://data.stats.gov.cn | 月度 | ⭐⭐⭐⭐⭐ |

### 验证机制

**政策信息验证**：
```
1. 必须查看官方原文（政府网站）
2. 对比多家媒体解读（避免误读）
3. 查看历史类似政策及效果
4. 分析政策层级（国务院 vs 部委 vs 地方）
5. 时效性（发布日期 vs 生效日期）
```

**市场信息验证**：
```
1. 数据来源：官方统计 > 行业报告 > 媒体估算
2. 交叉验证：多个数据源对比
3. 时间序列：看趋势而非单点
4. 利益相关方分析（谁在说？为什么？）
```

**红旗信号**：
- ❌ "据可靠消息"、"知情人士透露"
- ❌ 二手解读没有附原文链接
- ❌ 预测性内容（"政策即将出台"）
- ❌ 单一来源的重大消息

---

## 🌍 领域 4: 世界局势/政治

### 数据源

| 名称 | 类型 | 访问方式 | 更新频率 | 可信度 |
|------|------|----------|----------|--------|
| **Reuters** | RSS | https://www.reuters.com/rssfeed | 实时 | ⭐⭐⭐⭐⭐ |
| **BBC News** | RSS | http://feeds.bbci.co.uk/news/rss.xml | 实时 | ⭐⭐⭐⭐⭐ |
| **Bloomberg** | RSS/API | https://www.bloomberg.com/feeds/ | 实时 | ⭐⭐⭐⭐⭐ |
| **The Economist** | RSS | https://www.economist.com/rss | 每周 | ⭐⭐⭐⭐⭐ |
| **新华社国际** | RSS | http://www.news.cn/world/ | 每日 | ⭐⭐⭐⭐ |
| **UN News** | RSS | https://news.un.org/feed | 每日 | ⭐⭐⭐⭐⭐ |

### 验证机制

**多角度验证**（非常重要！）：
```
1. 至少3个不同立场的媒体源
   - 西方媒体（Reuters/BBC）
   - 中国媒体（新华社）
   - 中立方（UN/国际组织）

2. 区分事实 vs 观点
   - 事实：有时间、地点、人物、数据
   - 观点：分析、预测、评论

3. 检查原始声明
   - 政府官方声明
   - 联合国文件
   - 条约原文

4. 时间线验证
   - 事件发展顺序
   - 信息发布时间
   - 是否有后续更新/辟谣
```

**偏见识别**：
```
- 检查用词（中性 vs 倾向性）
- 检查引用源（单一 vs 多元）
- 检查历史立场（该媒体过往倾向）
- 检查利益相关（谁资助该媒体）
```

**红旗信号**：
- ❌ 只有一个来源报道的"重大事件"
- ❌ 无法找到官方声明原文
- ❌ 用词极端情绪化
- ❌ 匿名官员爆料

---

## 💰 领域 5: 投资机会（股市/创业）

### 数据源

| 名称 | 类型 | 访问方式 | 更新频率 | 可信度 |
|------|------|----------|----------|--------|
| **上交所公告** | 爬虫 | http://www.sse.com.cn | 实时 | ⭐⭐⭐⭐⭐ |
| **深交所公告** | 爬虫 | http://www.szse.cn | 实时 | ⭐⭐⭐⭐⭐ |
| **公司财报** | PDF/API | 巨潮资讯网 | 季度 | ⭐⭐⭐⭐⭐ |
| **东方财富** | API | https://www.eastmoney.com | 实时 | ⭐⭐⭐ |
| **雪球** | 爬虫 | https://xueqiu.com | 实时 | ⭐⭐ |
| **YC公司** | API | https://www.ycombinator.com/companies | 每批次 | ⭐⭐⭐⭐ |
| **Crunchbase** | API | https://www.crunchbase.com | 每日 | ⭐⭐⭐⭐ |

### 验证机制

**投资信息验证（最严格）**：
```
1. 一手数据为王
   - 财报：只看原文，不看解读
   - 公告：交易所官网
   - 数据：Wind/Bloomberg等专业源

2. 多维度验证
   - 基本面：财报 + 行业报告
   - 技术面：多个数据源对比（防止错误）
   - 消息面：必须有官方确认

3. 利益相关方分析
   - 谁在推荐？（券商/自媒体/个人）
   - 有什么动机？（荐股 vs 客观分析）
   - 历史准确率如何？

4. 时间验证
   - 消息发布时间 vs 股价反应
   - 是否已经反映在价格中
```

**创业机会验证**：
```
1. 市场需求验证
   - 是否有真实用户/付费
   - ProductHunt/Twitter反馈
   - Google Trends搜索趋势

2. 竞争格局
   - 有多少竞争对手
   - 融资情况（Crunchbase）
   - 技术壁垒

3. 政策合规性
   - 监管态度
   - 行业限制
```

**红旗信号**（极其危险）：
- ❌ "内幕消息"、"庄家动向"
- ❌ 预测具体股价目标
- ❌ "稳赚不赔"类说法
- ❌ 匿名荐股
- ❌ 没有财报/数据支撑的推荐
- ❌ 时间窗口紧迫（"今天必须买"）

---

## ₿ 领域 6: Crypto / Web3

### 数据源

| 名称 | 类型 | 访问方式 | 更新频率 | 可信度 |
|------|------|----------|----------|--------|
| **CoinDesk** | RSS | https://www.coindesk.com/arc/outboundfeeds/rss/ | 实时 | ⭐⭐⭐⭐ |
| **The Block** | RSS | https://www.theblock.co/rss | 实时 | ⭐⭐⭐⭐⭐ |
| **CryptoSlate** | RSS | https://cryptoslate.com/feed/ | 实时 | ⭐⭐⭐ |
| **Decrypt** | RSS | https://decrypt.co/feed | 每日 | ⭐⭐⭐ |
| **Vitalik Blog** | RSS | https://vitalik.ca/feed.xml | 不定期 | ⭐⭐⭐⭐⭐ |

### 验证机制

**DeFi/协议验证**：
```
1. 检查官方文档和代码（GitHub）
2. 查看TVL历史数据
3. 安全审计报告
4. 团队背景调查
```

**红旗信号**：
- ❌ "即将上所"、"即将暴涨"
- ❌ 没有审计的DeFi协议
- ❌ 匿名团队
- ❌ 过度承诺APY

---

## 📦 领域 7: 产品经理

### 数据源

| 名称 | 类型 | 访问方式 | 更新频率 | 可信度 |
|------|------|----------|----------|--------|
| **Product Hunt** | RSS | https://www.producthunt.com/feed | 每日 | ⭐⭐⭐⭐ |
| **Lenny's Newsletter** | RSS | https://www.lennysnewsletter.com/feed | 每周 | ⭐⭐⭐⭐⭐ |
| **Mind the Product** | RSS | https://www.mindtheproduct.com/feed | 每周 | ⭐⭐⭐⭐ |
| **Gibiddleson B** | RSS | https://gibsonbiddle.com/feed.xml | 不定期 | ⭐⭐⭐⭐⭐ |
| **Intercom Blog** | RSS | https://www.intercom.com/blog/rss.xml | 每周 | ⭐⭐⭐⭐ |

### 验证机制

**产品案例验证**：
```
1. 数据来源：一手案例研究 > 二手分享
2. 验证结论：是否有数据支撑
3. 适用场景：是否说明边界条件
4. 可操作性：是否有具体方法论
```

---

## 🎨 领域 8: 设计 / 视觉

### 数据源

| 名称 | 类型 | 访问方式 | 更新频率 | 可信度 |
|------|------|----------|----------|--------|
| **Dribbble** | API | https://dribbble.com/shots/popular | 每日 | ⭐⭐⭐ |
| **Awwwards** | RSS | https://www.awwwards.com/feed | 每日 | ⭐⭐⭐⭐ |
| **Design Systems Repo** | GitHub | https://github.com/design-systems/coalition | 每周 | ⭐⭐⭐⭐⭐ |
| **Material Design** | RSS | https://material.io/blog/feed | 每周 | ⭐⭐⭐⭐⭐ |
| **Smashing Magazine** | RSS | https://www.smashingmagazine.com/feed | 每周 | ⭐⭐⭐⭐⭐ |

---

## ⚡ 领域 9: 效率工具

### 数据源

| 名称 | 类型 | 访问方式 | 更新频率 | 可信度 |
|------|------|----------|----------|--------|
| **AlternativeTo** | RSS | https://alternativeto.net/feed | 每日 | ⭐⭐⭐⭐ |
| **Productivity Tools** | GitHub | https://github.com/topics/productivity | 每周 | ⭐⭐⭐ |
| **Awesome Selfhosted** | GitHub | https://github.com/awesome-selfhosted/awesome-selfhosted | 每月 | ⭐⭐⭐⭐⭐ |
| **MakeUseOf** | RSS | https://www.makeuseof.com/feed | 每日 | ⭐⭐⭐ |
| **Lifehacker** | RSS | https://lifehacker.com/rss | 每日 | ⭐⭐⭐ |

---

## 🔍 通用验证原则

### 三层验证框架

**第一层：来源验证**
- ✅ 官方/学术机构 > 知名媒体 > 个人
- ✅ 一手信息 > 二手解读
- ✅ 有署名 > 匿名

**第二层：内容验证**
- ✅ 有数据/证据 > 纯观点
- ✅ 逻辑自洽 > 矛盾冲突
- ✅ 可追溯 > 无法查证

**第三层：交叉验证**
- ✅ 多个独立源确认
- ✅ 不同立场的媒体都报道
- ✅ 历史信息一致

---

**更新日期**：2026-02-03  
**下次审查**：每季度更新数据源质量评估
