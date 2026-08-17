import type { ReflectRequest, ReflectionQuestionKey } from "@/lib/types";
import { aiChatCompletion, aiErrorResponse } from "@/lib/ai-upstream";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUESTION_LABELS: Record<ReflectionQuestionKey, string> = {
  lesson: "这件事教会了我什么",
  next_action: "如果类似情况再发生，我会怎么做不同",
  growth_evidence: "我现在比以前强在哪里",
};

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

  const questionLabel = QUESTION_LABELS[question];
  const systemPrompt = `你是一个温柔的复盘助手。用户在写日记，正在回答一个问题：「${questionLabel}」。
你的任务是帮用户起个头——给出一句「商量语气」的草稿建议，而不是替他下结论。
要求：
1. 只基于他写的事件，不编造经历、不夸大。
2. 用商量的口吻，结尾可以带"这样想对吗？"或"可以改"，让人感觉可以修改。
3. 只输出那一句话本身，不要加"你可以这样写""建议你写"之类的引导，不要解释。
4. 如果从事件里看不出成长或答案，就诚实地说"这次可能还看不出，也没关系"，不要硬编。
5. 不要说教、不给鸡汤、不评判这个人。`;

  const result = await aiChatCompletion({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `情绪：${emotion}\n他写的事：${content}\n当前问题：${questionLabel}`,
      },
    ],
    temperature: 0.9,
    maxTokens: 512,
    timeoutMs: 25000,
  });
  if (!result.ok) return aiErrorResponse(result);

  const cleaned = result.content
    .replace(/^["'「『“”]+/, "")
    .replace(/["'」』“”]+$/, "")
    .trim();
  return NextResponse.json({ suggestion: cleaned });
}
