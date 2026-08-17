"use client";

import type { GrowthPoint } from "@/lib/types";

interface GrowthChartProps {
  items: GrowthPoint[];
}

function shortDate(iso: string): string {
  // "2026-08-10" -> "08.10"
  return iso.slice(5).replace("-", ".");
}

/**
 * 韧性变化曲线：极简折线，非成长树/等级。
 * 口径透明：折线只连接「做过三问复盘」的节点；未复盘的记录用空心点
 * 标注在底部（score=0），并在图例说明，让用户知道曲线为什么有断点。
 */
export default function GrowthChart({ items }: GrowthChartProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-[0.85rem] text-[#9a8b78]">
        完成几次三问反思后，这里会慢慢长出一条属于你的线。
      </p>
    );
  }

  const W = 640;
  const H = 220;
  const padL = 30;
  const padR = 30;
  const padT = 26;
  const padB = 48;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const reflected = items.filter((p) => p.reflected !== false);
  const hasUnreflected = items.some((p) => p.reflected === false);

  // y 范围：基于有复盘的分数，且始终从 0 开始（未复盘节点落在底部）
  const rScores = reflected.map((p) => p.score);
  const yMin = 0;
  let yMax = rScores.length ? Math.min(100, Math.max(...rScores) + 8) : 100;
  if (yMax - yMin < 20) yMax = Math.min(100, yMin + 20);

  const n = items.length;
  const x = (i: number) => (n === 1 ? W / 2 : padL + (i / (n - 1)) * plotW);
  const y = (score: number) =>
    padT + ((yMax - score) / (yMax - yMin)) * plotH;

  // 折线只连接有复盘的点
  const linePoints = items
    .map((p, i) => ({ p, i }))
    .filter((o) => o.p.reflected !== false)
    .map((o) => `${x(o.i)},${y(o.p.score)}`)
    .join(" ");

  const refs = [
    { v: y(yMax), label: String(yMax) },
    { v: y((yMax + yMin) / 2), label: String(Math.round((yMax + yMin) / 2)) },
    { v: y(yMin), label: String(yMin) },
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        {/* 参考线 */}
        {refs.map((r, i) => (
          <g key={i}>
            <line
              x1={padL}
              y1={r.v}
              x2={W - padR}
              y2={r.v}
              stroke="#d8c9ae"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <text
              x={padL - 6}
              y={r.v + 3}
              textAnchor="end"
              fontSize="10"
              fill="#b3a48c"
            >
              {r.label}
            </text>
          </g>
        ))}

        {/* 折线（只连有复盘的节点） */}
        {linePoints && (
          <polyline
            points={linePoints}
            fill="none"
            stroke="#67944b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* 数据点：复盘=实心绿点+分数；未复盘=空心灰点+「未复盘」 */}
        {items.map((p, i) => {
          const isReflected = p.reflected !== false;
          if (isReflected) {
            return (
              <g key={p.date + i}>
                <circle
                  cx={x(i)}
                  cy={y(p.score)}
                  r="4.5"
                  fill="#fffdf6"
                  stroke="#67944b"
                  strokeWidth="2.5"
                />
                <text
                  x={x(i)}
                  y={y(p.score) - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#4d7436"
                >
                  {p.score}
                </text>
              </g>
            );
          }
          return (
            <g key={p.date + i}>
              <circle
                cx={x(i)}
                cy={y(0)}
                r="4"
                fill="#fffdf6"
                stroke="#c9bfae"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <text
                x={x(i)}
                y={y(0) + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#9a8b78"
              >
                未复盘
              </text>
            </g>
          );
        })}

        {/* 首尾日期 */}
        <text x={padL} y={H - 20} fontSize="11" fill="#9a8b78">
          {shortDate(items[0].date)}
        </text>
        {n > 1 && (
          <text
            x={W - padR}
            y={H - 20}
            textAnchor="end"
            fontSize="11"
            fill="#9a8b78"
          >
            {shortDate(items[n - 1].date)}
          </text>
        )}
      </svg>

      {/* 图例：口径说明 */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[0.72rem] text-[#8a7156]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[#67944b] bg-[#fffdf6]" />
          做过复盘
        </span>
        {hasUnreflected && (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-[#c9bfae] bg-[#fffdf6]" />
            只记录未复盘（不计分）
          </span>
        )}
      </div>
    </div>
  );
}
