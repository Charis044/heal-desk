"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  EMOTION_THEMES,
  type EmotionId,
} from "@/components/scene/emotion-theme"
import type { JournalRecord } from "@/components/journal/journal-record"
import {
  installTypewriterAudioUnlock,
  playTypewriterKey,
  playTypewriterReturn,
  preloadTypewriterAudio,
} from "@/components/audio/typewriter-audio"

type JournalEditorOverlayProps = {
  open: boolean
  emotion: EmotionId
  record: JournalRecord | null
  newSequence: number
  onSave: (pages: string[]) => void
  onDelete: () => void
  onClose: () => void
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date)
}

function getCaretPosition(textarea: HTMLTextAreaElement) {
  const computed = window.getComputedStyle(textarea)
  const mirror = document.createElement("div")
  const marker = document.createElement("span")

  Object.assign(mirror.style, {
    position: "fixed",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    boxSizing: computed.boxSizing,
    width: `${textarea.clientWidth}px`,
    padding: computed.padding,
    border: computed.border,
    font: computed.font,
    letterSpacing: computed.letterSpacing,
    lineHeight: computed.lineHeight,
  })

  mirror.textContent = textarea.value.slice(0, textarea.selectionStart)
  marker.textContent = "\u200b"
  mirror.appendChild(marker)
  document.body.appendChild(mirror)
  const position = {
    top: marker.offsetTop,
    left: marker.offsetLeft,
  }
  mirror.remove()
  return position
}

function findFittingOffset(textarea: HTMLTextAreaElement, value: string) {
  if (textarea.scrollHeight <= textarea.clientHeight + 1) return value.length

  const original = textarea.value
  let low = 0
  let high = value.length

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    textarea.value = value.slice(0, middle)

    if (textarea.scrollHeight <= textarea.clientHeight + 1) {
      low = middle
    } else {
      high = middle - 1
    }
  }

  textarea.value = original
  return low
}

