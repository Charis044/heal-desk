"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { EMOTION_THEMES } from "@/components/scene/emotion-theme"
import type { JournalRecord } from "@/components/journal/journal-record"

type JournalArchiveOverlayProps = {
  open: boolean
  records: JournalRecord[]
  onOpenRecord: (record: JournalRecord) => void
  onClose: () => void
}

function formatRecordDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function recordPreview(record: JournalRecord) {
  const text = record.pages.join("\n").replace(/\s+/g, " ").trim()
  return text || "这张便签还没有写下文字。"
}

export function JournalArchiveOverlay({
  open,
  records,
  onOpenRecord,
  onClose,
}: JournalArchiveOverlayProps) {
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open, onClose])

  const sortedRecords = [...records].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          className="pointer-events-auto absolute inset-0 z-[75] overflow-y-auto bg-[rgba(8,7,12,0.8)] px-5 py-16 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label="过往记录"
        >
          <button
            type="button"
            onClick={onClose}
            className="fixed right-5 top-5 z-[78] rounded-full border border-white/30 bg-black/20 px-4 py-2 font-serif text-sm tracking-wide text-white/85 backdrop-blur-sm transition-colors hover:border-white/55 hover:text-white"
          >
            收起纸叠
          </button>

          <div className="mx-auto w-full max-w-[920px]">
            <header className="mb-10 text-center text-white">
              <p className="font-serif text-2xl tracking-[0.16em]">过往记录</p>
              <p className="mt-2 font-serif text-sm tracking-wide text-white/58">
                点击一张便签，继续当时没有写完的话
              </p>
            </header>

            {sortedRecords.length === 0 ? (
              <div className="mx-auto max-w-md py-24 text-center font-serif text-white/62">
                纸叠还是空的。去打字机前，写下第一篇记录吧。
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:gap-7">
                {sortedRecords.map((record, index) => {
                  const emotion = EMOTION_THEMES[record.emotion]
                  return (
                    <motion.button
                      key={record.id}
                      type="button"
                      onClick={() => onOpenRecord(record)}
                      className="relative aspect-[4/3] overflow-hidden px-4 py-5 text-left text-[#241b16] sm:px-7 sm:py-6"
                      style={{
                        backgroundColor: "#e8ded0",
                        backgroundImage:
                          "url('/assets/journal-paper-texture.png')",
                        backgroundPosition: "center",
                        backgroundSize: "cover",
                        filter:
                          "drop-shadow(0 10px 16px rgba(0,0,0,0.3))",
                      }}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.35,
                        delay: Math.min(index * 0.04, 0.28),
                      }}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <span className="block font-serif text-[10px] tracking-wide text-black/48 sm:text-xs">
                        {formatRecordDate(record.updatedAt)}
                      </span>
                      <span className="mt-2 block font-serif text-sm text-black/72">
                        今日第 {record.sequence} 次 ·
                        <span
                          className="ml-1.5 px-1 font-medium text-black/85"
                          style={{
                            backgroundImage: `linear-gradient(transparent 42%, ${emotion.color}9e 42%, ${emotion.color}9e 88%, transparent 88%)`,
                          }}
                        >
                          {emotion.label}
                        </span>
                      </span>
                      <span className="mt-4 line-clamp-3 block font-serif text-sm leading-7 text-black/72 sm:text-base">
                        {recordPreview(record)}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
