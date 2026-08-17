"use client"

import { useRouter } from "next/navigation"
import { InteractiveObject } from "./interactive-object"

/** Central companion; opens the reserved AI analysis experience. */
export function TeddyBear() {
  const router = useRouter()

  return (
    <InteractiveObject
      src="/assets/comfort-bear.png?v=2"
      alt="陪伴小熊——针对一篇记录或一个具体问题的咨询"
      glowColor="rgba(244, 188, 120, 0.88)"
      rotate={-5}
      idleDelay={2.4}
      onSelect={() => router.push("/ai-analysis")}
      style={{
        left: "6%",
        bottom: "4%",
        width: "17%",
        height: "48%",
        zIndex: 22,
      }}
    />
  )
}
