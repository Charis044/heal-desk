"use client";

import { getOverview } from "@/lib/api";
import { getEmotion } from "@/lib/emotions";
import type { OverviewAnalysis } from "@/lib/types";
import { useEffect, useState } from "react";

/**
 * 「个人全方面分析」：综合纸堆（日记）+ 聊天记录，突出成长与改变。
 * 不是人格测试、不是 Dashboard，只回答「最近的你，正在发生什么变化」。
 */
export default function OverviewPanel() {
  const [data, setData] = useState<OverviewAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="overview-empty">正在读你写下的日子和聊过的话……</p>;
  }
  if (!data) return null;

  return (
    <div className="overview">
      {/* 总述 */}
      <p className="overview-summary">{data.summary}</p>

      {/* 数字概览 */}
      <div className="overview-stats">
        <div className="overview-stat">
          <b>{data.entry_count}</b>
          <span>篇日记</span>
        </div>
        <div className="overview-stat">
          <b>{data.reflected_count}</b>
          <span>次复盘</span>
        </div>
        <div className="overview-stat">
          <b>{data.chat_count}</b>
          <span>次聊天</span>
        </div>
      </div>

      {/* 动态发现 */}
      {data.strengths.length > 0 && (
        <div className="overview-strengths">
          {data.strengths.map((s) => (
            <div key={s.label} className="overview-strength">
              <span className="overview-strength-label">🧬 {s.label}</span>
              <span className="overview-strength-note">{s.note}</span>
            </div>
          ))}
        </div>
      )}

      {/* 过去 → 现在的改变 */}
      {data.patterns.length > 0 && (
        <div className="overview-patterns">
          <span className="overview-sub">正在改变的地方</span>
          {data.patterns.map((p, i) => (
            <p key={i} className="overview-pattern">
              <span className="overview-pattern-trigger">{p.trigger}</span>
              <span className="overview-pattern-summary">{p.summary}</span>
            </p>
          ))}
        </div>
      )}

      {/* 聊天里的情绪 */}
      {data.chat_emotions.length > 0 && (
        <div className="overview-chat-emotions">
          <span className="overview-sub">聊天里的情绪</span>
          <div className="overview-emo-row">
            {data.chat_emotions.map((e) => (
              <span key={e.emotion} className="overview-emo-chip">
                <span
                  className="overview-emo-dot"
                  style={{ background: getEmotion(e.emotion).color }}
                />
                {getEmotion(e.emotion).label} ×{e.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.entry_count === 0 && data.chat_count === 0 && (
        <p className="overview-empty">
          写下第一篇，这里会慢慢显出你自己都没注意到的变化。
        </p>
      )}
    </div>
  );
}
