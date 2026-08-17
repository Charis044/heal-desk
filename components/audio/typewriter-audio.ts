export const TYPEWRITER_SOUND = "/audio/typewriter-key.mp3"
export const TYPEWRITER_RETURN_SOUND = "/audio/typewriter-return.mp3"

type TypewriterSound = "key" | "return"

const SOUND_SOURCES: Record<TypewriterSound, string> = {
  key: TYPEWRITER_SOUND,
  return: TYPEWRITER_RETURN_SOUND,
}

const SOUND_VOLUMES: Record<TypewriterSound, number> = {
  key: 0.28,
  return: 0.38,
}

const FALLBACK_POOL_SIZES: Record<TypewriterSound, number> = {
  key: 8,
  return: 3,
}

let audioContext: AudioContext | null = null
let preloadPromise: Promise<void> | null = null
let unlockListenerCleanup: (() => void) | null = null

const decodedBuffers = new Map<TypewriterSound, AudioBuffer>()
const gainNodes = new Map<TypewriterSound, GainNode>()
const fallbackPools = new Map<TypewriterSound, HTMLAudioElement[]>()
const fallbackPoolIndexes: Record<TypewriterSound, number> = {
  key: 0,
  return: 0,
}

function getAudioContext() {
  if (typeof window === "undefined" || !window.AudioContext) return null
  audioContext ??= new window.AudioContext({ latencyHint: "interactive" })
  return audioContext
}

function createFallbackPool(sound: TypewriterSound) {
  if (typeof window === "undefined" || fallbackPools.has(sound)) return

  const pool = Array.from(
    { length: FALLBACK_POOL_SIZES[sound] },
    () => {
      const audio = new Audio(SOUND_SOURCES[sound])
      audio.preload = "auto"
      audio.volume = SOUND_VOLUMES[sound]
      audio.load()
      return audio
    },
  )
  fallbackPools.set(sound, pool)
}

async function decodeSound(context: AudioContext, sound: TypewriterSound) {
  try {
    const response = await fetch(SOUND_SOURCES[sound], {
      cache: "force-cache",
    })
    if (!response.ok) return

    const encodedAudio = await response.arrayBuffer()
    const buffer = await context.decodeAudioData(encodedAudio)
    decodedBuffers.set(sound, buffer)
  } catch {
    // The preloaded HTMLAudio pool remains available as a compatibility path.
  }
}

/**
 * Starts fetching and decoding both mechanical sounds before the editor opens.
 * This never updates React state and stays outside the render lifecycle.
 */
export function preloadTypewriterAudio() {
  if (typeof window === "undefined") return Promise.resolve()
  if (preloadPromise) return preloadPromise

  createFallbackPool("key")
  createFallbackPool("return")

  const context = getAudioContext()
  if (!context) {
    preloadPromise = Promise.resolve()
    return preloadPromise
  }

  for (const sound of Object.keys(SOUND_SOURCES) as TypewriterSound[]) {
    const gain = context.createGain()
    gain.gain.value = SOUND_VOLUMES[sound]
    gain.connect(context.destination)
    gainNodes.set(sound, gain)
  }

  preloadPromise = Promise.all([
    decodeSound(context, "key"),
    decodeSound(context, "return"),
  ]).then(() => undefined)

  return preloadPromise
}

function resumeAudioContext() {
  const context = getAudioContext()
  if (!context || context.state === "running") return
  void context.resume().catch(() => undefined)
}

/**
 * Keeps the Web Audio context awake from the user's earliest gesture.
 * Mount this once near the editor, before the first typing interaction.
 */
export function installTypewriterAudioUnlock() {
  if (typeof window === "undefined") return () => undefined
  if (unlockListenerCleanup) return unlockListenerCleanup

  const unlock = () => resumeAudioContext()
  const options = { capture: true, passive: true } as const

  window.addEventListener("pointerdown", unlock, options)
  window.addEventListener("touchstart", unlock, options)
  window.addEventListener("keydown", unlock, { capture: true })

  unlockListenerCleanup = () => {
    window.removeEventListener("pointerdown", unlock, options)
    window.removeEventListener("touchstart", unlock, options)
    window.removeEventListener("keydown", unlock, { capture: true })
    unlockListenerCleanup = null
  }

  return unlockListenerCleanup
}

function playFromFallbackPool(
  sound: TypewriterSound,
  playbackRate: number,
) {
  let pool = fallbackPools.get(sound)
  if (!pool?.length) {
    createFallbackPool(sound)
    pool = fallbackPools.get(sound)
  }
  if (!pool?.length) return

  const available = pool.find((audio) => audio.paused || audio.ended)
  const index = fallbackPoolIndexes[sound]
  const player = available ?? pool[index]
  fallbackPoolIndexes[sound] = (index + 1) % pool.length

  player.pause()
  player.currentTime = 0
  player.playbackRate = playbackRate
  void player.play().catch(() => undefined)
}

function startBuffer(
  context: AudioContext,
  sound: TypewriterSound,
  playbackRate: number,
) {
  const buffer = decodedBuffers.get(sound)
  const gain = gainNodes.get(sound)
  if (!buffer || !gain) return false

  const source = context.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = playbackRate
  source.connect(gain)
  source.addEventListener("ended", () => source.disconnect(), { once: true })
  source.start()
  return true
}

function playSound(sound: TypewriterSound, playbackRate = 1) {
  if (typeof window === "undefined") return

  const context = getAudioContext()
  if (!context || !decodedBuffers.has(sound)) {
    playFromFallbackPool(sound, playbackRate)
    return
  }

  if (context.state === "running") {
    startBuffer(context, sound, playbackRate)
    return
  }

  const requestedAt = performance.now()
  void context
    .resume()
    .then(() => {
      // Do not emit a stale keystroke after a long tab suspension.
      if (performance.now() - requestedAt < 100) {
        startBuffer(context, sound, playbackRate)
      }
    })
    .catch(() => playFromFallbackPool(sound, playbackRate))
}

export function playTypewriterKey() {
  playSound("key", 0.96 + Math.random() * 0.08)
}

export function playTypewriterReturn() {
  playSound("return")
}
