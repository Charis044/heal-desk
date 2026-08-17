import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"

export type PaperVariant =
  | "torn"
  | "note"
  | "notebook"
  | "lined"
  | "graph"
  | "kraft"

export type TapeKind = "washi" | "red" | "stripe" | "gold" | "maroon"

type PaperSheetProps = {
  children: ReactNode
  className?: string
  variant?: PaperVariant
  tape?: TapeKind | TapeKind[]
  sticker?: boolean
}

const TEXTURE: Record<PaperVariant, string> = {
  torn: "/assets/papers/lined.png",
  note: "/assets/papers/lined.png",
  lined: "/assets/papers/lined.png",
  graph: "/assets/papers/graph.png",
  notebook: "/assets/papers/notebook.png",
  kraft: "/assets/scrap/paper-kraft.png",
}

const TAPE_SRC: Record<TapeKind, string> = {
  washi: "/assets/scrap/tape-washi.png",
  red: "/assets/scrap/tape-red.png",
  stripe: "/assets/scrap/tape-stripe.png",
  gold: "/assets/scrap/tape-gold.png",
  maroon: "/assets/scrap/tape-maroon.png",
}

const TAPE_SLOT: Record<TapeKind, string[]> = {
  washi: [
    "absolute -top-1 left-2 w-[52px] mix-blend-multiply drop-shadow-[0_3px_6px_rgba(0,0,0,0.18)]",
    "absolute -top-1 right-2 w-[52px] -scale-x-100 mix-blend-multiply drop-shadow-[0_3px_6px_rgba(0,0,0,0.18)]",
  ],
  stripe: [
    "absolute -top-1 left-1/2 w-[88px] -translate-x-1/2 mix-blend-multiply drop-shadow-[0_3px_6px_rgba(0,0,0,0.16)]",
  ],
  red: [
    "absolute -top-3 left-1/2 w-[16px] -translate-x-1/2 rotate-[3deg] drop-shadow-[0_4px_8px_rgba(0,0,0,0.22)]",
  ],
  gold: [
    "absolute -top-1 right-2 w-[72px] rotate-[12deg] mix-blend-multiply drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]",
  ],
  maroon: [
    "absolute -top-1 left-2 w-[18px] -rotate-[14deg] drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]",
  ],
}

const DEFAULT_TAPE: Partial<Record<PaperVariant, TapeKind[]>> = {
  torn: ["washi", "washi"],
  note: ["washi"],
  lined: ["washi", "washi"],
  graph: ["washi", "stripe"],
  kraft: ["red"],
  notebook: ["washi"],
}

const TORN_CLIP = "polygon(1% 0, 99.4% 0.7%, 100% 98.8%, 1.2% 100%, 0 2%)"

function textureStyle(variant: PaperVariant): CSSProperties {
  const texture = TEXTURE[variant]
  const wash =
    variant === "kraft"
      ? "linear-gradient(165deg, rgba(255,236,214,0.28), rgba(168,112,64,0.18))"
      : "linear-gradient(165deg, rgba(255,252,246,0.58), rgba(245,234,216,0.38))"

  if (variant === "notebook") {
    return {
      backgroundColor: "#f4eee3",
      backgroundImage: `url('${texture}')`,
      backgroundPosition: "left top",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
    }
  }

  return {
    backgroundColor: variant === "kraft" ? "#c9a06a" : "#efe6d6",
    backgroundImage: `${wash}, url('${texture}')`,
    backgroundPosition: "center, center",
    backgroundSize: "cover, cover",
    backgroundBlendMode: "soft-light, normal",
  }
}

function PaperTapes({ kinds }: { kinds: TapeKind[] }) {
  const used: Record<string, number> = {}
  const washiTotal = kinds.filter((k) => k === "washi").length
  return (
    <>
      {kinds.map((kind, i) => {
        const slots = TAPE_SLOT[kind]
        const idx = used[kind] ?? 0
        used[kind] = idx + 1
        const slotIdx =
          kind === "washi" && washiTotal === 1 ? 1 : idx % slots.length
        return (
          <img
            key={`${kind}-${i}`}
            src={TAPE_SRC[kind]}
            alt=""
            draggable={false}
            className={cn("pointer-events-none select-none", slots[slotIdx])}
          />
        )
      })}
    </>
  )
}

/**
 * Physical paper sitting on the corkboard — real textures, washi, stickers.
 * Tape is clipped to the sheet’s top edge so it cannot cover body text.
 */
export function PaperSheet({
  children,
  className,
  variant = "torn",
  tape,
  sticker,
}: PaperSheetProps) {
  const kinds = tape
    ? Array.isArray(tape)
      ? tape
      : [tape]
    : DEFAULT_TAPE[variant] ?? []
  const showSticker = sticker ?? variant === "notebook"
  const torn = variant === "torn"

  return (
    <section
      className={cn("relative overflow-visible text-[#241b16]", className)}
      style={
        variant === "notebook"
          ? {
              ...textureStyle(variant),
              filter: "drop-shadow(0 22px 48px rgba(0,0,0,0.32))",
            }
          : undefined
      }
    >
      {variant !== "notebook" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            ...textureStyle(variant),
            clipPath: torn ? TORN_CLIP : undefined,
            filter: "drop-shadow(0 20px 44px rgba(0,0,0,0.3))",
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 -top-2 z-[1] h-[18px] overflow-hidden">
        <PaperTapes kinds={kinds} />
      </div>
      {showSticker && (
        <img
          src="/assets/scrap/blue-butterfly-tl.png"
          alt=""
          draggable={false}
          className="pointer-events-none absolute right-[6.5%] top-[3.8%] z-[2] w-[18%] max-w-[88px] select-none opacity-90 mix-blend-multiply"
        />
      )}
      {variant === "notebook" ? (
        <div className="paper-notebook-body relative z-10">{children}</div>
      ) : (
        <div className="relative z-10">{children}</div>
      )}
    </section>
  )
}

export function PaperTape({
  kind,
  className,
}: {
  kind: TapeKind
  className?: string
}) {
  return (
    <img
      src={TAPE_SRC[kind]}
      alt=""
      draggable={false}
      className={cn(
        "pointer-events-none absolute z-[1] select-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.18)]",
        className,
      )}
    />
  )
}
