import { getGrowth, getOverview } from "@/lib/api"
import { toFrontendEmotion } from "@/lib/emotion-map"
import type { AnalyticsOverview, GrowthPoint } from "./analytics-contract"

/**
 * 分析页数据源：读取真实后端（/api/analytics/overview、/api/analytics/growth），
 * 并把后端契约映射成前端 `analytics-contract` 的形状（前端 UI 完全不用改）。
 *
 * 后端不可用时返回诚实的空态，而不是编造的 mock 数据。
 */

const EMPTY_OVERVIEW: AnalyticsOverview = {
  summary: "这里还没有记录。写下第一篇，改变会慢慢显出来。",
  stats: { journal_count: 0, review_count: 0, chat_count: 0 },
  strengths: [],
  patterns: [],
  chat_emotions: [],
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  try {
    const o = await getOverview()
    return {
      summary: o.summary,
      stats: {
        journal_count: o.entry_count,
        review_count: o.reflected_count,
        chat_count: o.chat_count,
      },
      strengths: o.strengths.map((s) => ({
        label: s.label,
        observation: s.note,
      })),
      // 后端 PatternShift { trigger, before[], after[], summary } → 前端 { past, now }
      patterns: o.patterns.map((p) => ({
        past: p.before.join(" → "),
        now: p.after.join(" → "),
      })),
      chat_emotions: o.chat_emotions.map((e) => ({
        emotion: toFrontendEmotion(e.emotion),
        count: e.count,
      })),
    }
  } catch {
    return EMPTY_OVERVIEW
  }
}

export async function getAnalyticsGrowth(): Promise<GrowthPoint[]> {
  try {
    const g = await getGrowth()
    return g.items.map((i) => ({ date: i.date, score: i.score }))
  } catch {
    return []
  }
}