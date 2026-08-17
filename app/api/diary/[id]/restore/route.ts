import { loadEntries, saveEntries } from "@/lib/storage";
import { NextResponse } from "next/server";

// 使用 Node 运行时，强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// POST /api/diary/:id/restore —— 从回收站恢复一条记录
// 清空 deleted_at 标记，记录回到正常列表。
// ============================================================
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entries = await loadEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  delete entries[idx].deleted_at;
  await saveEntries(entries);
  return NextResponse.json(entries[idx]);
}