import { ScrapDecor } from "@/components/ui-layer/scrap-decor"

/**
 * Sub-page atmosphere: corkboard collage, cover-fitted to the viewport.
 * Homepage keeps the illustrated night room and does not use this.
 */
export function NightAtmosphere({
  intensity = "page",
}: {
  intensity?: "page" | "overlay"
}) {
  const wash =
    intensity === "overlay"
      ? "linear-gradient(180deg, rgba(20,16,33,0.46), rgba(20,16,33,0.66) 78%)"
      : "linear-gradient(180deg, rgba(20,16,33,0.3), rgba(20,16,33,0.52) 80%)"

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden
    >
      <img
        src="/assets/subpage-board.png"
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover object-center"
      />
      <div className="absolute inset-0" style={{ background: wash }} />
      <ScrapDecor density={intensity} />
    </div>
  )
}
