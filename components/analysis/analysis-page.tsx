"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type {
  AnalyticsOverview,
  GrowthPoint,
} from "./analytics-contract"
import {
  getAnalyticsGrowth,
  getAnalyticsOverview,
} from "./analytics-service"
import { OverviewPanel } from "./overview-panel"
import { GrowthChart } from "./growth-chart"

type AnalysisTab = "overview" | "growth"

const TABS: Array<{
  id: AnalysisTab
  number: string
  label: string
  question: string
}> = [
  {
    id: "overview",
    number: "④",
    label: "全面分析",
    question: "最近的你，正在发生什么变化？",
  },
  {
    id: "growth",
    number: "⑤",
    label: "韧性轨迹",
    question: "你的韧性指数随时间怎么变化？",
  },
]

export function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>("overview")
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [growth, setGrowth] = useState<GrowthPoint[] | null>(null)

  useEffect(() => {
    let cancelled = false

    void Promise.all([getAnalyticsOverview(), getAnalyticsGrowth()]).then(
      ([overviewData, growthData]) => {
        if (cancelled) return
        setOverview(overviewData)
        setGrowth(growthData)
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="relative h-[100dvh] overflow-y-auto bg-[#141021] text-[#fff8ee]">
      <div
        className="pointer-events-none fixed inset-0 opacity-35"
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
            "linear-gradient(180deg, rgba(20,16,33,0.46), rgba(20,16,33,0.88) 75%), radial-gradient(circle at 18% 36%, rgba(214,120,154,0.12), transparent 28%), radial-gradient(circle at 82% 22%, rgba(7,141,140,0.13), transparent 27%)",
        }}
        aria-hidden
      />

      <motion.div
        className="pointer-events-none fixed left-[10%] top-[18%] h-36 w-36 rounded-full bg-[#D6789A]/8 blur-3xl"
        animate={{ x: [0, 12, 0], y: [0, -9, 0] }}
        transition={{
          duration: 12,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none fixed bottom-[12%] right-[8%] h-44 w-44 rounded-full bg-[#078D8C]/8 blur-3xl"
        animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
        transition={{
          duration: 14,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-6 sm:px-8">
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

      <div className="relative z-10 mx-auto grid w-full max-w-[1240px] gap-5 px-4 pb-14 sm:px-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
        <aside className="rounded-[22px] border border-white/14 bg-white/8 p-3 backdrop-blur-xl lg:sticky lg:top-6 lg:h-fit lg:p-4">
          <p className="hidden px-3 pb-5 pt-2 font-serif text-xs tracking-[0.22em] text-white/42 lg:block">
            我的变化
          </p>
          <nav
            className="grid grid-cols-2 gap-2 lg:grid-cols-1"
            aria-label="分析页面导航"
          >
            {TABS.map((tab) => {
              const active = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    "group rounded-2xl px-3 py-3 text-left font-serif transition-[background-color,color,transform] duration-300",
                    active
                      ? "bg-white/16 text-white"
                      : "text-white/58 hover:bg-white/8 hover:text-white/86",
                  ].join(" ")}
                >
                  <span className="mr-2 text-sm text-[#f0c48f]/70">
                    {tab.number}
                  </span>
                  <span className="text-sm tracking-[0.08em]">
                    {tab.label}
                  </span>
                  <span className="mt-2 hidden text-[10px] leading-5 tracking-wide text-white/38 lg:block">
                    {tab.question}
                  </span>
                </button>
              )
            })}
          </nav>
        </aside>

        <section
          className="relative min-h-[760px] overflow-hidden px-6 py-9 text-[#241b16] sm:px-10 sm:py-12 lg:px-14"
          style={{
            backgroundColor: "rgba(238,230,218,0.92)",
            backgroundImage:
              "radial-gradient(circle at 16% 12%, rgba(255,255,255,0.52), transparent 26%), repeating-linear-gradient(2deg, rgba(89,65,48,0.025) 0, rgba(89,65,48,0.025) 1px, transparent 1px, transparent 5px), linear-gradient(145deg, rgba(245,239,229,0.98), rgba(228,215,197,0.96))",
            clipPath:
              "polygon(1% 0, 99.4% 0.7%, 100% 98.8%, 1.2% 100%, 0 2%)",
            filter: "drop-shadow(0 22px 48px rgba(0,0,0,0.3))",
          }}
        >
          <div className="pointer-events-none absolute left-5 top-0 h-7 w-28 -rotate-2 bg-[#d8c5a8]/52 mix-blend-multiply" />
          <div className="pointer-events-none absolute right-8 top-0 h-6 w-24 rotate-2 bg-[#d8c5a8]/48 mix-blend-multiply" />

          <div className="mb-10 border-b border-[#49372b]/14 pb-5">
            <p className="text-[10px] tracking-[0.28em] text-[#5c4739]/44">
              MY CHANGES · 我的变化
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {activeTab === "overview" ? (
                overview ? (
                  <OverviewPanel data={overview} />
                ) : (
                  <LoadingPaper label="正在整理最近留下的线索……" />
                )
              ) : growth ? (
                <GrowthChart data={growth} />
              ) : (
                <LoadingPaper label="正在展开时间里的记录……" />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}

function LoadingPaper({ label }: { label: string }) {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <motion.p
        className="font-serif text-sm tracking-[0.16em] text-[#49372b]/48"
        animate={{ opacity: [0.35, 0.72, 0.35] }}
        transition={{
          duration: 2.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        {label}
      </motion.p>
    </div>
  )
}
