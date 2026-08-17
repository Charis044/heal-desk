import type { ReflectRequest, ReflectionQuestionKey } from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时，强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// POST /api/ai/reflect —— AI 起头（三问复盘的「让 AI 帮我想想」）
//
// 关键原则：AI 只给「商量语气的草稿」，帮用户起个头，
// 绝不替他下结论、绝不代答——用户点「采纳」后才写入数据。
// 若事件里看不出成长，就诚实说「这次可能还看不出，也没关系」，
// 不硬编（反脆弱 ≠ 所有坏事都有好结果）。
//
// 前端只请求自己的 Backend API；AI_API_KEY 仅由服务端读取。
// 遵守「立刻停下」：未配置 / 调用失败返回 5xx，不用本地 mock 兜底。
// ============================================================

const QUESTION_LABELS: Record<ReflectionQuestionKey, string> = {
  lesson: "这件事教会了我什么",
  next_action: "如果类似情况再发生，我会怎么做不同",
  growth_evidence: "我现在比以前强在哪里",
};

const AI_TIMEOUT_MS = 25000;

export async function POST(req: Request) {
  let body: ReflectRequest;
  try {
    body = (await req.json()) as ReflectRequest;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { emotion, content, question } = body ?? {};
  if (!emotion || !content?.trim() || !question) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  if (!(question in QUESTION_LABELS)) {
    return NextResponse.json({ error: "invalid question" }, { status: 400 });
  }

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
  }

  const questionLabel = QUESTION_LABELS[question];

  const SYSTEM_PROMPT = `你是一个温柔的复盘助手。用户在写日记，正在回答一个问题：「${questionLabel}」。
你的任务是帮用户起个头——给出一句「商量语气」的草稿建议，而不是替他下结论。
要求：
1. 只基于他写的事件，不编造经历、不夸大。
2. 用商量的口吻，结尾可以带"这样想对吗？"或"可以改"，让人感觉可以修改。
3. 只输出那一句话本身，不要加"你可以这样写""建议你写"之类的引导，不要解释。
4. 如果从事件里看不出成长或答案，就诚实地说"这次可能还看不出，也没关系"，不要硬编。
5. 不要说教、不给鸡汤、不评判这个人。`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const upstream = baseUrl.replace(/\/+$/, "");
    const resp = await fetch(`${upstream}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `情绪：${emotion}\n他写的事：${content}\n当前问题：${questionLabel}`,
          },
        ],
        temperature: 0.9,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: "AI_UPSTREAM_ERROR", detail: detail.slice(0, 300) },
        { status: 502 }
      );
    }
    const data = await resp.json();
    const suggestion: string =
      (data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content) ||
      "";
    if (!suggestion.trim()) {
      return NextResponse.json({ error: "AI_EMPTY_OUTPUT" }, { status: 502 });
    }
    // 清理 LLM 偶尔带出的首尾引号（英文/中文引号）
    const cleaned = suggestion
      .trim()
      .replace(/^["'「『“”]+/, "")
      .replace(/["'」』“”]+$/, "")
      .trim();
    return NextResponse.json({ suggestion: cleaned });
  } catch (e) {
    clearTimeout(timer);
    return NextResponse.json({ error: "AI_REQUEST_FAILED" }, { status: 504 });
  }
}
