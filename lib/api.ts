import type {
  ChatListItem,
  ChatRecord,
  ChatRequest,
  ChatResponse,
  ChatSummaryRequest,
  ChatSummaryResponse,
  CreateDiaryInput,
  DiaryEntry,
  DiarySummary,
  EmotionsResponse,
  GrowthProfile,
  GrowthResponse,
  OverviewAnalysis,
  ReflectRequest,
  ReflectResponse,
  SaveChatInput,
  UpdateDiaryInput,
  UserProfile,
} from "./types";

// ============================================================
// 前端数据层：请求自己的 Backend API。
//
// 后端为 Next.js Route Handlers（app/api/**），数据持久化到磁盘。
// 前端只负责 UI、动画与交互，不直接读写数据。
// ============================================================

/** 拉取日记列表摘要（GET /api/diary，按时间倒序，支持关键词/情绪筛选；trash=1 取回收站） */
export async function listDiary(params?: {
  limit?: number;
  offset?: number;
  q?: string;
  emotion?: string;
  trash?: boolean;
}): Promise<DiarySummary[]> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  if (params?.q) qs.set("q", params.q);
  if (params?.emotion) qs.set("emotion", params.emotion);
  if (params?.trash) qs.set("trash", "1");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await fetch(`/api/diary${suffix}`);
  if (!res.ok) throw new Error(`listDiary failed: ${res.status}`);
  return res.json();
}

/** 获取单条完整记录（GET /api/diary/:id） */
export async function getDiary(id: string): Promise<DiaryEntry> {
  const res = await fetch(`/api/diary/${id}`);
  if (!res.ok) throw new Error(`getDiary failed: ${res.status}`);
  return res.json();
}

/** 保存一条日记（POST /api/diary，后端生成 resilience_score/ai_response） */
export async function createDiary(input: CreateDiaryInput): Promise<DiaryEntry> {
  const res = await fetch("/api/diary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`createDiary failed: ${res.status}`);
  return res.json();
}

/** 补做三问 / 编辑记录（PATCH /api/diary/:id，后端重算 score/ai_response/findings） */
export async function updateDiary(
  id: string,
  input: UpdateDiaryInput
): Promise<DiaryEntry> {
  const res = await fetch(`/api/diary/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`updateDiary failed: ${res.status}`);
  return res.json();
}

/** 删除一条日记（DELETE /api/diary/:id —— 默认软删除进回收站；permanent=true 彻底删除） */
export async function deleteDiary(
  id: string,
  permanent = false
): Promise<void> {
  const suffix = permanent ? "?permanent=1" : "";
  const res = await fetch(`/api/diary/${id}${suffix}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`deleteDiary failed: ${res.status}`);
}

/** 从回收站恢复一条日记（POST /api/diary/:id/restore） */
export async function restoreDiary(id: string): Promise<DiaryEntry> {
  const res = await fetch(`/api/diary/${id}/restore`, { method: "POST" });
  if (!res.ok) throw new Error(`restoreDiary failed: ${res.status}`);
  return res.json();
}

/** 清空全部数据（DELETE /api/diary —— 日记 + 聊天 + 画像） */
export async function resetAll(): Promise<void> {
  const res = await fetch("/api/diary", { method: "DELETE" });
  if (!res.ok) throw new Error(`resetAll failed: ${res.status}`);
}

/** 韧性变化曲线（GET /api/analytics/growth） */
export async function getGrowth(): Promise<GrowthResponse> {
  const res = await fetch("/api/analytics/growth");
  if (!res.ok) throw new Error(`getGrowth failed: ${res.status}`);
  return res.json();
}

/** 最近 30 天情绪变化（GET /api/analytics/emotions） */
export async function getEmotions(): Promise<EmotionsResponse> {
  const res = await fetch("/api/analytics/emotions");
  if (!res.ok) throw new Error(`getEmotions failed: ${res.status}`);
  return res.json();
}

/** 我的成长画像（GET /api/analytics/growth-profile） */
export async function getGrowthProfile(): Promise<GrowthProfile> {
  const res = await fetch("/api/analytics/growth-profile");
  if (!res.ok) throw new Error(`getGrowthProfile failed: ${res.status}`);
  return res.json();
}

/** 个人全方面分析（GET /api/analytics/overview） */
export async function getOverview(): Promise<OverviewAnalysis> {
  const res = await fetch("/api/analytics/overview");
  if (!res.ok) throw new Error(`getOverview failed: ${res.status}`);
  return res.json();
}

// ============================================================
// 聊天内容回溯
// ============================================================

/** 聊天列表摘要（GET /api/chats） */
export async function listChats(): Promise<ChatListItem[]> {
  const res = await fetch("/api/chats");
  if (!res.ok) throw new Error(`listChats failed: ${res.status}`);
  return res.json();
}

/** 获取一段完整聊天记录（GET /api/chats/:id） */
export async function getChat(id: string): Promise<ChatRecord> {
  const res = await fetch(`/api/chats/${id}`);
  if (!res.ok) throw new Error(`getChat failed: ${res.status}`);
  return res.json();
}

/** 保存一段聊天记录（POST /api/chats） */
export async function saveChat(input: SaveChatInput): Promise<ChatRecord> {
  const res = await fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`saveChat failed: ${res.status}`);
  return res.json();
}

/** 删除一段聊天记录（DELETE /api/chats/:id） */
export async function deleteChat(id: string): Promise<void> {
  const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`deleteChat failed: ${res.status}`);
}

/** 请求 AI 起头（三问复盘的「让 AI 帮我想想」） */
export async function requestReflectionSuggestion(
  input: ReflectRequest
): Promise<ReflectResponse> {
  const res = await fetch("/api/ai/reflect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`reflect request failed: ${res.status}`);
  }
  return res.json();
}

/** 发送一条聊天消息（POST /api/ai/chat，携带完整历史） */
export async function sendChatMessage(input: ChatRequest): Promise<ChatResponse> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`chat request failed: ${res.status}`);
  }
  return res.json();
}

/** 把整段对话归纳成草稿（POST /api/ai/chat/summary） */
export async function summarizeChat(
  input: ChatSummaryRequest
): Promise<ChatSummaryResponse> {
  const res = await fetch("/api/ai/chat/summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(`chat summary failed: ${res.status}`);
  }
  return res.json();
}

// ============================================================
// 用户初始画像（Onboarding）
// ============================================================

/** 读取用户画像；尚未完成 onboarding 时返回 null */
export async function getProfile(): Promise<UserProfile | null> {
  const res = await fetch("/api/profile");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getProfile failed: ${res.status}`);
  return res.json();
}

/** 保存用户画像（完成 onboarding） */
export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error(`saveProfile failed: ${res.status}`);
  return res.json();
}
