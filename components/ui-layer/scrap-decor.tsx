import { cn } from "@/lib/utils"

type ScrapDecorProps = {
  density?: "page" | "overlay"
}

/**
 * Junk-journal fragments scattered on the corkboard, never intercepting clicks.
 */
export function ScrapDecor({ density = "page" }: ScrapDecorProps) {
  const rich = density === "page"

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      <img
        src="/assets/papers/journal-blue.png"
        alt=""
        className="absolute left-0 top-0 h-full w-[22%] object-cover opacity-[0.14] mix-blend-multiply"
      />
      <img
        src="/assets/scrap/blue-butterfly-tl.png"
        alt=""
        className="absolute -left-10 top-[7%] w-[168px] -rotate-[11deg] opacity-[0.78] mix-blend-multiply sm:w-[200px]"
      />
      <img
        src="/assets/scrap/tape-gold.png"
        alt=""
        className="absolute right-[6%] top-[11%] w-[118px] rotate-[18deg] opacity-80 drop-shadow-[0_8px_14px_rgba(0,0,0,0.28)] sm:w-[148px]"
      />
      {rich && (
        <img
          src="/assets/scrap/tape-lime.png"
          alt=""
          className="absolute right-[28%] top-[5%] w-[15px] rotate-[14deg] opacity-70 drop-shadow-[0_6px_10px_rgba(0,0,0,0.22)]"
        />
      )}
      {rich && (
        <img
          src="/assets/scrap/paper-green-linen.png"
          alt=""
          className="absolute -right-8 top-[38%] w-[150px] rotate-[8deg] opacity-70 drop-shadow-[0_10px_18px_rgba(0,0,0,0.25)] sm:w-[190px]"
        />
      )}
      <img
        src="/assets/scrap/blue-butterfly-br.png"
        alt=""
        className={cn(
          "absolute -right-6 bottom-[4%] w-[170px] rotate-[6deg] opacity-[0.74] mix-blend-multiply sm:w-[210px]",
          !rich && "hidden sm:block",
        )}
      />
      {rich && (
        <img
          src="/assets/scrap/paper-tan-grid.png"
          alt=""
          className="absolute -left-12 bottom-[18%] w-[130px] -rotate-[14deg] opacity-65 drop-shadow-[0_12px_20px_rgba(0,0,0,0.22)] sm:w-[168px]"
        />
      )}
      <img
        src="/assets/scrap/tape-blue.png"
        alt=""
        className="absolute left-[3%] top-[48%] w-[18px] rotate-[-8deg] opacity-75 drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)] sm:w-[22px]"
      />
      {rich && (
        <img
          src="/assets/scrap/paper-perf-cream.png"
          alt=""
          className="absolute left-[8%] top-[22%] w-[72px] rotate-[7deg] opacity-70 drop-shadow-[0_8px_14px_rgba(0,0,0,0.2)] sm:w-[92px]"
        />
      )}
      {rich && (
        <img
          src="/assets/scrap/tape-stripe.png"
          alt=""
          className="absolute bottom-[9%] left-[18%] w-[92px] -rotate-[7deg] opacity-80 drop-shadow-[0_6px_12px_rgba(0,0,0,0.22)] sm:w-[110px]"
        />
      )}
    </div>
  )
}
