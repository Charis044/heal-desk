import { buildHistoryDigest } from "@/lib/historyContext";
import { loadEntries } from "@/lib/storage";
import type { ChatMessage, ChatRequest } from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时，强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// POST /api/ai/chat —— 多轮对话（「今天发生了什么」聊天窗口）
//
// AI 前期是一个「心理咨询师」式的倾听者：先接住情绪、被动，
// 只在用户愿意说时才慢慢深入；不刻意追问三问、不逐条提问。
//
// 前端只请求自己的 Backend API；AI_API_KEY 仅由服务端读取。
// 遵守「立刻停下」：未配置 / 调用失败返回 5xx，不用本地 mock 兜底。
// ============================================================

const SYSTEM_PROMPT = `你是一个愿意听我说话的朋友，我们正在聊我今天发生的事。

原则：
1. 像朋友一样自然说话：口语、短句、真诚，一两句话就好，别长篇大论。
2. 先接住我的情绪，多用陈述句共情（比如"那确实挺难受的"），别急着分析、讲道理、给建议、下结论。
3. 我倾诉的时候你就听着、应着，让我有被理解的感觉；少问问题，别像记者采访那样一个问题接一个问题。偶尔轻轻问一句"后来呢"就好。
4. 绝对不要用括号写动作或心理描写（比如"（轻轻点头）""（叹了口气）"），直接说话就行。
5. 不评价我、不给我贴标签、不说"你应该"、不教我做人，也不摆出一副开导我的架势。
6. 语气要暖，像朋友深夜聊天那样，别冷冰冰、别像在审问。`;

const AI_TIMEOUT_MS = 30000;

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const opening = body?.opening === true;
  const messages = body?.messages;
  if (!opening && (!Array.isArray(messages) || messages.length === 0)) {
    return NextResponse.json({ error: "missing messages" }, { status: 400 });
  }

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    return NextResponse.json({ error: "AI_NOT_CONFIGURED" }, { status: 503 });
  }

  // 转成 LLM 消息格式（system + 历史 + 用户最新消息）
  const history: ChatMessage[] = opening ? [] : messages.slice(0, -1);
  const latest: ChatMessage = opening
    ? {
        role: "user",
        content:
          "现在开始这段对话吧，自然地跟我打个招呼，接住我此刻的状态，语气暖一点，别提问。",
      }
    : messages[messages.length - 1];

  // 纸条上下文：用户写在「今天发生了什么」里的内容，作为聊天的背景
  const context = body?.context?.trim();

  // 过往纸堆：让 AI 记得用户过去写下的经历（最近的优先，超预算就丢旧的）
  const historyDigest = buildHistoryDigest(await loadEntries());

  const blocks = [SYSTEM_PROMPT];
  if (context) {
    blocks.push(
      `另外，用户在「今天发生了什么」的纸条上写下了这些（作为你聊天的背景，自然地围绕它聊，但不要照本宣科复述，也不要刻意逐条追问）：\n${context}`
    );
  }
  if (historyDigest) {
    blocks.push(
      `以下是你陪 ta 记录过的「过往纸堆」（从最近到更早，可能只保留了最近的一部分）。聊的时候可以自然地呼应它们、让 ta 感到被记得（比如"你上次也说过类似的事"），但不要逐条复述、不要像翻旧账一样挨个追问：\n${historyDigest}`
    );
  }
  const systemContent = blocks.join("\n\n");

  const llmMessages = [
    { role: "system", content: systemContent },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: latest.content },
  ];

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
        messages: llmMessages,
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
    const reply: string =
      (data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content) ||
      "";
    if (!reply.trim()) {
      return NextResponse.json({ error: "AI_EMPTY_OUTPUT" }, { status: 502 });
    }
    return NextResponse.json({ reply: reply.trim() });
  } catch (e) {
    clearTimeout(timer);
    return NextResponse.json({ error: "AI_REQUEST_FAILED" }, { status: 504 });
  }
}
