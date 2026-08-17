import { loadChats, saveChats } from "@/lib/storage";
import type { ChatListItem, ChatRecord, SaveChatInput } from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs），强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// ============================================================
// GET /api/chats —— 聊天内容回溯：列表摘要（按时间倒序）
// 不返回完整 messages，只返回预览。
// ============================================================
export async function GET() {
  const chats = await loadChats();
  const sorted = [...chats].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const items: ChatListItem[] = sorted.map((c) => {
    const firstUser = c.messages.find((m) => m.role === "user");
    const preview = (firstUser?.content || c.content || "").slice(0, 60);
    return {
      id: c.id,
      created_at: c.created_at,
      preview,
      emotion: c.emotion ?? null,
      message_count: c.messages.length,
    };
  });

  return NextResponse.json(items);
}

// ============================================================
// POST /api/chats —— 保存一段聊天记录
// ============================================================
export async function POST(req: Request) {
  let body: SaveChatInput;
  try {
    body = (await req.json()) as SaveChatInput;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "missing messages" }, { status: 400 });
  }

  const chats = await loadChats();
  const record: ChatRecord = {
    id: uid(),
    created_at: new Date().toISOString(),
    messages: body.messages,
    context: body.context,
    emotion: body.emotion ?? null,
    content: body.content,
  };

  chats.unshift(record);
  await saveChats(chats);

  return NextResponse.json(record, { status: 201 });
}
