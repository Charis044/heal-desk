import type {
  AnalyticsOverview,
  GrowthPoint,
} from "./analytics-contract"

const MOCK_OVERVIEW: AnalyticsOverview = {
  summary:
    "你似乎正在从“先把感受放到一边”，慢慢走向“先看见它，再决定如何回应”。",
  stats: {
    journal_count: 7,
    review_count: 3,
    chat_count: 5,
  },
  strengths: [
    {
      label: "情绪觉察",
      observation: "记录里开始出现更具体的情绪名称，而不只是“还好”或“不好”。",
    },
    {
      label: "恢复节奏",
      observation: "疲惫时更常允许自己暂停，而不是立刻要求自己振作。",
    },
    {
      label: "边界表达",
      observation: "在几次对话中，你更直接地说出了不舒服和需要。",
    },
  ],
  patterns: [
    {
      past: "压力出现时，习惯先忽略身体与情绪信号。",
      now: "会先停下来辨认：我是在焦虑、疲惫，还是生气。",
    },
    {
      past: "一次没做好时，容易把它理解成长期失败。",
      now: "开始把事件和自我评价分开，给下一次尝试留出空间。",
    },
    {
      past: "遇到冲突后反复回想，却很少表达真实需要。",
      now: "仍会犹豫，但已经出现更清楚、具体的表达。",
    },
  ],
  chat_emotions: [
    { emotion: "anxious", count: 6 },
    { emotion: "tired", count: 4 },
    { emotion: "calm", count: 3 },
    { emotion: "hopeful", count: 2 },
    { emotion: "lost", count: 2 },
  ],
}

const MOCK_GROWTH: GrowthPoint[] = [
  { date: "2026-06-12", score: 48 },
  { date: "2026-06-25", score: 52 },
  { date: "2026-07-08", score: 50 },
  { date: "2026-07-22", score: 57 },
  { date: "2026-08-03", score: 61 },
  { date: "2026-08-16", score: 66 },
]

/**
 * Mock boundary for future GET /api/analytics/overview.
 * Replace only this service implementation when the backend is ready.
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  return Promise.resolve(MOCK_OVERVIEW)
}

/**
 * Mock boundary for future GET /api/analytics/growth.
 * Scores are display-only mock values; no scoring algorithm exists here.
 */
export async function getAnalyticsGrowth(): Promise<GrowthPoint[]> {
  return Promise.resolve(MOCK_GROWTH)
}
