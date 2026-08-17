"use client"

import { useState, type CSSProperties, type ReactNode } from "react"
import { motion, type Transition } from "framer-motion"

type InteractiveObjectProps = {
  src: string
  alt: string
  /** Positioning + sizing for the object, applied to the outer layer. */
  style?: CSSProperties
  className?: string
  /** Idle counter-clockwise/clockwise tilt in degrees. */
  rotate?: number
  /** Colour of the luminous ink edge on hover. */
  glowColor?: string
  /** Optional label shown softly on hover (kept minimal, not a button). */
  children?: ReactNode
  /** Artwork rendered behind the base PNG, useful for transparent cutouts. */
  underlay?: ReactNode
  onSelect?: () => void
  onHoverStart?: () => void
  onHoverEnd?: () => void
  priority?: boolean
  /** Per-object idle breathing phase offset (seconds). */
  idleDelay?: number
}

/**
 * A single illustrated object living on the desk.
 *
 * The glow follows the PNG's alpha silhouette by stacking `drop-shadow`
 * filters on a duplicate of the image, rather than drawing a rectangular
 * box around it. Framer Motion drives the subtle scale.
 */
export function InteractiveObject({
  src,
  alt,
  style,
  className,
  rotate = 0,
  glowColor = "rgba(255, 226, 168, 0.9)",
  children,
  underlay,
  onSelect,
  onHoverStart,
  onHoverEnd,
  priority,
  idleDelay = 0,
}: InteractiveObjectProps) {
  const [hovered, setHovered] = useState(false)

  // Silhouette-following luminous edge: multiple soft drop-shadows.
  const glowFilter = `drop-shadow(0 0 3px ${glowColor}) drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 0 22px ${glowColor})`

  const hoverTransition: Transition = { duration: 0.32, ease: "easeOut" }
  const idleTransition: Transition = {
    duration: 5.5,
    ease: "easeInOut",
    repeat: Number.POSITIVE_INFINITY,
    delay: idleDelay,
  }

  return (
    <motion.div
      className={className}
      style={{
        position: "absolute",
        cursor: "pointer",
        transformOrigin: "center center",
        willChange: "transform",
        zIndex: 20,
        ...style,
      }}
      initial={false}
      animate={
        hovered
          ? { scale: 1.03, rotate, y: "-0.4%" }
          : {
              scale: [1, 1.008, 1],
              rotate: [rotate - 0.25, rotate + 0.25, rotate - 0.25],
              y: ["0%", "-0.55%", "0%"],
            }
      }
      transition={hovered ? hoverTransition : idleTransition}
      whileTap={{ scale: 0.985 }}
      onHoverStart={() => {
        setHovered(true)
        onHoverStart?.()
      }}
      onHoverEnd={() => {
        setHovered(false)
        onHoverEnd?.()
      }}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={alt}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect?.()
        }
      }}
    >
      {underlay}

      {/* Glow layer — same image, alpha-aware drop-shadows, fades in on hover */}
      <motion.img
        src={src || "/placeholder.svg"}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        style={{ filter: glowFilter, objectFit: "contain" }}
        initial={false}
        animate={{ opacity: hovered ? 0.85 : 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />

      {/* Base image */}
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        className="relative h-full w-full select-none"
        style={{ objectFit: "contain" }}
      />

      {children}
    </motion.div>
  )
}
