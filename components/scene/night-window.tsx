"use client"

import { motion } from "framer-motion"

/**
 * Night sky behind the desk window cutouts.
 * Fills the artboard; only a gentle horizontal drift.
 */
export function NightWindow() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute inset-[-2%]"
        style={{ willChange: "transform" }}
        animate={{ x: ["-0.4%", "0.4%", "-0.4%"] }}
        transition={{
          duration: 14,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        <img
          src="/assets/night-window.png"
          alt="Night sky with a crescent moon drifting over a distant city"
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover object-[center_35%]"
        />
      </motion.div>

      <SparseParticles />
    </div>
  )
}

function SparseParticles() {
  const motes = [
    { left: "28%", top: "10%", size: "0.35%", delay: 0, dur: 9 },
    { left: "48%", top: "6%", size: "0.25%", delay: 2.5, dur: 11 },
    { left: "62%", top: "12%", size: "0.3%", delay: 1.2, dur: 10 },
    { left: "72%", top: "8%", size: "0.25%", delay: 3.4, dur: 12 },
    { left: "38%", top: "14%", size: "0.25%", delay: 4.1, dur: 10 },
  ]

  return (
    <>
      {motes.map((m, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            aspectRatio: "1",
            background: "rgba(255, 240, 205, 0.85)",
            boxShadow: "0 0 0.4vmin rgba(255, 236, 190, 0.65)",
          }}
          animate={{ opacity: [0, 0.85, 0], y: ["0%", "-20%", "0%"] }}
          transition={{
            duration: m.dur,
            delay: m.delay,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        />
      ))}
    </>
  )
}
