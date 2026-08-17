"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const NAV_ITEMS = ["今日", "记录", "成长"] as const

/**
 * Quiet top-right nav — text links, no rectangular buttons.
 */
export function TopNavigation() {
  const router = useRouter()
  const [active, setActive] = useState<(typeof NAV_ITEMS)[number]>("今日")

  return (
    <nav
      className="pointer-events-auto absolute right-7 top-7 z-50 flex items-center gap-1 sm:right-8 sm:gap-1.5"
      aria-label="主导航"
    >
      <ul className="flex items-center gap-0.5 sm:gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item === active
          return (
            <li key={item}>
              <button
                type="button"
                onClick={() => {
                  setActive(item)
                  if (item === "成长") router.push("/analysis")
                  if (item === "记录") router.push("/history")
                }}
                className={[
                  "rounded-full px-2.5 py-1 font-serif text-[16px] tracking-wide transition-[opacity,transform,background-color,color] duration-300 ease-out [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]",
                  "hover:scale-[1.015] hover:opacity-100",
                  isActive
                    ? "bg-[rgba(255,255,255,0.22)] text-[rgba(255,252,245,0.98)] opacity-100"
                    : "bg-transparent text-[rgba(255,248,238,0.86)] opacity-100 hover:text-[rgba(255,252,245,1)]",
                  // On narrow screens keep only 今日 + profile feel quieter
                  item !== "今日" ? "max-md:hidden" : "",
                ].join(" ")}
              >
                {item}
              </button>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        aria-label="个人与设置"
        className="ml-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.36)] bg-[rgba(255,255,255,0.2)] text-[rgba(255,252,245,0.95)] backdrop-blur-[8px] transition-[opacity,transform] duration-300 ease-out hover:scale-[1.015] hover:opacity-100 sm:ml-2"
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