export function JournalEditorOverlay({
  open,
  emotion,
  record,
  newSequence,
  onSave,
  onDelete,
  onClose,
}: JournalEditorOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const textareaRefs = useRef<Array<HTMLTextAreaElement | null>>([])
  const pendingFocusRef = useRef<{ page: number; position: number } | null>(null)
  const hasReachedMiddleRef = useRef(false)
  const lastCaretTopRef = useRef<number[]>([])
  const explicitReturnSoundRef = useRef(false)
  const [pages, setPages] = useState<string[]>([""])
  const [carriage, setCarriage] = useState({ page: 0, x: 0 })
  const activeEmotion = record?.emotion ?? emotion
  const theme = EMOTION_THEMES[activeEmotion]
  const sequence = record?.sequence ?? newSequence
  const entryDate = record ? new Date(record.createdAt) : new Date()

  useEffect(() => {
    void preloadTypewriterAudio()
    return installTypewriterAudioUnlock()
  }, [])

  const centerCaretGently = useCallback((textarea: HTMLTextAreaElement) => {
    const overlay = overlayRef.current
    if (!overlay) return

    const lineHeight = Number.parseFloat(
      window.getComputedStyle(textarea).lineHeight,
    )
    const textareaTopInScroll =
      textarea.getBoundingClientRect().top -
      overlay.getBoundingClientRect().top +
      overlay.scrollTop
    const currentLineY =
      textareaTopInScroll + getCaretPosition(textarea).top + lineHeight
    const viewportMiddle = overlay.scrollTop + overlay.clientHeight / 2

    if (currentLineY >= viewportMiddle - lineHeight * 0.25) {
      hasReachedMiddleRef.current = true
    }

    if (hasReachedMiddleRef.current) {
      const difference = currentLineY - viewportMiddle
      const smallStep = Math.max(-lineHeight, Math.min(lineHeight, difference))
      if (Math.abs(difference) > 2) {
        overlay.scrollBy({ top: smallStep, behavior: "smooth" })
      }
    }
  }, [])

  const updateCarriage = useCallback(
    (
      pageIndex: number,
      textarea: HTMLTextAreaElement,
      centerOnLineChange = true,
      playAutomaticReturn = false,
    ) => {
      const caret = getCaretPosition(textarea)
      const rightStart = Math.min(155, textarea.clientWidth * 0.25)
      const previousTop = lastCaretTopRef.current[pageIndex]
      const changedVisualLine =
        previousTop !== undefined && Math.abs(caret.top - previousTop) > 2

      lastCaretTopRef.current[pageIndex] = caret.top
      setCarriage({
        page: pageIndex,
        x: rightStart - caret.left * 0.5,
      })

      if (playAutomaticReturn) {
        if (changedVisualLine && !explicitReturnSoundRef.current) {
          playTypewriterReturn()
        }
        explicitReturnSoundRef.current = false
      }

      if (centerOnLineChange && changedVisualLine) {
        centerCaretGently(textarea)
      }
    },
    [centerCaretGently],
  )

  const applyPendingFocus = useCallback(() => {
    const pending = pendingFocusRef.current
    if (!pending) return

    const textarea = textareaRefs.current[pending.page]
    if (!textarea) return

    pendingFocusRef.current = null
    textarea.focus()
    textarea.setSelectionRange(pending.position, pending.position)
    updateCarriage(pending.page, textarea, false)

    const overlay = overlayRef.current
    if (overlay) {
      const textareaTop =
        textarea.getBoundingClientRect().top -
        overlay.getBoundingClientRect().top +
        overlay.scrollTop
      overlay.scrollTo({
        top: Math.max(0, textareaTop - overlay.clientHeight * 0.24),
        behavior: "smooth",
      })
    }
  }, [updateCarriage])

  useEffect(() => {
    if (!open) return

    setPages(record?.pages.length ? record.pages : [""])
    hasReachedMiddleRef.current = false
    lastCaretTopRef.current = []

    const focusFrame = window.requestAnimationFrame(() => {
      overlayRef.current?.scrollTo({ top: 0 })
      const firstTextarea = textareaRefs.current[0]
      if (firstTextarea) {
        firstTextarea.focus()
        firstTextarea.setSelectionRange(0, 0)
        updateCarriage(0, firstTextarea, false)
      }
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [open, record, updateCarriage])

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return

    for (let index = 0; index < pages.length; index += 1) {
      const textarea = textareaRefs.current[index]
      if (!textarea || textarea.scrollHeight <= textarea.clientHeight + 1) {
        continue
      }

      const fittingOffset = findFittingOffset(textarea, pages[index])
      const overflow = pages[index].slice(fittingOffset)
      const nextPages = [...pages]
      nextPages[index] = pages[index].slice(0, fittingOffset)
      nextPages[index + 1] = overflow + (nextPages[index + 1] ?? "")
      setPages(nextPages)
      window.requestAnimationFrame(applyPendingFocus)
      break
    }
  }, [applyPendingFocus, open, pages])

  const handlePageChange = (
    pageIndex: number,
    event: ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const textarea = event.target
    const value = textarea.value
    const caret = textarea.selectionStart
    const previousValue = pages[pageIndex] ?? ""
    if (
      value.length > previousValue.length &&
      value.slice(0, caret).endsWith("\n")
    ) {
      explicitReturnSoundRef.current = true
      playTypewriterReturn()
    }
    const fittingOffset = findFittingOffset(textarea, value)
    const nextPages = [...pages]

    if (fittingOffset < value.length) {
      if (!explicitReturnSoundRef.current) {
        explicitReturnSoundRef.current = true
        playTypewriterReturn()
      }
      const overflow = value.slice(fittingOffset)
      nextPages[pageIndex] = value.slice(0, fittingOffset)
      nextPages[pageIndex + 1] =
        overflow + (nextPages[pageIndex + 1] ?? "")

      if (caret > fittingOffset) {
        pendingFocusRef.current = {
          page: pageIndex + 1,
          position: caret - fittingOffset,
        }
      }
    } else {
      nextPages[pageIndex] = value
    }

    setPages(nextPages)
    const focusPage = pendingFocusRef.current?.page ?? pageIndex
    window.requestAnimationFrame(() => {
      applyPendingFocus()
      const activeTextarea = textareaRefs.current[focusPage]
      if (activeTextarea) {
        updateCarriage(focusPage, activeTextarea, true, true)
      }
    })
  }

  const handlePageKeyDown = (
    pageIndex: number,
    event: ReactKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    const isTypingKey =
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      (event.key.length === 1 ||
        event.key === "Backspace" ||
        event.key === "Delete")

    if (isTypingKey) {
      playTypewriterKey()
    }

    if (
      event.key !== "Backspace" ||
      pageIndex === 0 ||
      event.currentTarget.selectionStart !== 0 ||
      event.currentTarget.selectionEnd !== 0
    ) {
      return
    }

    event.preventDefault()
    const previousPage = pageIndex - 1

    if (pages[pageIndex].length === 0) {
      const nextPages = pages.filter((_, index) => index !== pageIndex)
      setPages(nextPages)
    }

    pendingFocusRef.current = {
      page: previousPage,
      position: pages[previousPage].length,
    }
    window.requestAnimationFrame(applyPendingFocus)
  }

  const saveAndClose = () => {
    const cleanedPages = [...pages]
    while (
      cleanedPages.length > 1 &&
      cleanedPages[cleanedPages.length - 1].trim() === ""
    ) {
      cleanedPages.pop()
    }
    onSave(cleanedPages)
  }

  const deleteRecord = () => {
    if (!record) return
    if (window.confirm("确定要删除这篇记录吗？删除后无法恢复。")) {
      onDelete()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          className="pointer-events-auto absolute inset-0 z-[80] overflow-y-auto bg-[rgba(8,7,12,0.32)] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          role="dialog"
          aria-modal="true"
          aria-label={record ? "修改记录" : "新建记录"}
        >
          <div className="fixed right-5 top-5 z-[90] flex items-center gap-2">
            {record && (
              <button
                type="button"
                onClick={deleteRecord}
                className="rounded-full border border-red-200/35 bg-black/20 px-4 py-2 font-serif text-sm tracking-wide text-red-100/80 backdrop-blur-sm transition-colors hover:border-red-100/60 hover:text-red-50"
              >
                删除
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/30 bg-black/20 px-4 py-2 font-serif text-sm tracking-wide text-white/82 backdrop-blur-sm transition-colors hover:border-white/55 hover:text-white"
            >
              取消
            </button>
            <button
              type="button"
              onClick={saveAndClose}
              className="rounded-full border border-white/45 bg-white/88 px-5 py-2 font-serif text-sm font-medium tracking-wide text-[#211a16] transition-colors hover:bg-white"
            >
              保存并退出
            </button>
          </div>

          <motion.div
            className="mx-auto my-[4dvh] flex w-full max-w-[720px] flex-col gap-7"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.99 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            {pages.map((page, pageIndex) => (
              <section
                key={pageIndex}
                className="relative flex h-[92dvh] min-h-[720px] flex-col overflow-hidden px-8 pb-12 pt-8 text-[#211a16] sm:px-14"
                style={{
                  clipPath:
                    pageIndex === 0
                      ? "polygon(148px 0, 100% 0, 100% 100%, 0 100%, 0 58px)"
                      : undefined,
                  backgroundColor: "#efe6d6",
                  backgroundImage:
                    "linear-gradient(165deg, rgba(255,252,246,0.5), rgba(245,234,216,0.3)), url('/assets/papers/lined.png')",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  filter: "drop-shadow(0 16px 28px rgba(0,0,0,0.32))",
                  transform:
                    carriage.page === pageIndex
                      ? `translateX(${carriage.x}px)`
                      : "translateX(0px)",
                  transition: "transform 75ms ease-out",
                  willChange:
                    carriage.page === pageIndex ? "transform" : "auto",
                }}
              >
                {pageIndex === 0 && (
                  <div
                    className="pointer-events-none absolute left-0 top-0 h-[58px] w-[148px]"
                    style={{
                      clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                      backgroundColor: "#d1c1ad",
                      backgroundImage:
                        "linear-gradient(154deg, rgba(255,255,255,0.5), rgba(88,65,46,0.18)), url('/assets/papers/lined.png')",
                      backgroundPosition: "top left",
                      backgroundSize: "720px auto",
                      borderRight: "1px solid rgba(68,49,36,0.2)",
                    }}
                    aria-hidden
                  />
                )}

                {pageIndex === 0 ? (
                  <>
                    <p
                      className="absolute left-3 top-[28px] z-10 w-[128px] origin-left font-serif text-[11px] tracking-[0.12em] text-[#352b24]/75"
                      style={{ transform: "rotate(-21deg)" }}
                    >
                      今日第 {sequence} 次记录
                    </p>

                    <header className="relative ml-auto flex min-h-[88px] max-w-[440px] flex-col items-end justify-start gap-2 pt-1 text-right font-serif">
                      <time className="text-sm tracking-[0.08em] text-black/80">
                        {formatDate(entryDate)}
                      </time>
                      <p className="text-sm tracking-wide text-black/75">
                        此刻是
                        <span
                          className="relative mx-1.5 inline-block px-1 font-medium text-black/90"
                          style={{
                            backgroundImage: `linear-gradient(transparent 42%, ${theme.color}9e 42%, ${theme.color}9e 88%, transparent 88%)`,
                          }}
                        >
                          {theme.label}
                        </span>
                      </p>
                    </header>
                    <div className="h-px w-full shrink-0 bg-black/35" />
                  </>
                ) : (
                  <div className="h-10 shrink-0" />
                )}

                <textarea
                  ref={(element) => {
                    textareaRefs.current[pageIndex] = element
                  }}
                  value={page}
                  onChange={(event) => handlePageChange(pageIndex, event)}
                  onKeyDown={(event) => handlePageKeyDown(pageIndex, event)}
                  onFocus={(event) =>
                    updateCarriage(pageIndex, event.currentTarget, false)
                  }
                  onClick={(event) =>
                    updateCarriage(pageIndex, event.currentTarget)
                  }
                  onKeyUp={(event) => {
                    if (
                      [
                        "ArrowLeft",
                        "ArrowRight",
                        "ArrowUp",
                        "ArrowDown",
                        "Home",
                        "End",
                      ].includes(event.key)
                    ) {
                      updateCarriage(pageIndex, event.currentTarget)
                    }
                  }}
                  className="mt-8 block min-h-0 w-full flex-1 resize-none overflow-hidden bg-transparent font-serif text-[17px] leading-[2.1rem] tracking-[0.035em] text-[#211a16] caret-[#37271f] outline-none placeholder:text-[#40342c]/38 sm:text-[18px]"
                  placeholder={
                    pageIndex === 0
                      ? "从此刻开始，写下你想留下的……"
                      : "继续写下去……"
                  }
                  aria-label={`记录正文第 ${pageIndex + 1} 页`}
                  spellCheck
                />

                <span className="pointer-events-none absolute bottom-5 right-7 font-serif text-[10px] tracking-[0.16em] text-black/35">
                  {pageIndex + 1}
                </span>
              </section>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
