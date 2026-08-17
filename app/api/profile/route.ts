import { loadProfile, saveProfile } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";
import { NextResponse } from "next/server";

// 使用 Node 运行时（需要 fs），强制动态渲染
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// GET /api/profile —— 读取用户画像
// 尚未完成 onboarding（文件不存在）时返回 404。
// ============================================================
export async function GET() {
  const profile = await loadProfile();
  if (!profile) {
    return NextResponse.json({ error: "not onboarded" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

// ============================================================
// POST /api/profile —— 保存用户画像（完成 onboarding）
// ============================================================
export async function POST(req: Request) {
  let body: UserProfile;
  try {
    body = (await req.json()) as UserProfile;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const profile: UserProfile = {
    mbti: body?.mbti ?? null,
    life_stage: body?.life_stage ?? null,
    support_preference: body?.support_preference ?? null,
  };

  await saveProfile(profile);
  return NextResponse.json(profile);
}
