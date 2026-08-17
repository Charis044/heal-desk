"use client"

import { useEffect, useState } from "react"
import { SceneStage } from "./scene-stage"
import { NightWindow } from "./night-window"
import { Desk } from "./desk"
import { CupSteam } from "./cup-steam"
import { RecordPlayer } from "./record-player"
import { Typewriter } from "./typewriter"
import { PaperStack } from "./paper-stack"
import { TeddyBear } from "./teddy-bear"
import { SceneUI } from "@/components/ui-layer/scene-ui"
import { EmotionOrbOverlay } from "@/components/ui-layer/emotion-orb-overlay"
import { JournalEditorOverlay } from "@/components/ui-layer/journal-editor-overlay"
import { JournalArchiveOverlay } from "@/components/ui-layer/journal-archive-overlay"
import {
  isSameLocalDay,
  readJournalRecords,
  writeJournalRecords,
  type JournalRecord,
} from "@/components/journal/journal-record"
import { useVinylAudio } from "@/components/audio/audio-library"
import { syncJournalToBackend } from "@/lib/backend-bridge"
import type { EmotionId } from "./emotion-theme"

/**
 * The whole illustrated room, composed from independently animated layers.
 *
 * Layer order (back -> front):
 *   NightWindow  — drifting sky behind the glass
 *   Desk         — static wooden surface the objects rest on
 *   RecordPlayer — left
 *   TeddyBear    — center
 *   Typewriter   — right, lazily tilted
 *   PaperStack   — lower-left foreground
 *
 * SceneUI sits on the viewport (overlay), not inside the artboard.
 */
export function ResilienceScene() {
  const { playRandomTrack, isMuted, toggleMuted } = useVinylAudio()
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId>("calm")
  const [isEmotionPickerOpen, setIsEmotionPickerOpen] = useState(false)
  const [isJournalOpen, setIsJournalOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [records, setRecords] = useState<JournalRecord[]>([])
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null)
  const editingRecord =
    records.find((record) => record.id === editingRecordId) ?? null
  const todaysRecords = records.filter((record) =>
    isSameLocalDay(new Date(record.createdAt), new Date()),
  )
  const newSequence =
    todaysRecords.reduce(
      (highest, record) => Math.max(highest, record.sequence),
      0,
    ) + 1

  useEffect(() => {
    setRecords(readJournalRecords())
  }, [])

  return (
    <SceneStage
      overlay={
        <>
          <SceneUI />
          <EmotionOrbOverlay
            open={isEmotionPickerOpen}
            selected={selectedEmotion}
            onClose={() => setIsEmotionPickerOpen(false)}
            onSelect={(emotion) => {
              playRandomTrack()
              setSelectedEmotion(emotion)
              setIsEmotionPickerOpen(false)
            }}
          />
          <JournalArchiveOverlay
            open={isArchiveOpen}
            records={records}
            onClose={() => setIsArchiveOpen(false)}
            onOpenRecord={(record) => {
              setEditingRecordId(record.id)
              setIsArchiveOpen(false)
              setIsJournalOpen(true)
            }}
          />
          <JournalEditorOverlay
            open={isJournalOpen}
            emotion={selectedEmotion}
            record={editingRecord}
            newSequence={newSequence}
            onClose={() => setIsJournalOpen(false)}
            onSave={(pages: string[]) => {
              const now = new Date().toISOString()

              setRecords((currentRecords) => {
                const nextRecords = editingRecord
                  ? currentRecords.map((record) =>
                      record.id === editingRecord.id
                        ? { ...record, pages, updatedAt: now }
                        : record,
                    )
                  : [
                      ...currentRecords,
                      {
                        id: window.crypto.randomUUID(),
                        pages,
                        emotion: selectedEmotion,
                        sequence: newSequence,
                        createdAt: now,
                        updatedAt: now,
                      },
                    ]

                writeJournalRecords(nextRecords)
                return nextRecords
              })

              // 镜像到后端日记仓，供「成长分析」读取真实数据（尽力而为，失败不影响本地体验）
              void syncJournalToBackend(pages, selectedEmotion)

              setEditingRecordId(null)
              setIsJournalOpen(false)
            }}
            onDelete={() => {
              if (!editingRecord) return

              setRecords((currentRecords) => {
                const nextRecords = currentRecords.filter(
                  (record) => record.id !== editingRecord.id,
                )
                writeJournalRecords(nextRecords)
                return nextRecords
              })

              setEditingRecordId(null)
              setIsJournalOpen(false)
              setIsArchiveOpen(true)
            }}
          />
        </>
      }
    >
      <NightWindow />
      <Desk />
      <CupSteam />

      <RecordPlayer
        emotion={selectedEmotion}
        muted={isMuted}
        onToggleMute={toggleMuted}
        onSelect={() => {
          setIsJournalOpen(false)
          setIsArchiveOpen(false)
          setIsEmotionPickerOpen(true)
        }}
      />
      <TeddyBear />
      <Typewriter
        onSelect={() => {
          setIsEmotionPickerOpen(false)
          setIsArchiveOpen(false)
          setEditingRecordId(null)
          setIsJournalOpen(true)
        }}
      />
      <PaperStack
        onSelect={() => {
          setIsEmotionPickerOpen(false)
          setIsJournalOpen(false)
          setEditingRecordId(null)
          setIsArchiveOpen(true)
        }}
      />

      {/* soft vignette — keeps focus on the desk without a UI frame */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 90% 85% at 50% 55%, transparent 40%, rgba(8,6,14,0.45) 100%)",
        }}
      />
    </SceneStage>
  )
}
