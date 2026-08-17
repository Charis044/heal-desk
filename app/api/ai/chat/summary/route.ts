import type {
  ChatSummaryRequest,
  ChatSummaryResponse,
  EmotionKey,
  ScoreReasons,
  Scores,
} from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时，强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// POST /api/ai/chat/summary —— 把整段对话归纳成「今日记录 + 三问」草稿
//
// AI 从对话里整理出：情绪、发生了什么、以及可能提到的三问。
// 关键：对话里没提到的三问，留空字符串，绝不编造、不强行提炼。
//
// 遵守「立刻停下」：未配置 / 调用失败返回 5xx，不用本地 mock 兜底。
// ============================================================

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

const SYSTEM_PROMPT = `下面是一段我和朋友的聊天。我今天发生了什么，已经写在纸条上（见最后的「纸条内容」，如果有的话）。

请你帮我从这段聊天里总结，用第一人称、像我自己写的那样：
- lesson：这件事教会了我什么
- next_action：下次我会怎么做不同
- growth_evidence：我现在比以前强在哪里
- ai_response：一句像朋友那样的回应（接住我的情绪，暖一点，一两句话，不要讲道理、不要贴标签、不要强行往积极上拉）
- scores：四个 0-100 的整数，衡量的是「这一次经历中我做了什么」，不是评价我这个人：
  · resilience 韧性：我面对困难时有没有觉察情绪、反思、愿意行动
  · reflection 自省：我有没有理解自己（看清情绪、找原因、发现自己的模式）
  · action 行动：我有没有真正做出改变的打算或行动（越具体、越可执行分越高）
  · growth 成长：相比过去，我这次有没有进步（聊天里提到「以前…现在…」「这次不一样」等则更高）
- score_reasons：四个字段各一句「为什么是这个分」的诚实解释，说明依据了我写下的什么（或没写下什么），不要评判我这个人、不要安慰式拔高。

只输出一个 JSON 对象，不要输出任何其他文字、不要用 markdown 代码块、不要用括号写说明。格式：
{"emotion":"从 sad/angry/anxious/tired/confused/calm/happy/excited/moved/hopeful/grateful/content 中选最贴切的一个","content":"用一两句话、第一人称概括我今天发生了什么（如果下面有纸条内容，就忠实于纸条内容，不要改写）","lesson":"...","next_action":"...","growth_evidence":"...","ai_response":"...","scores":{"resilience":0,"reflection":0,"action":0,"growth":0},"score_reasons":{"resilience":"...","reflection":"...","action":"...","growth":"..."}}

要求：
1. 三个反思尽量从聊天里提炼出来——哪怕我只是一带而过、说得比较隐晦，也帮我整理成一句完整、自然、第一人称的话。
2. 但如果某一项在聊天里真的完全没提到，就填空字符串 ""，不要编造、不要强行拔高。
3. emotion 要贴合我的真实表达；不要因为内容负面就强行写积极。
4. scores 要诚实：我没有表达反思/行动/成长，对应分就给低，不要为了安慰我而给高分。
5. score_reasons 要具体、诚实，指出是「写下了什么」还是「没写下什么」，不要写空话。`;

const AI_TIMEOUT_MS = 30000;

/** 从 LLM 输出里解析 JSON（兼容带 markdown 代码块或多余文字的情况） */
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

/** 校验并规整 LLM 输出的四指数（0-100 整数，非法则返回 undefined 走规则版兜底） */
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

/** 校验并规整 LLM 输出的评分理由（四句非空字符串；缺项/空则返回 undefined，前端回退到规则版理由） */
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

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
  }

  const context = body?.context?.trim();
  const transcript =
    messages
      .map((m) => `${m.role === "assistant" ? "咨询师" : "用户"}：${m.content}`)
      .join("\n") +
    (context ? `\n\n纸条内容（用户今天发生了什么）：${context}` : "");

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
          { role: "user", content: transcript },
        ],
        temperature: 0.3,
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
    const raw: string =
      (data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content) ||
      "";
    const parsed = parseSummary(raw);
    if (!parsed) {
      return NextResponse.json(
        { error: "AI_INVALID_OUTPUT", detail: raw.slice(0, 200) },
        { status: 502 }
      );
    }

    const emotion: EmotionKey = EMOTION_KEYS.includes(parsed.emotion as EmotionKey)
      ? (parsed.emotion as EmotionKey)
      : "calm";

    const scores = toScores(parsed.scores);
    const reasons = toReasons(parsed.score_reasons);
    // 分数必须与理由配套：只有 LLM 同时给出 scores + reasons 才采用为「AI 打分」，
    // 否则一律交给前端走规则版（分数与理由一起生成，保证一致、可解释）。
    const hasFullScores = !!(scores && reasons);

    const result: ChatSummaryResponse = {
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

    return NextResponse.json(result);
  } catch (e) {
    clearTimeout(timer);
    return NextResponse.json({ error: "AI_REQUEST_FAILED" }, { status: 504 });
  }
}
