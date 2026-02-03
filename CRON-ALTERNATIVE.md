# 外部 Cron 服务替代方案

如果 Vercel Cron 不可靠，可以使用外部服务：

## 方案 1: cron-job.org (推荐)

1. 注册 https://cron-job.org
2. 创建两个任务：

**数据采集任务**:
- URL: `https://info-radar-khaki.vercel.app/api/collect`
- Schedule: `0 3 * * *` (UTC 03:00 / 北京时间 11:00)
- HTTP Method: GET
- Headers: `Authorization: Bearer info-radar-cron-secret-2026`

**推送任务**:
- URL: `https://info-radar-khaki.vercel.app/api/push`
- Schedule: `0 4 * * *` (UTC 04:00 / 北京时间 12:00)
- HTTP Method: GET
- Headers: `Authorization: Bearer info-radar-cron-secret-2026`

## 方案 2: GitHub Actions

创建 `.github/workflows/daily-push.yml`:

```yaml
name: Daily Info Push

on:
  schedule:
    - cron: '0 3 * * *'  # 采集
    - cron: '0 4 * * *'  # 推送

jobs:
  collect:
    if: github.event.schedule == '0 3 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Collect
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/collect" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
  
  push:
    if: github.event.schedule == '0 4 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Push
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/push" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

需要设置 GitHub Secrets:
- APP_URL: `https://info-radar-khaki.vercel.app`
- CRON_SECRET: `info-radar-cron-secret-2026`

## 方案 3: 使用 Clawdbot Cron

在 Clawdbot 中设置定时任务：
```bash
clawdbot cron add --schedule "0 4 * * *" --text "触发 Info Radar 推送"
```
