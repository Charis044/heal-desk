import type { ChatMessage, ChatRequest } from "@/lib/types";
import { aiChatCompletion, aiErrorResponse } from "@/lib/ai-upstream";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `你是韧芽房间里的小熊，专门做「针对一件具体事情」的咨询。

你可以聊的范围只有这些：某一篇记录、某一天、某几天、某段时间，或一个具体的问题。
你现在看不到用户的日记，也不要假装已经读过。

原则：
1. 如果用户还没说清楚范围（哪一篇、哪一天、哪段时间、或具体在问什么），用一两句自然地追问，请他们说具体一点。一次只问一层，不要连珠炮。
2. 一旦范围清楚了，再做详细、具体的答疑或个性化建议。紧贴他们说的那件事，不要空泛安慰，不要讲大道理。
3. 口语、短句、真诚。绝对不要用括号写动作或心理描写。不评价、不贴标签、不说「你应该」。
4. 语气要暖，像坐在书桌对面听对方把一件事说清楚。`;

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

  const history: ChatMessage[] = opening ? [] : messages.slice(0, -1);
  const latest: ChatMessage = opening
    ? {
        role: "user",
        content:
          "现在开始这段对话吧，自然地跟我打个招呼，接住我此刻的状态，语气暖一点，别提问。",
      }
    : messages[messages.length - 1];

  const context = body?.context?.trim();
  const blocks = [SYSTEM_PROMPT];
  if (context) {
    blocks.push(
      `用户主动贴上的上下文（可能是某一篇记录或一段时间的说明）。只有这段可以当背景，不要扩展成「我读过全部日记」：\n${context}`,
    );
  }

  const llmMessages = [
    { role: "system" as const, content: blocks.join("\n\n") },
    ...history.map((m) => ({
      role: (m.role === "assistant" ? "assistant" : "user") as
        | "assistant"
        | "user",
      content: m.content,
    })),
    { role: "user" as const, content: latest.content },
  ];

  const result = await aiChatCompletion({
    messages: llmMessages,
    temperature: 0.9,
    maxTokens: 1024,
  });
  if (!result.ok) return aiErrorResponse(result);
  return NextResponse.json({ reply: result.content });
}
