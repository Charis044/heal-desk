"use client"

/**
 * Handwritten-feeling journal annotation — bottom right, very quiet.
 */
export function JournalCaption() {
  return (
    <div
      className="pointer-events-none absolute bottom-8 right-8 z-50 max-w-[180px] text-right text-[rgba(255,252,245,0.9)] md:bottom-9 md:right-10"
      style={{ textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}
    >
      <p className="font-serif text-[14px] tracking-[0.12em]">今日 · 08.17</p>
      <p className="mt-1.5 font-serif text-[15px] leading-relaxed tracking-wide text-[rgba(255,248,238,0.84)]">
        写一点，留下些什么。
      </p>
    </div>
  )
}
