"use client"

import { BrandMark } from "./brand-mark"
import { TopNavigation } from "./top-navigation"
import { JournalCaption } from "./journal-caption"

/**
 * Viewport-attached translucent stationery layer.
 * Sits above the illustrated room; never part of the artboard canvas.
 */
export function SceneUI() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-40"
      aria-label="界面"
    >
      <BrandMark />
      <TopNavigation />
      <JournalCaption />
    </div>
  )
}
