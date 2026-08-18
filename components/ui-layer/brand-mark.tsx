"use client"

/**
 * Compact editorial brand mark — hand-crafted, not corporate.
 */
export function BrandMark() {
  return (
    <a
      href="/"
      className="pointer-events-auto absolute left-6 top-5 z-50 flex items-start gap-2.5 rounded-2xl border border-white/18 bg-[rgba(23,18,34,0.42)] px-3 py-2.5 text-[rgba(255,252,245,0.96)] shadow-[0_8px_28px_rgba(0,0,0,0.2)] backdrop-blur-md transition-[opacity,transform,color] duration-300 ease-out hover:scale-[1.015] hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/55 sm:left-8 sm:top-7"
      aria-label="韧芽 Resilience Sprout"
    >
      <SproutMark />
      <span className="flex flex-col leading-none">
        <span
          className="font-serif text-[22px] font-medium tracking-[0.04em]"
          style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}
        >
          韧芽
        </span>
        <span
          className="mt-1.5 font-serif text-[11px] font-normal uppercase tracking-[0.2em] text-[rgba(255,248,238,0.82)]"
          style={{ textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}
        >
          Resilience Sprout
        </span>
      </span>
    </a>
  )
}

function SproutMark() {
  return (
    <svg
      width="16"
      height="21"
      viewBox="0 0 14 18"
      fill="none"
      aria-hidden
      className="mt-1 shrink-0 opacity-90"
    >
      <path
        d="M7 17.5V8.2"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M7 9.2C7 9.2 3.2 8.4 2.1 5.2C1.4 3.2 2.6 1.4 4.4 1.8C6.4 2.2 7 5.4 7 5.4"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(255,248,238,0.12)"
      />
      <path
        d="M7 7.8C7 7.8 10.2 6.6 11.4 3.8C12.2 2.1 11.2 0.9 9.6 1.4C7.8 2 7 4.8 7 4.8"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(255,248,238,0.08)"
      />
    </svg>
  )
}
