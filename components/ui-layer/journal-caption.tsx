"use client"

/**
 * Handwritten-feeling journal annotation — bottom right, very quiet.
 */
export function JournalCaption() {
  return (
    <div
      className="pointer-events-none absolute bottom-6 right-5 z-50 max-w-[220px] rounded-2xl border border-white/18 bg-[rgba(23,18,34,0.5)] px-4 py-3 text-right text-[rgba(255,252,245,0.94)] shadow-[0_8px_28px_rgba(0,0,0,0.2)] backdrop-blur-md md:bottom-9 md:right-10"
    >
      <p className="font-serif text-[14px] tracking-[0.12em]">今日 · 08.17</p>
      <p className="mt-1.5 font-serif text-[15px] leading-relaxed tracking-wide text-[rgba(255,248,238,0.84)]">
        写一点，留下些什么。
      </p>
    </div>
  )
}
