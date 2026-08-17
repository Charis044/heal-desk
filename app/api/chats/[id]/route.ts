import { loadChats, saveChats } from "@/lib/storage";
import type { SaveChatInput } from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs），强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/chats/:id —— 获取单段完整聊天记录
// DELETE /api/chats/:id —— 删除一段聊天记录
// ============================================================
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chats = await loadChats();
  const chat = chats.find((c) => c.id === id);
  if (!chat) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(chat);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  chats[idx] = {
    ...chats[idx],
    messages: body.messages,
    context: body.context ?? chats[idx].context,
    emotion: body.emotion !== undefined ? body.emotion : chats[idx].emotion,
    content: body.content !== undefined ? body.content : chats[idx].content,
  };
  await saveChats(chats);
  return NextResponse.json(chats[idx]);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chats = await loadChats();
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  chats.splice(idx, 1);
  await saveChats(chats);
  return NextResponse.json({ ok: true });
}