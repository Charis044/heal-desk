"use client"

import { InteractiveObject } from "./interactive-object"

type TypewriterProps = {
  onSelect?: () => void
}

/** Typewriter — right side of the desk, ~15° CCW. */
export function Typewriter({ onSelect }: TypewriterProps) {
  return (
    <InteractiveObject
      src="/assets/typewriter.png"
      alt="Vintage typewriter — write tonight's entry"
      glowColor="rgba(180, 214, 214, 0.9)"
      rotate={-6}
      priority
      idleDelay={0.8}
      onSelect={onSelect}
      style={{
        left: "44%",
        top: "29%",
        width: "30%",
        height: "55%",
        zIndex: 24,
      }}
    />
  )
}
