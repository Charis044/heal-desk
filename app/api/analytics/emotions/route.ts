import { loadEntries } from "@/lib/storage";
import { localDateKey } from "@/lib/date";
import type { EmotionKey, EmotionsResponse } from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs），强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

// ============================================================
// GET /api/analytics/emotions —— 最近 30 天情绪变化（轻量）
// 每个有记录的日期取当天最新一条的情绪，按日期升序。
// ============================================================
export async function GET() {
  const entries = await loadEntries();

  const cutoff = Date.now() - 29 * DAY_MS;

  // 按日期聚合：取当天最新（created_at 最大）那条的情绪
  const byDate = new Map<string, { emotion: EmotionKey; t: number }>();
  for (const e of entries) {
    const t = new Date(e.created_at).getTime();
    if (t < cutoff) continue;
    const date = localDateKey(e.created_at);
    const cur = byDate.get(date);
    if (!cur || t > cur.t) {
      byDate.set(date, { emotion: e.emotion, t });
    }
  }

  const items = [...byDate.entries()]
    .map(([date, v]) => ({ date, emotion: v.emotion }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const result: EmotionsResponse = { items };
  return NextResponse.json(result);
}
