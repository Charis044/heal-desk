import {
  clearProfile,
  cleanupTrash,
  loadEntries,
  saveChats,
  saveEntries,
} from "@/lib/storage";
import {
  buildGrowthFindings,
  buildReflectionResponse,
} from "@/lib/reflection";
import { computeScoreDetail, type GrowthHistory } from "@/lib/scores";
import type {
  CreateDiaryInput,
  DiaryEntry,
  DiarySummary,
  ScoreDetail,
} from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs 做文件持久化），且强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ============================================================
// GET /api/diary —— 拉取日记列表（按时间倒序，仅摘要）
// 支持 ?limit=20 & ?offset=0 & ?q=关键词 & ?emotion=情绪key & ?trash=1
// trash=1 时只返回回收站里的记录（软删除），否则过滤掉已删除项。
// 列表不返回三问（lesson/next_action/growth_evidence）与 ai_response。
// ============================================================
export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");
  const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const emotion = url.searchParams.get("emotion")?.trim() ?? "";
  const trash = url.searchParams.get("trash") === "1";

  const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : undefined;
  const offset = offsetParam ? Math.max(0, parseInt(offsetParam, 10)) : 0;

  await cleanupTrash(); // 惰性清理：把超过 30 天的软删除项彻底删掉
  let entries = await loadEntries();

  // 软删除过滤：默认只返回未删除的；trash=1 时只返回回收站里的
  entries = trash
    ? entries.filter((e) => !!e.deleted_at)
    : entries.filter((e) => !e.deleted_at);

  // 情绪筛选
  if (emotion) {
    entries = entries.filter((e) => e.emotion === emotion);
  }
  // 关键词搜索（匹配内容 + 三问 + AI 回应）
  if (q) {
    entries = entries.filter((e) =>
      [e.content, e.lesson, e.next_action, e.growth_evidence, e.ai_response]
        .some((t) => (t ?? "").toLowerCase().includes(q))
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const page = limit
    ? sorted.slice(offset, offset + limit)
    : sorted.slice(offset);

  const summaries: DiarySummary[] = page.map((e) => ({
    id: e.id,
    emotion: e.emotion,
    content: e.content,
    resilience_score: e.resilience_score,
    has_reflection: !!(e.lesson || e.next_action || e.growth_evidence),
    created_at: e.created_at,
    deleted_at: e.deleted_at ?? null,
  }));

  return NextResponse.json(summaries);
}

// ============================================================
// POST /api/diary —— 创建日记
// 后端生成 resilience_score 与 ai_response，前端不传。
// ============================================================
export async function POST(req: Request) {
  let body: CreateDiaryInput;
  try {
    body = (await req.json()) as CreateDiaryInput;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!body?.content || !body?.emotion) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // 先读历史（保存前的记录），用于生成「AI 发现」的历史对比 + 成长指数
  const entries = await loadEntries();
  const historyEmotions = entries.map((e) => e.emotion);
  const findings = buildGrowthFindings(body.emotion, body, historyEmotions);

  const history: GrowthHistory = {
    growthAreas: entries
      .map((e) => e.growth_area)
      .filter((a): a is string => !!a),
    hasHistory: entries.length > 0,
  };

  const scoreInput = {
    emotion: body.emotion,
    content: body.content,
    lesson: body.lesson ?? "",
    next_action: body.next_action ?? "",
    growth_evidence: body.growth_evidence ?? "",
    growth_insight: findings.growth_insight,
    growth_area: findings.growth_area,
  };

  // 评分：前端若传了「AI 打分 + 理由」则直接采用；否则用规则版（含理由，标注「估算值」）
  const hasAiScores = !!(
    body.scores &&
    body.score_reasons &&
    body.score_source === "llm"
  );
  const scoreDetail: ScoreDetail = hasAiScores
    ? {
        scores: body.scores as ScoreDetail["scores"],
        source: "llm",
        reasons: body.score_reasons as ScoreDetail["reasons"],
        note: "",
      }
    : computeScoreDetail(scoreInput, history);
  const scores = scoreDetail.scores;

  const entry: DiaryEntry = {
    id: uid(),
    emotion: body.emotion,
    content: body.content,
    lesson: body.lesson ?? "",
    next_action: body.next_action ?? "",
    growth_evidence: body.growth_evidence ?? "",
    resilience_score: scores.resilience,
    reflection_score: scores.reflection,
    action_score: scores.action,
    growth_score: scores.growth,
    ai_response: body.ai_response ?? buildReflectionResponse(body.emotion, body),
    growth_insight: findings.growth_insight,
    growth_area: findings.growth_area,
    score_source: scoreDetail.source,
    score_reasons: scoreDetail.reasons,
    created_at: new Date().toISOString(),
  };

  entries.unshift(entry);
  await saveEntries(entries);

  return NextResponse.json(entry, { status: 201 });
}

// ============================================================
// DELETE /api/diary —— 清空全部数据（日记 + 聊天 + 画像）
//
// 前端调用前会做二次确认 + 导出备份提醒；本端点一次性清空
// entries.json / chats.json / profile.json（画像写空占位，等效于
// 回到「未 onboarding」状态）。不可逆，谨慎调用。
// ============================================================
export async function DELETE() {
  await saveEntries([]);
  await saveChats([]);
  await clearProfile();
  return NextResponse.json({ ok: true });
}
