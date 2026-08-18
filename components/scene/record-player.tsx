"use client"

import { useEffect } from "react"
import { motion, useAnimationControls } from "framer-motion"
import { InteractiveObject } from "./interactive-object"
import {
  EMOTION_THEMES,
  type EmotionId,
} from "./emotion-theme"

type RecordPlayerProps = {
  onSelect?: () => void
  emotion: EmotionId
  muted: boolean
  onToggleMute: () => void
}

/** Record player — left desk, under the white sticky note. */
export function RecordPlayer({
  onSelect,
  emotion,
  muted,
  onToggleMute,
}: RecordPlayerProps) {
  const theme = EMOTION_THEMES[emotion]
  const spinControls = useAnimationControls()

  useEffect(() => {
    if (muted) {
      spinControls.stop()
      return
    }

    void spinControls.start({
      rotate: 360,
      transition: {
        duration: 12,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
      },
    })
  }, [muted, spinControls])

  return (
    <>
      <InteractiveObject
        src="/assets/record-player-empty.png"
        alt={`正在播放代表“${theme.label}”的唱片`}
        glowColor={theme.glow}
        rotate={2}
        idleDelay={0}
        onSelect={onSelect}
        underlay={
          <motion.div
            className="pointer-events-none absolute left-[15.8%] top-[40.5%] h-[23%] w-[53%] overflow-hidden rounded-[50%]"
            initial={false}
            animate={{
              backgroundColor: theme.color,
              boxShadow: `0 0 16px ${theme.glow}`,
            }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            aria-hidden
          >
            <div
              className="absolute left-0 top-1/2 aspect-square w-full"
              style={{ transform: "translateY(-50%) scaleY(0.43)" }}
            >
              <motion.div
                className="absolute inset-0 rounded-full"
                initial={{ rotate: 0 }}
                animate={spinControls}
                style={{
                  backgroundColor: theme.color,
                  backgroundImage:
                    "repeating-radial-gradient(circle, transparent 0 7%, rgba(20,12,18,0.16) 7.5% 8%, transparent 8.5% 13%), repeating-conic-gradient(from 8deg, rgba(255,255,255,0.2) 0deg 7deg, transparent 7deg 31deg, rgba(20,12,18,0.2) 31deg 35deg)",
                  boxShadow:
                    "inset 0 0 0 2px rgba(255,255,255,0.2), inset 0 0 28px rgba(24,12,18,0.25)",
                }}
              >
                <div
                  className="absolute left-1/2 top-1/2 h-[24%] w-[24%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25"
                  style={{
                    backgroundColor: theme.color,
                    boxShadow:
                      "inset 0 0 0 3px rgba(255,255,255,0.14), 0 0 0 1px rgba(30,18,20,0.18)",
                  }}
                />
              </motion.div>
            </div>
          </motion.div>
        }
        style={{
          left: "17%",
          top: "28%",
          width: "30%",
          height: "48%",
          zIndex: 18,
        }}
      />

      <button
        type="button"
        onClick={onToggleMute}
        aria-pressed={muted}
        aria-label={muted ? "开启背景音乐" : "静音背景音乐"}
        className="absolute z-30 flex items-center gap-1.5 rounded-full border border-white/40 bg-[rgba(13,10,21,0.58)] px-3.5 py-2 font-serif text-[13px] tracking-wide text-white/92 shadow-[0_6px_18px_rgba(0,0,0,0.22)] backdrop-blur-md transition-[background-color,border-color,color,transform] hover:scale-[1.03] hover:border-white/65 hover:bg-[rgba(13,10,21,0.7)] hover:text-white"
        style={{
          left: "40%",
          top: "40%",
          transform: "translateX(-50%)",
        }}
      >
        {muted ? <MutedIcon /> : <SoundIcon />}
        {muted ? "开启声音" : "静音"}
      </button>
    </>
  )
}

function SoundIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 6.2h2.3L8.2 3v10L4.8 9.8H2.5V6.2Z"
        fill="currentColor"
      />
      <path
        d="M10.5 5.2c1.5 1.4 1.5 4.2 0 5.6M12.5 3.6c2.5 2.4 2.5 6.4 0 8.8"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MutedIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 6.2h2.3L8.2 3v10L4.8 9.8H2.5V6.2Z"
        fill="currentColor"
      />
      <path
        d="m10.3 6 3.2 4M13.5 6l-3.2 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
