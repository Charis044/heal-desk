"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { FunctionPageHeader } from "@/components/ui-layer/function-page-header"
import { NightAtmosphere } from "@/components/ui-layer/night-atmosphere"
import { PaperSheet } from "@/components/ui-layer/paper-sheet"
import ChatHistory from "@/components/windfall/ChatHistory"
import ChatWindow from "@/components/windfall/ChatWindow"
import { createDiary, saveChat, updateChat, updateDiary } from "@/lib/api"
import type { ChatMessage, ChatSummaryResponse } from "@/lib/types"

/**
 * 小熊页 —— 针对一篇 / 一天 / 一段时间 / 一个问题的具体咨询。
 * 完整对话留在小熊；压缩稿作为红色笔记出现在纸叠，可点回来。
 */
function AiChatBody() {
  const router = useRouter()
  const params = useSearchParams()
  const chatId = params.get("chat") ?? undefined
  const noteId = params.get("note") ?? undefined

  const handleFinish = async ({
    summary,
    messages,
  }: {
    summary: ChatSummaryResponse
    messages: ChatMessage[]
  }) => {
    const payload = {
      messages,
      emotion: summary.emotion,
      content: summary.content,
    }
    const chat = chatId
      ? await updateChat(chatId, payload)
      : await saveChat(payload)

    if (noteId) {
      await updateDiary(noteId, {
        content: summary.content,
        emotion: summary.emotion,
      })
    } else {
      await createDiary({
        emotion: summary.emotion,
        content: summary.content,
        lesson: "",
        next_action: "",
        growth_evidence: "",
        scores: summary.scores,
        score_source: summary.score_source,
        score_reasons: summary.score_reasons,
        ai_response: summary.ai_response,
        source: "bear",
        chat_id: chat.id,
      })
    }
    router.push("/history")
  }

  return (
    <main className="relative h-[100dvh] overflow-y-auto bg-[#141021] text-[#fff8ee]">
      <NightAtmosphere />
      <FunctionPageHeader className="max-w-[760px]" />

      <PaperSheet
        variant="lined"
        tape={["washi", "washi"]}
        className="relative z-10 mx-auto mb-8 w-full max-w-[720px] px-5 py-7 sm:px-8 sm:py-8"
      >
        <p className="mb-2 text-center font-serif text-[11px] tracking-[0.28em] text-[#8a7156]/80">
          ASK THE BEAR · 具体咨询
        </p>
        <h1 className="mb-6 text-center font-serif text-xl font-medium tracking-[0.06em] text-[#241b16]">
          把一件具体的事说清楚。
        </h1>
        <ChatWindow
          key={chatId ?? "new"}
          chatId={chatId}
          onFinish={handleFinish}
        />
      </PaperSheet>

      <PaperSheet
        variant="graph"
        tape={["stripe", "washi"]}
        className="relative z-10 mx-auto mb-14 w-full max-w-[720px] px-5 py-6 sm:px-8 sm:py-7"
      >
        <p className="mb-1 font-serif text-[10px] tracking-[0.24em] text-[#5c4739]/50">
          聊过的天
        </p>
        <h2 className="mb-4 font-serif text-lg font-medium tracking-[0.04em] text-[#2d221c]">
          完整对话只留在小熊这里
        </h2>
        <ChatHistory />
      </PaperSheet>
    </main>
  )
}

export default function AiChatPage() {
  return (
    <Suspense
      fallback={
        <main className="h-[100dvh] bg-[#141021] text-[#fff8ee]/50">
          <p className="px-8 py-16 font-serif tracking-[0.16em]">正在铺开纸……</p>
        </main>
      }
    >
      <AiChatBody />
    </Suspense>
  )
}
