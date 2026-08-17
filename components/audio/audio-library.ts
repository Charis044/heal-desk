"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const VINYL_PLAYLIST = "/audio/vinyl/playlist.json"

type VinylPlaylist = {
  tracks?: unknown
}

function normalizeTrackPath(track: string) {
  if (track.startsWith("/")) return track
  return `/audio/vinyl/${track}`
}

/** Owns one looping channel and picks a random library track per record swap. */
export function useVinylAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playlistRef = useRef<string[]>([])
  const currentTrackRef = useRef<string | null>(null)
  const switchRequestRef = useRef(0)
  const pendingAudiosRef = useRef(new Set<HTMLAudioElement>())
  const mutedRef = useRef(false)
  const [isMuted, setIsMuted] = useState(false)

  const playRandomTrack = useCallback(() => {
    const tracks = playlistRef.current
    if (tracks.length === 0) return

    const alternatives =
      tracks.length > 1
        ? tracks.filter((track) => track !== currentTrackRef.current)
        : tracks
    const candidates = [...alternatives].sort(() => Math.random() - 0.5)
    const requestId = ++switchRequestRef.current

    void (async () => {
      for (const nextTrack of candidates) {
        const candidate = new Audio(normalizeTrackPath(nextTrack))
        candidate.preload = "auto"
        candidate.loop = true
        candidate.volume = 0.55
        candidate.muted = mutedRef.current
        pendingAudiosRef.current.add(candidate)

        try {
          await candidate.play()
        } catch {
          pendingAudiosRef.current.delete(candidate)
          playlistRef.current = playlistRef.current.filter(
            (track) => track !== nextTrack,
          )
          continue
        }

        if (switchRequestRef.current !== requestId) {
          pendingAudiosRef.current.delete(candidate)
          candidate.pause()
          candidate.src = ""
          return
        }

        const previous = audioRef.current
        pendingAudiosRef.current.delete(candidate)
        candidate.muted = mutedRef.current
        audioRef.current = candidate
        currentTrackRef.current = nextTrack
        previous?.pause()
        if (previous) previous.src = ""
        return
      }
    })()
  }, [])

  const toggleMuted = useCallback(() => {
    setIsMuted((current) => {
      const next = !current
      mutedRef.current = next
      if (audioRef.current) audioRef.current.muted = next
      pendingAudiosRef.current.forEach((audio) => {
        audio.muted = next
      })
      return next
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    void fetch(VINYL_PLAYLIST, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Vinyl playlist is unavailable")
        return response.json() as Promise<VinylPlaylist>
      })
      .then((playlist) => {
        if (cancelled || !Array.isArray(playlist.tracks)) return
        const listedTracks = playlist.tracks.filter(
          (track): track is string =>
            typeof track === "string" && track.trim().length > 0,
        )

        return Promise.all(
          listedTracks.map(async (track) => {
            try {
              const response = await fetch(normalizeTrackPath(track), {
                method: "HEAD",
                cache: "no-store",
              })
              return response.ok ? track : null
            } catch {
              return null
            }
          }),
        ).then((checkedTracks) => {
          if (cancelled) return
          playlistRef.current = checkedTracks.filter(
            (track): track is string => track !== null,
          )
        })
      })
      .catch(() => {
        playlistRef.current = []
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      switchRequestRef.current += 1
      pendingAudiosRef.current.forEach((pendingAudio) => {
        pendingAudio.pause()
        pendingAudio.src = ""
      })
      pendingAudiosRef.current.clear()
      const audio = audioRef.current
      audio?.pause()
      if (audio) audio.src = ""
    }
  }, [])

  return { playRandomTrack, isMuted, toggleMuted }
}
