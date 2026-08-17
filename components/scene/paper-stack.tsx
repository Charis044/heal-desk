"use client"

import { InteractiveObject } from "./interactive-object"

type PaperStackProps = {
  onSelect?: () => void
}

/** Paper stack — lower-left foreground. */
export function PaperStack({ onSelect }: PaperStackProps) {
  return (
    <InteractiveObject
      src="/assets/paper-stack.png"
      alt="A stack of finished journal pages — revisit past entries"
      glowColor="rgba(240, 216, 168, 0.9)"
      rotate={8}
      idleDelay={1.6}
      onSelect={onSelect}
      style={{
        right: "8%",
        top: "55%",
        width: "23%",
        height: "40%",
        zIndex: 25,
      }}
    />
  )
}
