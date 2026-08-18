import { cn } from "@/lib/utils"

type FunctionPageHeaderProps = {
  className?: string
  backLabel?: string
}

/**
 * Quiet brand + “back to desk” control shared by function pages.
 * Mirrors the homepage BrandMark: serif, wide tracking, frosted pill.
 */
export function FunctionPageHeader({
  className,
  backLabel = "返回桌面",
}: FunctionPageHeaderProps) {
  return (
    <header
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-6 sm:px-8",
        className,
      )}
    >
      <a
        href="/"
        className="rounded-xl border border-white/16 bg-[rgba(23,18,34,0.38)] px-3 py-2.5 flex items-start gap-2 font-serif text-[#fff8ee]/92 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md transition-[opacity,border-color] hover:border-white/30 hover:opacity-100"
        aria-label="韧芽 Resilience Sprout"
      >
        <SproutMark />
        <span className="flex flex-col leading-none">
          <span className="text-lg tracking-[0.08em]">韧芽</span>
          <span className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-[#fff8ee]/46">
            Resilience Sprout
          </span>
        </span>
      </a>
      <a
        href="/"
        className="rounded-full border border-white/22 bg-white/8 px-4 py-2 font-serif text-xs tracking-[0.12em] text-white/76 backdrop-blur-md transition-colors hover:border-white/40 hover:text-white"
      >
        {backLabel}
      </a>
    </header>
  )
}

function SproutMark() {
  return (
    <svg
      width="14"
      height="19"
      viewBox="0 0 14 18"
      fill="none"
      aria-hidden
      className="mt-0.5 shrink-0 opacity-90"
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
