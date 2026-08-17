import { localDateKey } from "./date";
import { buildGrowthProfile } from "./growthProfile";
import type {
  DiaryEntry,
  GrowthPoint,
  InsightsSnapshot,
  SupportPreferenceKey,
} from "./types";

/** 会进入总结 / 图表的笔记：未进回收站、未划掉 */
export function isCountable(entry: DiaryEntry): boolean {
  return !entry.deleted_at && !entry.excluded_from_insights;
}

export function countableEntries(entries: DiaryEntry[]): DiaryEntry[] {
  return entries.filter(isCountable);
}

/** 一篇笔记一个点，按时间正序 */
export function buildGrowthPoints(entries: DiaryEntry[]): GrowthPoint[] {
  return [...entries]
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((e) => ({
      id: e.id,
      date: localDateKey(e.created_at),
      score: e.resilience_score ?? 0,
      reflected: true,
    }));
}

export function pendingCount(
  entries: DiaryEntry[],
  snapshot: InsightsSnapshot | null,
): number {
  const countable = countableEntries(entries);
  if (!snapshot) return countable.length;
  const included = new Set(snapshot.included_ids);
  return countable.filter((e) => !included.has(e.id)).length;
}

/** 新增导致总数第一次落到新的 7 的倍数时才自动刷新 */
export function shouldAutoRefresh(
  countableCount: number,
  snapshot: InsightsSnapshot | null,
): boolean {
  if (countableCount === 0 || countableCount % 7 !== 0) return false;
  const prev = snapshot?.included_count ?? 0;
  return countableCount > prev;
}

export function buildInsightsSnapshot(
  entries: DiaryEntry[],
  supportPreference: SupportPreferenceKey | null,
): InsightsSnapshot {
  const countable = countableEntries(entries);
  return {
    included_ids: countable.map((e) => e.id),
    included_count: countable.length,
    computed_at: new Date().toISOString(),
    profile: buildGrowthProfile(countable, supportPreference),
    growth: buildGrowthPoints(countable),
  };
}
