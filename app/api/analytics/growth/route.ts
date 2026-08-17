import { loadInsightsSnapshot } from "@/lib/storage";
import type { GrowthResponse } from "@/lib/types";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/analytics/growth —— 返回左栏快照中的折线（未刷新则为空） */
export async function GET() {
  const snapshot = await loadInsightsSnapshot();
  const result: GrowthResponse = { items: snapshot?.growth ?? [] };
  return NextResponse.json(result);
}
