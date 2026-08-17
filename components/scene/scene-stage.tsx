"use client"

import type { ReactNode } from "react"

/**
 * Native artboard of the desk illustration (1024×512).
 * All layers share this locked ratio so the room scales as one unit.
 */
export const SCENE_WIDTH = 1024
export const SCENE_HEIGHT = 512

type SceneStageProps = {
  children: ReactNode
  /** Viewport-fixed UI overlay — not part of the artboard. */
  overlay?: ReactNode
}

/**
 * Fills the viewport (cover) — no letterbox bars.
 * Artboard scales as one unit; overflow is cropped. Bottom-aligned so the
 * desk stays in frame when the sky is clipped on tall screens.
 */
export function SceneStage({ children, overlay }: SceneStageProps) {
  return (
    <main
      className="relative h-[100dvh] w-full overflow-hidden"
      style={{ backgroundColor: "#141021" }}
    >
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden"
        style={{
          aspectRatio: `${SCENE_WIDTH} / ${SCENE_HEIGHT}`,
          width: `max(100vw, calc(100dvh * ${SCENE_WIDTH} / ${SCENE_HEIGHT}))`,
          height: `max(100dvh, calc(100vw * ${SCENE_HEIGHT} / ${SCENE_WIDTH}))`,
        }}
      >
        {children}
      </div>
      {overlay}
    </main>
  )
}
