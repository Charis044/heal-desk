import { readInsightsResponse, refreshInsightsFromDisk } from "@/lib/insightsRefresh";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/analytics/insights —— 左栏快照 + 尚未计入篇数 */
export async function GET() {
  const result = await readInsightsResponse();
  return NextResponse.json(result);
}

/** POST /api/analytics/insights —— 立刻用当前未划掉笔记重算左栏 */
export async function POST() {
  await refreshInsightsFromDisk();
  const result = await readInsightsResponse();
  return NextResponse.json(result);
}
