"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import { SCENE_HEIGHT, SCENE_WIDTH } from "@/components/scene/scene-stage"

const TOUR_STORAGE_KEY = "resilience-sprout.scene-tour.completed"

type TourStep = {
  id: string
  title: string
  description: string
  detail: string
  spotlight?: { left: string; top: string; width: string; height: string; radius: string }
  card: { left: string; top: string; width: string }
}

const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "welcome",
    title: "这张桌子，等你慢慢探索",
    description: "桌上的每一件物品，都是一个可以随时打开的陪伴入口。",
    detail: "用四步认识它们；之后你也能随时直接点击想用的物品。",
    card: { left: "35%", top: "25%", width: "30%" },
  },
  {
    id: "emotion",
    title: "唱片机：为此刻的心情选一首歌",
    description: "点击左侧唱片机，选择最接近你当下感受的颜色。",
    detail: "它会切换氛围和随机音乐；旁边的小按钮可随时静音。",
    spotlight: { left: "15%", top: "26%", width: "34%", height: "52%", radius: "18%" },
    card: { left: "7%", top: "8%", width: "31%" },
  },
  {
    id: "journal",
    title: "打字机：把今天写下来",
    description: "点击右侧打字机，打开一页新的日记。",
    detail: "不需要写得完整；一句感受、一个片段，都可以被好好保存。",
    spotlight: { left: "42%", top: "26%", width: "35%", height: "60%", radius: "14%" },
    card: { left: "65%", top: "8%", width: "29%" },
  },
  {
    id: "history",
    title: "纸张：回看你走过的路",
    description: "点击右下角叠放的纸张，查看已写下的所有记录。",
    detail: "这里适合在想整理思绪时，重新读一读过去的自己。",
    spotlight: { left: "68%", top: "51%", width: "28%", height: "47%", radius: "12%" },
    card: { left: "50%", top: "15%", width: "31%" },
  },
  {
    id: "companion",
    title: "小熊：针对一件事聊一聊",
    description: "点击左下角的小熊，进入 AI 陪伴与分析。",
    detail: "适合带着一篇记录或一个具体问题，获得更有针对性的梳理。",
    spotlight: { left: "4%", top: "46%", width: "24%", height: "53%", radius: "22%" },
    card: { left: "29%", top: "17%", width: "31%" },
  },
]

const artboardStyle = {
  aspectRatio: `${SCENE_WIDTH} / ${SCENE_HEIGHT}`,
  width: `max(100vw, calc(100dvh * ${SCENE_WIDTH} / ${SCENE_HEIGHT}))`,
  height: `max(100dvh, calc(100vw * ${SCENE_HEIGHT} / ${SCENE_WIDTH}))`,
}

/** First-visit map for the illustration-based entry points. */
export function SceneTutorial() {
  const [isVisible, setIsVisible] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    setIsVisible(window.localStorage.getItem(TOUR_STORAGE_KEY) !== "true")
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishTour()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isVisible])

  const finishTour = () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "true")
    setIsVisible(false)
  }

  const currentStep = TOUR_STEPS[stepIndex]
  const isLastStep = stepIndex === TOUR_STEPS.length - 1

  const advance = () => {
    if (isLastStep) {
      finishTour()
      return
    }

    setStepIndex((current) => current + 1)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section
          className="pointer-events-auto absolute inset-0 z-[70] overflow-hidden"
          aria-label="功能使用引导"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            style={artboardStyle}
          >
            {currentStep.spotlight ? (
              <div
                className="absolute border-2 border-[#fff3cd]"
                style={{
                  ...currentStep.spotlight,
                  boxShadow:
                    "0 0 0 200vmax rgba(11, 8, 20, 0.72), 0 0 0 5px rgba(255, 237, 187, 0.16), 0 0 36px rgba(255, 226, 146, 0.64)",
                  borderRadius: currentStep.spotlight.radius,
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-[rgba(11,8,20,0.72)]" />
            )}

            <button
              type="button"
              onClick={finishTour}
              className="absolute right-[5%] top-[5%] z-10 rounded-full border border-white/30 bg-black/20 px-5 py-2 font-serif text-[14px] text-white/90 transition hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fff3cd]"
            >
              跳过教程
            </button>

            <motion.div
              key={currentStep.id}
              className="absolute z-10 rounded-[20px] border border-white/25 bg-[rgba(36,29,48,0.96)] px-7 py-6 text-[#fffaf0] shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-md"
              style={currentStep.card}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              role="dialog"
              aria-live="polite"
              aria-label={`教程第 ${stepIndex + 1} 步`}
            >
              <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-[#f5cf88]">
                {String(stepIndex + 1).padStart(2, "0")} / {String(TOUR_STEPS.length).padStart(2, "0")}
              </p>
              <h2 className="font-serif text-[26px] leading-tight text-white">
                {currentStep.title}
              </h2>
              <p className="mt-3 font-serif text-[16px] leading-relaxed text-white/90">
                {currentStep.description}
              </p>
              <p className="mt-2 font-serif text-[14px] leading-relaxed text-white/60">
                {currentStep.detail}
              </p>
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex gap-1.5" aria-hidden>
                  {TOUR_STEPS.map((step, index) => (
                    <span
                      key={step.id}
                      className={`h-1.5 rounded-full transition-all ${index === stepIndex ? "w-5 bg-[#f5cf88]" : "w-1.5 bg-white/30"}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={advance}
                  className="rounded-full bg-[#f1cc82] px-5 py-2 text-[14px] font-semibold text-[#36271e] transition hover:bg-[#ffe1a3] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {isLastStep ? "开始使用" : "下一步"}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
