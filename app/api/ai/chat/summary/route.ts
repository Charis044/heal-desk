import type {
  ChatSummaryRequest,
  ChatSummaryResponse,
  EmotionKey,
  ScoreReasons,
  Scores,
} from "@/lib/types";
import { aiChatCompletion, aiErrorResponse } from "@/lib/ai-upstream";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMOTION_KEYS: EmotionKey[] = [
  "sad",
  "angry",
  "anxious",
  "tired",
  "confused",
  "calm",
  "happy",
  "excited",
  "moved",
  "hopeful",
  "grateful",
  "content",
];

const SYSTEM_PROMPT = `下面是一段用户和小熊的咨询对话。请把这次对话压缩成一篇第一人称短文，像用户自己写在纸上的记录。

只输出一个 JSON 对象，不要输出任何其他文字、不要用 markdown 代码块。格式：
{"emotion":"从 sad/angry/anxious/tired/confused/calm/happy/excited/moved/hopeful/grateful/content 中选最贴切的一个","content":"一篇完整短文，概括这次咨询真正谈过的事和得到的想法"}

要求：
1. content 是一篇可以独立阅读的记录，不是条目列表，也不要写成对话实录。
2. 只写对话里出现过的内容，不要编造、不要强行提炼没说过的三问。
3. emotion 要贴合真实表达；不要因为内容负面就强行写积极。`;

function parseSummary(raw: string): Partial<ChatSummaryResponse> | null {
  try {
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? (o as Partial<ChatSummaryResponse>) : null;
  } catch {
    /* ignore */
  }
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const o = JSON.parse(m[0]);
      return o && typeof o === "object"
        ? (o as Partial<ChatSummaryResponse>)
        : null;
    } catch {
      /* ignore */
    }
  }
  return null;
}

function toScores(v: unknown): Scores | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const keys = ["resilience", "reflection", "action", "growth"] as const;
  const out = { resilience: 0, reflection: 0, action: 0, growth: 0 };
  for (const k of keys) {
    const n = o[k];
    if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
    out[k] = Math.max(0, Math.min(100, Math.round(n)));
  }
  return out;
}

function toReasons(v: unknown): ScoreReasons | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const keys = ["resilience", "reflection", "action", "growth"] as const;
  const out: Partial<Record<(typeof keys)[number], string>> = {};
  for (const k of keys) {
    const s = o[k];
    if (typeof s !== "string" || !s.trim()) return undefined;
    out[k] = s.trim();
  }
  return out as unknown as ScoreReasons;
}

export async function POST(req: Request) {
  let body: ChatSummaryRequest;
  try {
    body = (await req.json()) as ChatSummaryRequest;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "missing messages" }, { status: 400 });
  }

  const context = body?.context?.trim();
  const transcript =
    messages
      .map((m) => `${m.role === "assistant" ? "咨询师" : "用户"}：${m.content}`)
      .join("\n") +
    (context ? `\n\n纸条内容（用户今天发生了什么）：${context}` : "");

  const result = await aiChatCompletion({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ],
    temperature: 0.3,
    maxTokens: 2048,
    jsonMode: true,
  });
  if (!result.ok) return aiErrorResponse(result);

  const parsed = parseSummary(result.content);
  if (!parsed) {
    return NextResponse.json(
      { error: "AI_INVALID_OUTPUT", detail: result.content.slice(0, 200) },
      { status: 502 },
    );
  }

  const emotion: EmotionKey = EMOTION_KEYS.includes(parsed.emotion as EmotionKey)
    ? (parsed.emotion as EmotionKey)
    : "calm";

  const scores = toScores(parsed.scores);
  const reasons = toReasons(parsed.score_reasons);
  const hasFullScores = !!(scores && reasons);

  const summary: ChatSummaryResponse = {
    emotion,
    content: context || (parsed.content || "").trim(),
    lesson: (parsed.lesson || "").trim(),
    next_action: (parsed.next_action || "").trim(),
    growth_evidence: (parsed.growth_evidence || "").trim(),
    ai_response: (parsed.ai_response || "").trim(),
    scores: hasFullScores ? scores : undefined,
    score_source: hasFullScores ? "llm" : undefined,
    score_reasons: hasFullScores ? reasons : undefined,
  };

  return NextResponse.json(summary);
}
