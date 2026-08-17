"use client"

import { motion } from "framer-motion"
import { EMOTION_THEMES } from "@/components/scene/emotion-theme"
import type { AnalyticsOverview } from "./analytics-contract"

type OverviewPanelProps = {
  data: AnalyticsOverview
}

const STAT_LABELS = [
  { key: "journal_count", label: "篇日记" },
  { key: "review_count", label: "次三问复盘" },
  { key: "chat_count", label: "段聊天" },
] as const

function getEmotionTheme(emotion: string) {
  if (emotion in EMOTION_THEMES) {
    return EMOTION_THEMES[emotion as keyof typeof EMOTION_THEMES]
  }
  return { label: emotion, color: "#d8cec0", glow: "rgba(216,206,192,0.5)" }
}

export function OverviewPanel({ data }: OverviewPanelProps) {
  const maxEmotionCount = Math.max(
    1,
    ...data.chat_emotions.map((emotion) => emotion.count),
  )

  return (
    <motion.div
      className="space-y-12"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <section>
        <p className="text-xs tracking-[0.28em] text-[#5b493d]/55">
          最近的你，正在发生什么变化？
        </p>
        <blockquote className="mt-5 max-w-[820px] font-serif text-[clamp(1.65rem,3vw,2.65rem)] font-medium leading-[1.65] tracking-[0.04em] text-[#241b16]">
          “{data.summary}”
        </blockquote>
        <div className="mt-7 h-px w-24 bg-[#6e5543]/35" />
      </section>

      <section
        className="grid grid-cols-3 border-y border-[#49372b]/20 py-6"
        aria-label="近期活动统计"
      >
        {STAT_LABELS.map(({ key, label }, index) => (
          <div
            key={key}
            className={[
              "text-center",
              index > 0 ? "border-l border-[#49372b]/18" : "",
            ].join(" ")}
          >
            <strong className="font-serif text-3xl font-medium text-[#2b211b] sm:text-4xl">
              {data.stats[key]}
            </strong>
            <span className="mt-2 block text-xs tracking-[0.12em] text-[#49372b]/62 sm:text-sm">
              {label}
            </span>
          </div>
        ))}
      </section>

      <section>
        <SectionHeading
          eyebrow="被反复看见的能力"
          title="你正在使用的力量"
        />
        <div className="mt-7 space-y-5">
          {data.strengths.slice(0, 3).map((strength, index) => (
            <motion.div
              key={strength.label}
              className="flex flex-col gap-3 border-b border-[#49372b]/14 pb-5 sm:flex-row sm:items-start sm:gap-6"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
            >
              <span className="w-fit shrink-0 rounded-full border border-[#614b3c]/24 bg-white/28 px-3.5 py-1.5 text-sm tracking-[0.12em] text-[#382a22] sm:w-36 sm:text-center">
                {strength.label}
              </span>
              <p className="font-serif text-[15px] leading-8 text-[#3d3028]/76 sm:text-base">
                {strength.observation}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="正在改变的地方"
          title="不是突然变好，而是反应方式有了一点不同"
        />
        <div className="mt-8 space-y-6">
          {data.patterns.map((pattern, index) => (
            <motion.div
              key={`${pattern.past}-${pattern.now}`}
              className="grid gap-3 sm:grid-cols-[1fr_44px_1fr] sm:items-center"
              initial={{ opacity: 0, y: 7 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
            >
              <div className="border-l-2 border-[#584539]/18 pl-4">
                <span className="text-[10px] tracking-[0.2em] text-[#49372b]/42">
                  过去
                </span>
                <p className="mt-1.5 font-serif text-sm leading-7 text-[#42342b]/62">
                  {pattern.past}
                </p>
              </div>
              <span className="hidden text-center font-serif text-xl text-[#6b5547]/34 sm:block">
                →
              </span>
              <div className="border-l-2 border-[#9d7757]/38 pl-4">
                <span className="text-[10px] tracking-[0.2em] text-[#49372b]/55">
                  现在
                </span>
                <p className="mt-1.5 font-serif text-sm leading-7 text-[#2f241e]/82">
                  {pattern.now}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="聊天中的情绪"
          title="最近被说出口的感受"
        />
        <div className="mt-7 space-y-4">
          {data.chat_emotions.map((emotion) => {
            const theme = getEmotionTheme(emotion.emotion)
            const width = `${(emotion.count / maxEmotionCount) * 100}%`

            return (
              <div
                key={emotion.emotion}
                className="grid grid-cols-[5rem_1fr_2rem] items-center gap-3"
              >
                <span className="font-serif text-sm text-[#352920]/75">
                  {theme.label}
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-[#49372b]/9">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: theme.color }}
                    initial={{ width: 0, opacity: 0.55 }}
                    animate={{ width, opacity: 0.82 }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                  />
                </div>
                <span className="text-right font-serif text-xs text-[#49372b]/48">
                  {emotion.count}
                </span>
              </div>
            )
          })}
        </div>
        <p className="mt-5 text-xs leading-6 tracking-wide text-[#49372b]/42">
          这里只呈现出现频率，不判断情绪的好坏。
        </p>
      </section>
    </motion.div>
  )
}

function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string
  title: string
}) {
  return (
    <header>
      <p className="text-[10px] tracking-[0.24em] text-[#695244]/46">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-serif text-xl font-medium tracking-[0.06em] text-[#2d221c] sm:text-2xl">
        {title}
      </h2>
    </header>
  )
}
