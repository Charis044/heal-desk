/**
 * The wooden desk / room the whole scene rests on.
 *
 * Window cutouts are transparent so NightWindow shows through.
 * Fills the locked artboard 1:1 — static, no drift.
 */
export function Desk() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      <img
        src="/assets/desk.png?v=2"
        alt="A warm wooden desk by a window at night, a cup of tea and books catching lamplight"
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-fill"
      />
    </div>
  )
}
