"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import ChatWindow from "@/components/windfall/ChatWindow"
import ChatSummaryCard, {
  type DiaryDraft,
} from "@/components/windfall/ChatSummaryCard"
import { createDiary } from "@/lib/api"
import type { ChatSummaryResponse } from "@/lib/types"

/**
 * 小熊页 —— 情绪树洞聊天。
 * 采用后端 WindFall 的完整聊天流程：多轮倾诉 → 聊完总结 → 确认卡片 → 保存（四指数 + 三问 + AI 回应）。
 * 外层套用前端暗夜氛围 + 暖纸聊天卡片。
 */
export default function AiChatPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<ChatSummaryResponse | null>(null)

  const handleSave = async (draft: DiaryDraft) => {
    try {
      await createDiary({
        emotion: draft.emotion,
        content: draft.content,
        lesson: draft.lesson,
        next_action: draft.next_action,
        growth_evidence: draft.growth_evidence,
        scores: draft.scores,
        score_source: draft.score_source,
        score_reasons: draft.score_reasons,
        ai_response: draft.ai_response,
      })
    } catch {
      // 保存失败也不阻塞返回，用户可回场景重试
    }
    router.push("/")
  }

  return (
    <main className="relative h-[100dvh] overflow-y-auto bg-[#141021] text-[#fff8ee]">
      {/* 暗夜氛围背景 */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage: "url('/assets/night-window.png')",
          backgroundPosition: "center 28%",
          backgroundSize: "cover",
          filter: "saturate(0.7) blur(1px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,16,33,0.7), rgba(20,16,33,0.95) 75%), radial-gradient(circle at 60% 12%, rgba(214,120,154,0.12), transparent 30%)",
        }}
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex w-full max-w-[760px] items-center justify-between px-5 py-6 sm:px-8">
        <a
          href="/"
          className="font-serif text-lg tracking-[0.08em] text-[#fff8ee]/90 transition-opacity hover:opacity-70"
        >
          韧芽
          <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-[#fff8ee]/46">
            Resilience Sprout
          </span>
        </a>
        <a
          href="/"
          className="rounded-full border border-white/22 bg-white/8 px-4 py-2 font-serif text-xs tracking-[0.12em] text-white/76 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white"
        >
          返回桌面
        </a>
      </header>

      {/* 暖纸聊天卡片：后端核心功能承载在「纸张」上，嵌入前端暗夜环境 */}
      <div className="relative z-10 mx-auto mb-10 w-full max-w-[720px] rounded-[22px] bg-[#f1e8d4] px-4 py-6 shadow-2xl sm:px-7 sm:py-7">
        <p className="mb-2 text-center font-serif text-[11px] tracking-[0.28em] text-[#a88a63]">
          SAY IT OUT · 情绪树洞
        </p>
        <h1 className="mb-4 text-center font-serif text-xl font-medium tracking-wide text-[#3b3028]">
          先把它说出来。
        </h1>
        <ChatWindow
          context={undefined}
          startSignal={0}
          onSummary={setSummary}
        />
      </div>

      {summary && (
        <ChatSummaryCard
          summary={summary}
          onSave={handleSave}
          onBack={() => setSummary(null)}
        />
      )}
    </main>
  )
}