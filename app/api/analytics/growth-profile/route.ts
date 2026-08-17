import { loadInsightsSnapshot } from "@/lib/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/analytics/growth-profile —— 返回左栏快照中的画像 */
export async function GET() {
  const snapshot = await loadInsightsSnapshot();
  if (!snapshot) {
    return NextResponse.json({
      strengths: [],
      patterns: [],
      growth_areas: [],
      communication_style: "",
    });
  }
  return NextResponse.json(snapshot.profile);
}
