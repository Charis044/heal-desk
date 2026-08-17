"use client"

import { motion } from "framer-motion"

const STEAM_PATHS = [
  "M45 116C23 99 69 86 42 68C18 52 70 39 48 21",
  "M25 114C8 98 47 85 25 68C7 53 46 43 31 35",
  "M66 116C84 100 44 87 68 70C86 56 47 46 64 38",
] as const

/** Soft recurring steam positioned over the cup painted into the desk. */
export function CupSteam() {
  return (
    <svg
      className="pointer-events-none absolute left-[43%] top-[61%] z-[14] h-[24%] w-[10%] overflow-visible"
      viewBox="0 0 90 120"
      fill="none"
      aria-hidden
      style={{ mixBlendMode: "screen" }}
    >
      {STEAM_PATHS.map((path, index) => (
        <motion.path
          key={path}
          d={path}
          stroke="rgba(255,255,255,0.72)"
          strokeWidth={index === 0 ? 3.2 : 2.5}
          strokeLinecap="round"
          initial={{ opacity: 0, pathLength: 0, y: 8 }}
          animate={{
            opacity: [0, 0, 0.52, 0.38, 0, 0],
            pathLength: [0, 0.08, 0.72, 1, 1, 1],
            y: [8, 8, 2, -7, -15, -15],
            x: [0, 0, index % 2 === 0 ? 2 : -2, 0, index % 2 === 0 ? -2 : 2, 0],
          }}
          transition={{
            duration: 7.5,
            delay: index * 0.55,
            times: [0, 0.12, 0.34, 0.58, 0.76, 1],
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
          style={{
            filter:
              "blur(1.2px) drop-shadow(0 0 5px rgba(255,255,255,0.3))",
          }}
        />
      ))}
    </svg>
  )
}
