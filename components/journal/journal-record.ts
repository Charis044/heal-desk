import type { EmotionId } from "@/components/scene/emotion-theme"

export type JournalRecord = {
  id: string
  pages: string[]
  emotion: EmotionId
  sequence: number
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "resilience-journal-records"

export function readJournalRecords(): JournalRecord[] {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (!value) return []

    const parsed = JSON.parse(value) as JournalRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeJournalRecords(records: JournalRecord[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // The in-memory state still works when storage is unavailable.
  }
}

export function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}
