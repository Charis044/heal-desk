export const ANALYTICS_ENDPOINTS = {
  overview: "/api/analytics/overview",
  growth: "/api/analytics/growth",
} as const

export type AnalyticsStats = {
  journal_count: number
  review_count: number
  chat_count: number
}

export type AnalyticsStrength = {
  label: string
  observation: string
}

export type AnalyticsPattern = {
  past: string
  now: string
}

export type ChatEmotionStat = {
  emotion: string
  count: number
}

export type AnalyticsOverview = {
  summary: string
  stats: AnalyticsStats
  strengths: AnalyticsStrength[]
  patterns: AnalyticsPattern[]
  chat_emotions: ChatEmotionStat[]
}

export type GrowthPoint = {
  date: string
  score: number
}
