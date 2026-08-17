# 前后端合并说明（heal-desk × WindFall）

本次合并把后端 **WindFall**（`https://github.com/XiLYue/WindFall`）的 API 与逻辑层并入前端
**heal-desk**（本仓库），并打通关键数据链路。**所有界面/交互以本仓库（前端）为准。**

## 合并了什么

### 1. 后端 API 路由 → `app/api/**`（纯增量，新增 14 个端点）
- `POST /api/ai/chat` — 多轮对话（情绪树洞）
- `POST /api/ai/chat/summary` — 把整段对话归纳成「情绪 + 三问 + 四指数」草稿
- `POST /api/ai/reflect` — 三问复盘的「让 AI 帮我想想」
- `GET /api/analytics/overview` · `growth` · `growth-profile` · `emotions`
- `GET/POST/DELETE /api/diary` · `GET/PATCH/DELETE /api/diary/[id]` · `POST /api/diary/[id]/restore`
- `GET/POST /api/chats` · `GET/DELETE /api/chats/[id]`
- `GET /api/export` · `GET/POST /api/profile`

### 2. 后端逻辑层 → `lib/**`（新增类型/存储/评分/画像等）
`types.ts`、`storage.ts`（fs 文件存储）、`scores.ts`（四指数规则评分）、`reflection.ts`、
`growthProfile.ts`、`overview.ts`、`emotions.ts`、`emotionAnalysis.ts`、`historyContext.ts`、
`localSummary.ts`、`date.ts`、`onboarding.ts`、`api.ts`。

> 未引入后端的 `lib/audio.ts` 与其 `components/**`、`app/page.tsx`、`app/history/**`——
> 那些是 WindFall 自带的参考前端，按「前端优先」原则不覆盖本仓库界面。

### 3. 新增衔接文件（本仓库独有）
- `lib/emotion-map.ts` — 情绪 key 边界转换：前端 `lost` ↔ 后端 `confused`（其余 11 种一致）
- `lib/backend-bridge.ts` — 把前端打字机记录镜像到后端日记仓（尽力而为，失败不影响本地）
- `components/analysis/analytics-service.ts` — 分析页的真实数据源 + 空态兜底

### 4. 前端接入点（改动极小）
- `components/analysis/analysis-page.tsx` — 数据源从 mock 换成真实后端
- `components/scene/resilience-scene.tsx` — 保存日记时同步到后端
- `app/ai-analysis/page.tsx` — 占位页替换为真实 AI 聊天 + 「收进纸堆」保存

## Next 16 兼容修复
WindFall 基于 Next 14，本仓库是 Next 16（`params` 已变为 Promise）。已将
`/api/diary/[id]`、`/api/diary/[id]/restore`、`/api/chats/[id]` 三个动态路由的
`params` 改为异步解构（`const { id } = await params`）。

## 运行前提
- 后端 AI 能力需要环境变量（未配置时 AI 端点返回 503，前端有友好降级提示）：
  - `AI_BASE_URL`（OpenAI 兼容基址）
  - `AI_API_KEY`
  - `AI_MODEL`
- 日记/聊天/画像用 **文件存储**（`data/entries.json` 等，已 gitignore）。
  本地 `next dev` / `next start` 可用；**部署到 Vercel 等 Serverless 平台会丢数据**，
  上线前需换成 Vercel KV / Neon / Supabase（见改进建议书 P0）。

## 尚未完成（下一步）
- 三问复盘的独立 UI（后端 `/api/ai/reflect` + `summary` 已备好，可参考 WindFall 的 `ReflectionFlow.tsx`）
- 日记同步目前是「每次保存 POST 一条新镜像」，编辑旧记录会产生重复镜像（可给 `JournalRecord`
  挂 `backendId` 改 PATCH）
- 图片压缩、字体子集化、移动端布局、用户隔离、DB 迁移（见改进建议书）

## 回滚
合并前的纯前端备份在 commit `b967d8b`。如需撤销本次合并：
`git reset --hard b967d8b`