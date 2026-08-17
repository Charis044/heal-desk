"use client";

import { NightAtmosphere } from "@/components/ui-layer/night-atmosphere";
import { EMOTIONS, getEmotion } from "@/lib/emotions";
import { computeScoreDetail, levelOf } from "@/lib/scores";
import type {
  ChatSummaryResponse,
  EmotionKey,
  ScoreDetail,
  Scores,
} from "@/lib/types";
import { useMemo, useState } from "react";

export interface DiaryDraft {
  emotion: EmotionKey;
  content: string;
  lesson: string;
  next_action: string;
  growth_evidence: string;
  /** LLM/规则产出的四指数（保存时传给后端，保证预览=落库） */
  scores?: Scores;
  /** 评分来源（llm / rule） */
  score_source?: ScoreDetail["source"];
  /** 每个指数的理由 */
  score_reasons?: ScoreDetail["reasons"];
  /** AI 复盘共情回应 */
  ai_response?: string;
}

interface ChatSummaryCardProps {
  summary: ChatSummaryResponse;
  onSave: (draft: DiaryDraft) => void;
  onBack: () => void;
}

/**
 * 聊完后的「确认卡片」：AI 归纳出的草稿，可编辑、可改情绪，
 * 用户确认后才保存。这是"被认真保存下来的纸"，不是数据表单。
 */
