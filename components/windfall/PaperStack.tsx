"use client";

import { getEmotion } from "@/lib/emotions";
import type { DiarySummary } from "@/lib/types";
import type { CSSProperties } from "react";

interface PaperStackProps {
  entries: DiarySummary[];
  onOpen: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}.${m}.${day}`;
}

export default function PaperStack({ entries, onOpen }: PaperStackProps) {
  const latest = entries[0];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="stack block w-full text-left"
      aria-label="打开过往记录"
    >
      <div className="relative" style={{ height: "150px" }}>
        {/* 底层纸堆 */}
        <div className="stack-sheet s1" />
        <div className="stack-sheet s2" />
        <div className="stack-sheet s3" />

        {/* 顶层纸张 */}
        <div className="stack-top">
          {latest ? (
            <div className="flex items-start gap-3">
              <span
                className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
                style={{
                  background: getEmotion(latest.emotion).color,
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.25)",
                } as CSSProperties}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[0.72rem] text-[#9a8b78]">
                    {formatDate(latest.created_at)}
                  </span>
                  <span className="text-[0.72rem] text-[#9a8b78]">
                    {getEmotion(latest.emotion).label}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[0.9rem] leading-relaxed text-[#4a3b2e]">
                  {latest.content}
                </p>
                {latest.resilience_score > 0 && (
                  <p className="mt-1.5 line-clamp-1 text-[0.78rem] text-[#67944b]">
                    韧性 · {latest.resilience_score}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-[#9a8b78]">
              <p className="text-[0.9rem]">这里还很安静</p>
              <p className="mt-1 text-[0.78rem]">写下第一篇记录吧</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[0.85rem] font-semibold text-[#5a4030]">
          过往记录
        </span>
        <span className="flex items-center gap-1.5 text-[0.8rem] text-[#8a7156]">
          共 {entries.length} 篇
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </button>
  );
}
