"use client"

/**
 * Quiet top-right control — avatar only (login later).
 */
export function TopNavigation() {
  return (
    <nav
      className="pointer-events-auto absolute right-7 top-7 z-50 sm:right-8"
      aria-label="个人"
    >
      <button
        type="button"
        aria-label="个人与登录"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.36)] bg-[rgba(255,255,255,0.2)] text-[rgba(255,252,245,0.95)] backdrop-blur-[8px] transition-[opacity,transform] duration-300 ease-out hover:scale-[1.015] hover:opacity-100"
      >
        <ProfileGlyph />
      </button>
    </nav>
  )
}

function ProfileGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="5.5" r="2.4" stroke="currentColor" strokeWidth="1.15" />
      <path
        d="M3.2 13.2c.6-2.4 2.2-3.6 4.8-3.6s4.2 1.2 4.8 3.6"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  )
}
