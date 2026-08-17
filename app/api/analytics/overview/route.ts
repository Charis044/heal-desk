import { buildOverview } from "@/lib/overview";
import { loadChats, loadEntries } from "@/lib/storage";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs），强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/analytics/overview —— 个人全方面分析
// 依据「纸堆（日记）+ 聊天记录」总结成长与改变。
// ============================================================
export async function GET() {
  const entries = await loadEntries();
  const chats = await loadChats();
  const result = buildOverview(entries, chats);
  return NextResponse.json(result);
}
