"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { EMOTION_THEMES } from "@/components/scene/emotion-theme"
import { toFrontendEmotion } from "@/lib/emotion-map"

type Msg = { role: "user" | "assistant"; content: string }

/** 把后端的错误码翻成一句温柔、不吓人的话。 */
async function friendlyError(r: Response): Promise<string> {
  const d = (await r.json().catch(() => null)) as { error?: string } | null
  const code = d?.error
  switch (code) {
    case "AI_NOT_CONFIGURED":
      return "我还没有接好耳朵（缺少 AI 的配置）。可以先回去写写日记，那边不受影响。"
    case "AI_REQUEST_FAILED":
      return "我走神了一下，请再试一次。"
    case "AI_UPSTREAM_ERROR":
    case "AI_INVALID_OUTPUT":
    case "AI_EMPTY_OUTPUT":
      return "我这边有点小状况，请再说一次。"
    default:
      return `好像出了点问题（${r.status}），请稍后再试。`
  }
}

export default function AiChatPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<{ emotion: string; content: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollBottom = () =>
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    })

  // 开场：让 AI 先轻声打个招呼
  useEffect(() => {
    let alive = true
    setBusy(true)
    fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opening: true }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await friendlyError(r))
        return r.json() as Promise<{ reply: string }>
      })
      .then((d) => {
        if (alive) setMessages([{ role: "assistant", content: d.reply }])
      })
      .catch((e) => {
        if (alive) setError((e as Error).message)
      })
      .finally(() => {
        if (alive) setBusy(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return
    const next: Msg[] = [...messages, { role: "user", content: text }]
    setMessages(next)
    setInput("")
    setError(null)
    setBusy(true)
    scrollBottom()
    try {
      const r = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      })
      if (!r.ok) throw new Error(await friendlyError(r))
      const d = (await r.json()) as { reply: string }
      setMessages([...next, { role: "assistant", content: d.reply }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      scrollBottom()
    }
  }

  const save = async () => {
    if (messages.length === 0 || busy) return
    setBusy(true)
    setError(null)
    try {
      const sr = await fetch("/api/ai/chat/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      })
      if (!sr.ok) throw new Error(await friendlyError(sr))
      const d = (await sr.json()) as {
        emotion?: string
        content?: string
        lesson?: string
        next_action?: string
        growth_evidence?: string
        ai_response?: string
        scores?: unknown
        score_source?: string
        score_reasons?: unknown
      }

      const emotion = (d.emotion ?? "calm") as string
      const content =
        (d.content ?? "").trim() ||
        messages
          .filter((m) => m.role === "user")
          .map((m) => m.content)
          .join("\n")

      const body: Record<string, unknown> = {
        emotion,
        content,
        lesson: d.lesson ?? "",
        next_action: d.next_action ?? "",
        growth_evidence: d.growth_evidence ?? "",
      }
      if (d.ai_response) body.ai_response = d.ai_response
      if (d.scores) {
        body.scores = d.scores
        body.score_source = d.score_source ?? "llm"
        body.score_reasons = d.score_reasons
      }

      const dr = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!dr.ok) throw new Error(await friendlyError(dr))
      setSaved({ emotion: toFrontendEmotion(emotion), content })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const theme = saved ? EMOTION_THEMES[saved.emotion as keyof typeof EMOTION_THEMES] : null

  return (
    <main className="relative min-h-[100dvh] overflow-y-auto bg-[#141021] text-[#fff8ee]">
      {/* 氛围背景 */}
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
            "linear-gradient(180deg, rgba(20,16,33,0.66), rgba(20,16,33,0.94) 72%), radial-gradient(circle at 60% 15%, rgba(214,120,154,0.12), transparent 30%)",
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

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-88px)] w-full max-w-[720px] flex-col px-5 pb-10 sm:px-8">
        {saved ? (
          <motion.div
            className="mx-auto mt-10 w-full max-w-[560px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <p className="text-center font-serif text-sm tracking-[0.24em] text-[#f0c48f]">
              已经收好了
            </p>
            <h1 className="mt-4 text-center font-serif text-2xl font-medium tracking-wide">
              这一页，被好好放进了纸堆里。
            </h1>
            {theme && (
              <p
                className="mt-4 text-center font-serif text-sm tracking-wide"
                style={{ color: theme.color, textShadow: `0 0 14px ${theme.glow}` }}
              >
                此刻的情绪 · {theme.label}
              </p>
            )}
            <p className="mx-auto mt-5 max-w-[440px] rounded-2xl border border-white/12 bg-white/6 px-6 py-5 text-center font-serif text-sm leading-7 text-white/72 backdrop-blur-md">
              “{saved.content}”
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <a
                href="/analysis"
                className="rounded-full border border-white/45 bg-white/88 px-5 py-2.5 font-serif text-sm font-medium text-[#211a16] transition-colors hover:bg-white"
              >
                看看我的变化
              </a>
              <a
                href="/"
                className="rounded-full border border-white/30 bg-black/20 px-5 py-2.5 font-serif text-sm text-white/82 transition-colors hover:border-white/55 hover:text-white"
              >
                回到桌面
              </a>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="mx-auto mt-6 max-w-[560px] text-center">
              <p className="text-xs tracking-[0.26em] text-[#f0c48f]/70">SAY IT OUT · 情绪树洞</p>
              <h1 className="mt-3 font-serif text-2xl font-medium tracking-wide sm:text-3xl">
                先把它说出来。
              </h1>
              <p className="mt-3 font-serif text-sm leading-7 text-white/58">
                不分析、不评判，只是先让真实被听见。
              </p>
            </div>

            <div
              ref={scrollRef}
              className="mx-auto mt-8 flex w-full max-w-[560px] flex-1 flex-col gap-4 overflow-y-auto rounded-[22px] border border-white/10 bg-black/22 p-5 backdrop-blur-md"
              style={{ maxHeight: "55dvh" }}
              aria-live="polite"
            >
              {messages.length === 0 && !error && (
                <p className="py-10 text-center font-serif text-sm text-white/40">正在听……</p>
              )}
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    className={m.role === "user" ? "self-end max-w-[82%]" : "self-start max-w-[82%]"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={
                        m.role === "user"
                          ? "rounded-2xl rounded-br-md bg-white/90 px-4 py-2.5 font-serif text-sm leading-7 text-[#241b16]"
                          : "rounded-2xl rounded-bl-md border border-white/12 bg-white/8 px-4 py-2.5 font-serif text-sm leading-7 text-white/86"
                      }
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {busy && (
                <motion.p
                  className="self-start font-serif text-xs tracking-widest text-white/38"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  正在听……
                </motion.p>
              )}
              {error && (
                <p className="self-center max-w-[86%] rounded-xl border border-[#e8493d]/28 bg-[#e8493d]/10 px-4 py-2 text-center font-serif text-xs leading-6 text-[#ff9d92]">
                  {error}
                </p>
              )}
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-[560px] items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder="想说点什么……"
                className="min-w-0 flex-1 rounded-full border border-white/18 bg-black/24 px-5 py-3 font-serif text-sm text-white/90 placeholder:text-white/32 outline-none backdrop-blur-sm transition-colors focus:border-white/45"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={busy || !input.trim()}
                className="shrink-0 rounded-full border border-white/45 bg-white/88 px-5 py-3 font-serif text-sm font-medium text-[#211a16] transition-colors hover:bg-white disabled:opacity-40"
              >
                说
              </button>
            </div>

            <div className="mx-auto mt-4 flex w-full max-w-[560px] items-center justify-end">
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy || messages.length === 0}
                className="rounded-full border border-[#f0c48f]/45 px-5 py-2 font-serif text-sm tracking-wide text-[#f0c48f] transition-colors hover:border-[#f0c48f]/80 hover:text-[#f7d7a6] disabled:opacity-40"
              >
                把它收进纸堆
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}