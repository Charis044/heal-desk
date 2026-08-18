import { loadEntries } from "@/lib/storage";
import { getEmotion } from "@/lib/emotions";
import { localDateKey } from "@/lib/date";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs），强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/export?format=json|md —— 导出全部日记
// 返回完整字段（含三问、四指数、AI 回应），按时间倒序。
// 通过 Content-Disposition 触发浏览器下载。
// ============================================================

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();

  const entries = await loadEntries();
  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (format === "md") {
    const md = sorted
      .map((e) => {
        const emo = getEmotion(e.emotion);
        const lines: string[] = [
          `## ${localDateKey(e.created_at)} · ${emo.label}`,
          ``,
          e.content,
        ];
        if (e.lesson) lines.push(``, `**我学到了什么**：${e.lesson}`);
        if (e.next_action) lines.push(``, `**下次怎么做**：${e.next_action}`);
        if (e.growth_evidence)
          lines.push(``, `**我比以前强在哪里**：${e.growth_evidence}`);
        if (e.ai_response) lines.push(``, `> ${e.ai_response}`);
        lines.push(``, `---`);
        return lines.join("\n");
      })
      .join("\n\n");

    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="ping-i-cabin-entries.md"`,
      },
    });
  }

  // 默认 JSON
  return new NextResponse(JSON.stringify(sorted, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ping-i-cabin-entries.json"`,
    },
  });
}
