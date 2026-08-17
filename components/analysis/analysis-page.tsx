"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { FunctionPageHeader } from "@/components/ui-layer/function-page-header"
import { NightAtmosphere } from "@/components/ui-layer/night-atmosphere"
import { PaperSheet } from "@/components/ui-layer/paper-sheet"
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
      <NightAtmosphere />
      <FunctionPageHeader />

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

        <PaperSheet
          variant="notebook"
          className="min-h-[760px]"
        >
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
        </PaperSheet>
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
