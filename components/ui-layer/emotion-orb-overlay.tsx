"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  EMOTION_ORDER,
  EMOTION_THEMES,
  type EmotionId,
} from "@/components/scene/emotion-theme"

const ORB_POSITIONS: Record<EmotionId, { left: string; top: string }> = {
  sad: { left: "11%", top: "27%" },
  angry: { left: "28%", top: "16%" },
  anxious: { left: "47%", top: "21%" },
  tired: { left: "67%", top: "15%" },
  lost: { left: "85%", top: "27%" },
  calm: { left: "91%", top: "51%" },
  happy: { left: "83%", top: "73%" },
  excited: { left: "67%", top: "84%" },
  moved: { left: "48%", top: "79%" },
  hopeful: { left: "29%", top: "84%" },
  grateful: { left: "12%", top: "72%" },
  content: { left: "8%", top: "49%" },
}

type EmotionOrbOverlayProps = {
  open: boolean
  selected: EmotionId
  onSelect: (emotion: EmotionId) => void
  onClose: () => void
}

export function EmotionOrbOverlay({
  open,
  selected,
  onSelect,
  onClose,
}: EmotionOrbOverlayProps) {
  const [hovered, setHovered] = useState<EmotionId | null>(null)
  const preview = EMOTION_THEMES[hovered ?? selected]

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          className="pointer-events-auto absolute inset-0 z-[70] overflow-y-auto bg-[rgba(5,5,12,0.76)] backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label="选择此刻的情绪"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="fixed right-6 top-6 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-xl text-white/75 transition-colors hover:border-white/50 hover:text-white"
            aria-label="关闭情绪选择"
          >
            ×
          </button>

          <div className="pointer-events-none fixed left-1/2 top-1/2 z-10 hidden w-[22rem] -translate-x-1/2 -translate-y-1/2 text-center md:block">
            <p className="font-serif text-sm tracking-[0.28em] text-white/60">
              此刻，更接近哪一种？
            </p>
            <motion.p
              key={hovered ?? selected}
              className="mt-4 font-serif text-2xl font-medium tracking-wide"
              style={{ color: preview.color, textShadow: `0 0 18px ${preview.glow}` }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {preview.label}
            </motion.p>
            <p className="mt-2 font-serif text-sm tracking-wide text-white/72">
              {preview.message}
            </p>
          </div>

          <div className="grid min-h-full grid-cols-3 content-center gap-x-4 gap-y-8 px-5 py-20 md:block">
            <div className="col-span-3 mb-2 text-center md:hidden">
              <p className="font-serif text-base tracking-[0.2em] text-white/80">
                此刻，更接近哪一种？
              </p>
              <p className="mt-2 font-serif text-sm text-white/60">
                点击一颗光球，听见此刻的自己
              </p>
            </div>

            {EMOTION_ORDER.map((id, index) => {
              const emotion = EMOTION_THEMES[id]
              const position = ORB_POSITIONS[id]
              const isSelected = selected === id

              return (
                <div
                  key={id}
                  className="flex justify-center md:absolute md:-translate-x-1/2 md:-translate-y-1/2"
                  style={position}
                >
                  <motion.button
                    type="button"
                    className="group flex flex-col items-center"
                    initial={{ opacity: 0, scale: 0.65 }}
                    animate={{ opacity: 1, scale: 1, y: [-5, 5, -5] }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{
                      opacity: { duration: 0.35, delay: index * 0.025 },
                      scale: { duration: 0.4, delay: index * 0.025 },
                      y: {
                        duration: 4.2 + (index % 4) * 0.55,
                        delay: index * 0.12,
                        ease: "easeInOut",
                        repeat: Number.POSITIVE_INFINITY,
                      },
                    }}
                    whileHover={{ scale: 1.12 }}
                    whileFocus={{ scale: 1.12 }}
                    onMouseEnter={() => setHovered(id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(id)}
                    onBlur={() => setHovered(null)}
                    onClick={() => onSelect(id)}
                    aria-pressed={isSelected}
                    aria-label={`${emotion.label}：${emotion.message}`}
                  >
                    <span
                      className="relative block h-14 w-14 rounded-full border border-white/25 md:h-[4.5rem] md:w-[4.5rem]"
                      style={{
                        background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.92) 0%, ${emotion.color} 22%, ${emotion.color} 58%, rgba(4,4,10,0.9) 145%)`,
                        boxShadow: `0 0 12px ${emotion.glow}, 0 0 34px ${emotion.glow}, inset -8px -10px 18px rgba(0,0,0,0.24)`,
                        outline: isSelected
                          ? "1px solid rgba(255,255,255,0.78)"
                          : "none",
                        outlineOffset: "5px",
                      }}
                    >
                      <span className="absolute left-[24%] top-[18%] h-[18%] w-[18%] rounded-full bg-white/60 blur-[2px]" />
                    </span>
                    <span
                      className="mt-3 whitespace-nowrap font-serif text-sm font-medium tracking-wide text-white/90"
                      style={{ textShadow: `0 0 9px ${emotion.glow}` }}
                    >
                      {emotion.label}
                    </span>
                    <span className="mt-1 hidden max-w-[10rem] text-center font-serif text-[11px] leading-5 text-white/60 max-md:block">
                      {emotion.message}
                    </span>
                  </motion.button>
                </div>
              )
            })}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
