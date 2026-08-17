import { loadEntries, saveEntries } from "@/lib/storage";
import {
  buildGrowthFindings,
  buildReflectionResponse,
} from "@/lib/reflection";
import { computeScoreDetail, type GrowthHistory } from "@/lib/scores";
import type { DiaryEntry, UpdateDiaryInput } from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs），强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/diary/:id —— 获取单条完整记录
// 返回完整字段（含 lesson/next_action/growth_evidence/ai_response）。
// ============================================================
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entries = await loadEntries();
  const entry = entries.find((e) => e.id === id);

  if (!entry) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(entry);
}

// ============================================================
// PATCH /api/diary/:id —— 补做三问 / 编辑记录（content、emotion）
//
// 字段按需传，未传字段保持原值（用 !== undefined 判断，允许显式置空）。
// 补做三问 / 编辑后，后端重新计算 resilience_score / ai_response / growth_insight / growth_area。
// ============================================================
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: UpdateDiaryInput;
  try {
    body = (await req.json()) as UpdateDiaryInput;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const entries = await loadEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const current = entries[idx];

  // 合并：未传字段保留原值（允许把三问显式清空）
  const lesson = body.lesson !== undefined ? body.lesson : current.lesson;
  const next_action =
    body.next_action !== undefined ? body.next_action : current.next_action;
  const growth_evidence =
    body.growth_evidence !== undefined
      ? body.growth_evidence
      : current.growth_evidence;
  const content = body.content !== undefined ? body.content : current.content;
  const emotion = body.emotion !== undefined ? body.emotion : current.emotion;

  const input = { lesson, next_action, growth_evidence };

  // 历史对比：用「除当前这条之外」的记录的 emotion
  const others = entries.filter((e) => e.id !== id);
  const historyEmotions = others.map((e) => e.emotion);
  const findings = buildGrowthFindings(emotion, input, historyEmotions);

  const history: GrowthHistory = {
    growthAreas: others
      .map((e) => e.growth_area)
      .filter((a): a is string => !!a),
    hasHistory: others.length > 0,
  };
  // 补做三问 / 编辑后重算：这里没有 LLM 参与，统一用规则版（含理由，标注「估算值」）
  const scoreDetail = computeScoreDetail(
    {
      emotion,
      content,
      lesson,
      next_action,
      growth_evidence,
      growth_insight: findings.growth_insight,
      growth_area: findings.growth_area,
    },
    history
  );
  const scores = scoreDetail.scores;

  const updated: DiaryEntry = {
    ...current,
    emotion,
    content,
    lesson,
    next_action,
    growth_evidence,
    resilience_score: scores.resilience,
    reflection_score: scores.reflection,
    action_score: scores.action,
    growth_score: scores.growth,
    ai_response: buildReflectionResponse(emotion, input),
    growth_insight: findings.growth_insight,
    growth_area: findings.growth_area,
    score_source: scoreDetail.source,
    score_reasons: scoreDetail.reasons,
  };

  entries[idx] = updated;
  await saveEntries(entries);

  return NextResponse.json(updated);
}

// ============================================================
// DELETE /api/diary/:id —— 软删除一条记录（进回收站，30 天后自动清理）
// 带 ?permanent=1 时彻底删除（从数据中移除，不可恢复）。
// ============================================================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const permanent = new URL(req.url).searchParams.get("permanent") === "1";
  const entries = await loadEntries();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (permanent) {
    entries.splice(idx, 1); // 彻底删除
  } else {
    entries[idx].deleted_at = new Date().toISOString(); // 软删除：进回收站
  }
  await saveEntries(entries);
  return NextResponse.json({ ok: true });
}