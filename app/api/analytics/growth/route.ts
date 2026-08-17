import { loadEntries } from "@/lib/storage";
import { localDateKey } from "@/lib/date";
import type { GrowthResponse } from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs），强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/analytics/growth —— 韧性变化曲线数据
//
// 口径透明：不再偷偷剔除 0 分记录。做了三问复盘的日子给出平均分
// （reflected=true）；只写了记录但没复盘的日子 score=0 且 reflected=false，
// 前端用空心点标注「未复盘」，让用户看到曲线为什么有断点。
// 同一天多条复盘记录取平均分（整数）。
// ============================================================
export async function GET() {
  const entries = await loadEntries();

  const byDate = new Map<string, { scores: number[]; reflected: boolean }>();
  for (const e of entries) {
    const date = localDateKey(e.created_at);
    const cur = byDate.get(date) ?? { scores: [], reflected: false };
    if (e.resilience_score && e.resilience_score > 0) {
      cur.scores.push(e.resilience_score);
      cur.reflected = true;
    }
    byDate.set(date, cur);
  }

  const items = [...byDate.entries()]
    .map(([date, v]) => ({
      date,
      score: v.reflected
        ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length)
        : 0,
      reflected: v.reflected,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const result: GrowthResponse = { items };
  return NextResponse.json(result);
}
