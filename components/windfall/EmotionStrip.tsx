"use client";

import { getEmotion } from "@/lib/emotions";
import type { EmotionPoint } from "@/lib/types";

interface EmotionStripProps {
  items: EmotionPoint[];
}

/**
 * 情绪变化：最近 30 天的一条情绪色带（轻量，非复杂图表）。
 */
export default function EmotionStrip({ items }: EmotionStripProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-[0.85rem] text-[#9a8b78]">
        记录得多了，这条色带会慢慢显出你的情绪流动。
      </p>
    );
  }

  // 图例只显示这 30 天里实际出现过的情绪（去重）
  const appeared = [...new Set(items.map((p) => p.emotion))].map((k) =>
    getEmotion(k)
  );

  return (
    <div>
      <div className="flex gap-[3px]">
        {items.map((p) => {
          const emo = getEmotion(p.emotion);
          return (
            <span
              key={p.date}
              title={`${p.date} · ${emo.label}`}
              className="h-7 flex-1 rounded-[4px] transition-transform hover:scale-y-125"
              style={{
                background: emo.color,
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.18)",
              }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {appeared.map((e) => (
          <span
            key={e.key}
            className="flex items-center gap-1.5 text-[0.72rem] text-[#8a7156]"
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: e.color }}
            />
            {e.label}
          </span>
        ))}
      </div>
    </div>
  );
}
