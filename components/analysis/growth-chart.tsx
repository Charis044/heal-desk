"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { GrowthPoint } from "./analytics-contract"

type GrowthChartProps = {
  data: GrowthPoint[]
}

const CHART_WIDTH = 820
const CHART_HEIGHT = 330
const PADDING = { left: 54, right: 34, top: 36, bottom: 46 }

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`))
}

export function GrowthChart({ data }: GrowthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const chart = useMemo(() => {
    if (data.length === 0) return null

    const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right
    const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
    const points = data.map((point, index) => {
      const score = Math.max(0, Math.min(100, point.score))
      return {
        ...point,
        score,
        x:
          data.length === 1
            ? PADDING.left + innerWidth / 2
            : PADDING.left + (index / (data.length - 1)) * innerWidth,
        y: PADDING.top + ((100 - score) / 100) * innerHeight,
      }
    })

    const linePath = points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`
      const previous = points[index - 1]
      const middleX = (previous.x + point.x) / 2
      return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`
    }, "")
    const baseline = CHART_HEIGHT - PADDING.bottom
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`

    return { points, linePath, areaPath }
  }, [data])

  if (!chart) {
    return (
      <motion.div
        className="flex min-h-[420px] items-center justify-center text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="max-w-md">
          <p className="font-serif text-xl leading-9 text-[#352920]/76">
            完成一次「三问复盘」后，这里会出现你的变化轨迹。
          </p>
          <div className="mx-auto mt-6 h-px w-20 bg-[#604a3b]/25" />
        </div>
      </motion.div>
    )
  }

  const latest = data[data.length - 1]
  const hovered =
    hoveredIndex === null ? null : chart.points[hoveredIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <header className="flex flex-col gap-5 border-b border-[#49372b]/18 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.26em] text-[#5b493d]/50">
            最近一次韧性指数
          </p>
          <p className="mt-2 font-serif text-5xl font-medium text-[#291f19]">
            {latest.score}
            <span className="ml-1 text-base font-normal text-[#49372b]/42">
              / 100
            </span>
          </p>
        </div>
        <div className="space-y-1 text-left font-serif text-sm text-[#49372b]/55 sm:text-right">
          <p>共 {data.length} 个观察点</p>
          <p>
            {formatLongDate(data[0].date)} — {formatLongDate(latest.date)}
          </p>
        </div>
      </header>

      <div className="relative mt-7">
        <svg
          className="block h-auto w-full overflow-visible"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label="韧性指数随时间变化折线图"
        >
          <defs>
            <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b88961" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#b88961" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((score) => {
            const innerHeight =
              CHART_HEIGHT - PADDING.top - PADDING.bottom
            const y = PADDING.top + ((100 - score) / 100) * innerHeight
            return (
              <g key={score}>
                <line
                  x1={PADDING.left}
                  x2={CHART_WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(73,55,43,0.12)"
                  strokeDasharray={score === 0 ? undefined : "3 7"}
                />
                <text
                  x={PADDING.left - 14}
                  y={y + 4}
                  textAnchor="end"
                  fill="rgba(73,55,43,0.38)"
                  fontSize="11"
                >
                  {score}
                </text>
              </g>
            )
          })}

          <motion.path
            d={chart.areaPath}
            fill="url(#growth-area)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          />
          <motion.path
            d={chart.linePath}
            fill="none"
            stroke="#8f674c"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {chart.points.map((point, index) => (
            <g
              key={`${point.date}-${point.score}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${formatLongDate(point.date)}，韧性指数 ${point.score}`}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r="14"
                fill="transparent"
              />
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === index ? 6 : 4.5}
                fill="#f7efe4"
                stroke="#8f674c"
                strokeWidth="2.5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.07 }}
              />
            </g>
          ))}

          <text
            x={chart.points[0].x}
            y={CHART_HEIGHT - 13}
            textAnchor="start"
            fill="rgba(73,55,43,0.46)"
            fontSize="11"
          >
            {formatShortDate(data[0].date)}
          </text>
          <text
            x={chart.points[chart.points.length - 1].x}
            y={CHART_HEIGHT - 13}
            textAnchor="end"
            fill="rgba(73,55,43,0.46)"
            fontSize="11"
          >
            {formatShortDate(latest.date)}
          </text>

          {hovered && (
            <g pointerEvents="none">
              <rect
                x={Math.max(
                  8,
                  Math.min(CHART_WIDTH - 150, hovered.x - 72),
                )}
                y={Math.max(6, hovered.y - 63)}
                width="144"
                height="43"
                rx="8"
                fill="rgba(36,27,22,0.9)"
              />
              <text
                x={Math.max(
                  80,
                  Math.min(CHART_WIDTH - 78, hovered.x),
                )}
                y={Math.max(23, hovered.y - 46)}
                textAnchor="middle"
                fill="#fff8ee"
                fontSize="11"
              >
                {formatLongDate(hovered.date)}
              </text>
              <text
                x={Math.max(
                  80,
                  Math.min(CHART_WIDTH - 78, hovered.x),
                )}
                y={Math.max(39, hovered.y - 30)}
                textAnchor="middle"
                fill="#f0c48f"
                fontSize="12"
              >
                指数 {hovered.score}
              </text>
            </g>
          )}
        </svg>
      </div>

      <p className="mt-2 text-xs leading-6 tracking-wide text-[#49372b]/40">
        指数由后端根据「三问复盘」返回；此页面不参与计算或评判。
      </p>
    </motion.div>
  )
}