export default function ChatSummaryCard({
  summary,
  onSave,
  onBack,
}: ChatSummaryCardProps) {
  const [emotion, setEmotion] = useState<EmotionKey>(summary.emotion);
  const [content, setContent] = useState(summary.content);
  const [lesson, setLesson] = useState(summary.lesson);
  const [nextAction, setNextAction] = useState(summary.next_action);
  const [growthEvidence, setGrowthEvidence] = useState(summary.growth_evidence);
  const [showPicker, setShowPicker] = useState(false);
  const [showReasons, setShowReasons] = useState(false);

  const emo = getEmotion(emotion);
  // 评分来源：AI 完整打分（scores + reasons）则采用，否则用本地规则版
  // （规则版会带来源标注与每个指数的理由，前端据此提示「这是估算值」）。
  const scoreDetail = useMemo<ScoreDetail>(() => {
    if (
      summary.scores &&
      summary.score_reasons &&
      summary.score_source === "llm"
    ) {
      return {
        scores: summary.scores,
        source: "llm",
        reasons: summary.score_reasons,
        note: "",
      };
    }
    return computeScoreDetail(
      {
        emotion,
        content,
        lesson,
        next_action: nextAction,
        growth_evidence: growthEvidence,
      },
      { growthAreas: [], hasHistory: false }
    );
  }, [summary, emotion, content, lesson, nextAction, growthEvidence]);
  const { scores, source, reasons, note } = scoreDetail;
  const isRule = source === "rule";
  const resilienceLevel = levelOf(scores.resilience);

  const save = () => {
    onSave({
      emotion,
      content: content.trim(),
      lesson: lesson.trim(),
      next_action: nextAction.trim(),
      growth_evidence: growthEvidence.trim(),
      scores,
      score_source: source,
      score_reasons: reasons,
      ai_response: summary.ai_response,
    });
  };

  return (
    <div className="draft" onClick={onBack}>
      <NightAtmosphere intensity="overlay" />
      <div className="draft-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="draft-close" onClick={onBack}>
          返回聊天
        </button>

        <p className="rflow-eyebrow">AI 帮你整理的草稿</p>
        <h2 className="draft-title">看看今天的你</h2>
        <p className="draft-hint">
          这些是 AI 根据我们的聊天帮你总结的，你只要看看顺不顺、想改就微调一下，不用自己从头写。
        </p>

        {summary.fallback && (
          <p className="draft-fallback">
            AI 暂时连不上，下面是用简单方式帮你整理的，三问可能需要你自己补一补。
          </p>
        )}

        {/* 情绪 */}
        <div className="draft-emotion">
          <span className="draft-label">情绪</span>
          <button
            type="button"
            className="draft-emotion-current"
            onClick={() => setShowPicker((v) => !v)}
          >
            <span className="draft-emotion-dot" style={{ background: emo.color }} />
            {emo.label}
            <span className="draft-emotion-edit">{showPicker ? "收起" : "改"}</span>
          </button>
          {showPicker && (
            <div className="draft-emotion-grid">
              {EMOTIONS.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  className={`draft-emotion-chip ${e.key === emotion ? "active" : ""}`}
                  style={{ borderColor: e.key === emotion ? e.color : undefined }}
                  onClick={() => {
                    setEmotion(e.key);
                    setShowPicker(false);
                  }}
                >
                  <span
                    className="draft-emotion-chip-dot"
                    style={{ background: e.color }}
                  />
                  {e.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 发生了什么 */}
        <div className="draft-field">
          <span className="draft-label">今天发生了什么</span>
          <textarea
            className="rflow-textarea draft-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="（空）"
          />
        </div>

        {/* 三问 */}
        <div className="draft-field">
          <span className="draft-label">📖 我学到了什么</span>
          <textarea
            className="rflow-textarea draft-textarea"
            value={lesson}
            onChange={(e) => setLesson(e.target.value)}
            placeholder="这次聊天里没聊到这一项"
          />
        </div>
        <div className="draft-field">
          <span className="draft-label">🧭 下次怎么做</span>
          <textarea
            className="rflow-textarea draft-textarea"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
            placeholder="这次聊天里没聊到这一项"
          />
        </div>
        <div className="draft-field">
          <span className="draft-label">🌱 我比以前强在哪里</span>
          <textarea
            className="rflow-textarea draft-textarea"
            value={growthEvidence}
            onChange={(e) => setGrowthEvidence(e.target.value)}
            placeholder="这次聊天里没聊到这一项"
          />
        </div>

        {/* 四个指数 */}
        <div className="draft-scores">
          <div className="draft-score-main">
            <span className="draft-score-main-emoji">🌱</span>
            <span className="draft-score-main-num">{scores.resilience}</span>
            <div className="draft-score-main-meta">
              <span className="draft-score-main-label">韧性指数</span>
              <span className="draft-score-main-note">
                {resilienceLevel.emoji} {resilienceLevel.label} ·{" "}
                {resilienceLevel.note}
              </span>
            </div>
          </div>

          <div className="draft-score-grid">
            <div className="draft-score-item">
              <span className="draft-score-item-emoji">🪞</span>
              <span className="draft-score-item-num">{scores.reflection}</span>
              <span className="draft-score-item-label">自省</span>
            </div>
            <div className="draft-score-item">
              <span className="draft-score-item-emoji">⚡</span>
              <span className="draft-score-item-num">{scores.action}</span>
              <span className="draft-score-item-label">行动</span>
            </div>
            <div className="draft-score-item">
              <span className="draft-score-item-emoji">🌿</span>
              <span className="draft-score-item-num">{scores.growth}</span>
              <span className="draft-score-item-label">成长</span>
            </div>
          </div>

          <p className="draft-score-foot">
            这是这一次经历中的样子，不是给你的分数
          </p>

          {/* 评分来源标注 + 「为什么是这个分」 */}
          <div className="draft-score-why">
            <button
              type="button"
              className="draft-score-why-btn"
              onClick={() => setShowReasons((v) => !v)}
              aria-expanded={showReasons}
            >
              {isRule ? (
                <span className="draft-score-tag draft-score-tag-rule">
                  ⚠️ 这是规则估算值
                </span>
              ) : (
                <span className="draft-score-tag draft-score-tag-llm">
                  ✨ AI 打分
                </span>
              )}
              <span
                className="draft-score-why-icon"
                title="为什么是这个分？"
                aria-hidden
              >
                ⓘ
              </span>
            </button>

            {showReasons && (
              <div className="draft-score-reasons">
                {note && <p className="draft-score-note">{note}</p>}
                <ul className="draft-score-reason-list">
                  <li>
                    <b>🌱 韧性</b> {reasons.resilience}
                  </li>
                  <li>
                    <b>🪞 自省</b> {reasons.reflection}
                  </li>
                  <li>
                    <b>⚡ 行动</b> {reasons.action}
                  </li>
                  <li>
                    <b>🌿 成长</b> {reasons.growth}
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="draft-actions">
          <button type="button" className="btn-ghost" onClick={onBack}>
            再聊会儿
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={save}
            disabled={!content.trim()}
          >
            保存这次成长
          </button>
        </div>
      </div>
    </div>
  );
}
