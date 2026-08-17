import { buildGrowthProfile } from "@/lib/growthProfile";
import { loadEntries, loadProfile } from "@/lib/storage";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs），强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/analytics/growth-profile —— 我的成长画像
//
// AI 基于历史日记自动总结「正在发生的变化」：
// - strengths：3 个以内的动态发现（能力标签 + 一句观察）
// - patterns：1-3 个「过去 → 现在」的行为模式变化
// - growth_areas：正在形成/增强的能力标签
// - communication_style：来自 support_preference（弱上下文）
//
// 不是人格测试，不做正向强行解释。
// ============================================================
export async function GET() {
  const entries = await loadEntries();
  const profile = await loadProfile();
  const result = buildGrowthProfile(
    entries,
    profile?.support_preference ?? null
  );
  return NextResponse.json(result);
}
