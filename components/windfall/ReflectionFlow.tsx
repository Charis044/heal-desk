"use client";

import { requestReflectionSuggestion } from "@/lib/api";
import { getEmotion } from "@/lib/emotions";
import {
  buildGrowthFindings,
  buildReflectionResponse,
} from "@/lib/reflection";
import { computeScoreDetail, levelOf } from "@/lib/scores";
import type { EmotionKey, ReflectionQuestionKey, ScoreDetail } from "@/lib/types";
import { useMemo, useState, type CSSProperties } from "react";

export interface ReflectionAnswers {
  lesson: string;
  next_action: string;
  growth_evidence: string;
}

interface ReflectionFlowProps {
  emotion: EmotionKey;
  content: string;
  historyEmotions: EmotionKey[];
  onSave: (answers: ReflectionAnswers) => void;
  onClose: () => void;
}

interface QuestionDef {
  key: ReflectionQuestionKey;
  icon: string;
  color: string;
  title: string;
  hint: string;
  example: string;
}

const QUESTIONS: QuestionDef[] = [
  {
    key: "lesson",
    icon: "📖",
    color: "#67944b",
    title: "这件事教会了我什么？",
    hint: "哪怕只有很小的一点，也值得被写下来。不想回答也没关系，可以直接跳过。",
    example: "比如：我发现自己没有准备备用方案。",
  },
  {
    key: "next_action",
    icon: "🧭",
    color: "#E8894E",
    title: "如果类似情况再发生，我会怎么做不同？",
    hint: "一个具体的下一步，比宏大的决心更有用。也可以跳过。",
    example: "比如：下次 Demo 前先准备一个本地 fallback。",
  },
  {
    key: "growth_evidence",
    icon: "🌱",
    color: "#078D8C",
    title: "我现在比以前强在哪里？",
    hint: "不一定是「成功」，是那些真实的、一点点的变化。也可以跳过。",
    example: "比如：以前遇到这种情况我会直接崩溃，现在开始主动找办法。",
  },
];

/**
 * 三问反思：逐步出现三个问题，每题可「让 AI 帮我想想」起个头，
 * 最后生成一张「被认真保存下来的纸」。
 */
export default function ReflectionFlow({
  emotion,
  content,
  historyEmotions,
  onSave,
  onClose,
}: ReflectionFlowProps) {
  const emo = getEmotion(emotion);
  const [step, setStep] = useState(0); // 0..2 三问，3 最终卡片
  const [answers, setAnswers] = useState<ReflectionAnswers>({
    lesson: "",
    next_action: "",
    growth_evidence: "",
  });
  // AI 起头
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [showScoreReasons, setShowScoreReasons] = useState(false);

  const scoreDetail = useMemo<ScoreDetail>(
    () =>
      computeScoreDetail(
        {
          emotion,
          content,
          lesson: answers.lesson,
          next_action: answers.next_action,
          growth_evidence: answers.growth_evidence,
        },
        { growthAreas: [], hasHistory: historyEmotions.length > 0 }
      ),
    [emotion, content, answers, historyEmotions]
  );
  const scores = scoreDetail.scores;
  const resilienceLevel = levelOf(scores.resilience);
  const aiResponse = useMemo(
    () => buildReflectionResponse(emotion, answers),
    [emotion, answers]
  );
  const findings = useMemo(
    () => buildGrowthFindings(emotion, answers, historyEmotions),
    [emotion, answers, historyEmotions]
  );

  const isCard = step === 3;
  const current = QUESTIONS[step];

  const setAnswer = (key: ReflectionQuestionKey, val: string) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));

  const goTo = (next: number) => {
    setStep(next);
    setSuggestion(null);
    setSuggestError(false);
    setShowExample(false);
  };

  const next = () => (step === 2 ? setStep(3) : goTo(step + 1));

  const handleSuggest = async () => {
    setSuggesting(true);
    setSuggestError(false);
    setSuggestion(null);
    try {
      const r = await requestReflectionSuggestion({
        emotion,
        content,
        question: current.key,
      });
      setSuggestion(r.suggestion);
    } catch {
      setSuggestError(true);
    } finally {
      setSuggesting(false);
    }
  };

  const adopt = () => {
    if (suggestion) setAnswer(current.key, suggestion);
    setSuggestion(null);
  };

  return (
    <div className="rflow" onClick={onClose}>
      <div className="rflow-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rflow-close" onClick={onClose}>
          返回
        </button>

        {!isCard ? (
          <>
            <p className="rflow-eyebrow">REFLECT</p>
            <h2 className="rflow-title">这次经历，留下些什么？</h2>

            <div className="rflow-step" key={step}>
              <div className="rflow-step-head">
                <span className="rflow-count">
                  第 {step + 1} / {QUESTIONS.length} 问
                </span>
                <div className="rflow-dots">
                  {QUESTIONS.map((item, i) => (
                    <span
                      key={item.key}
                      className={`rflow-dot ${
                        i === step
                          ? "active"
                          : answers[item.key]
                            ? "done"
                            : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="rflow-qhead">
                <span
                  className="rflow-qicon"
                  style={{ background: `${current.color}1a`, color: current.color }}
                  aria-hidden
                >
                  {current.icon}
                </span>
                <h3 className="rflow-q">{current.title}</h3>
              </div>
              <p className="rflow-hint">{current.hint}</p>

              <textarea
                autoFocus
                className="rflow-textarea"
                value={answers[current.key]}
                onChange={(e) => setAnswer(current.key, e.target.value)}
                placeholder="写下来……"
              />

              {/* 可折叠示例 */}
              <button
                type="button"
                className="rflow-example-toggle"
                onClick={() => setShowExample((v) => !v)}
              >
                {showExample ? "收起例子" : "看个例子"}
              </button>
              {showExample && (
                <p className="rflow-example">{current.example}</p>
              )}

              {/* AI 起头 */}
              {suggestion ? (
                <div className="rflow-suggest">
                  <p className="rflow-suggest-label">AI 帮你起了个头（可以改）</p>
                  <p className="rflow-suggest-text">{suggestion}</p>
                  <div className="rflow-suggest-actions">
                    <button
                      type="button"
                      className="rflow-suggest-adopt"
                      onClick={adopt}
                    >
                      采纳
                    </button>
                    <button
                      type="button"
                      className="rflow-suggest-ignore"
                      onClick={() => setSuggestion(null)}
                    >
                      忽略
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rflow-suggest-row">
                  <button
                    type="button"
                    className="rflow-suggest-btn"
                    onClick={handleSuggest}
                    disabled={suggesting}
                  >
                    {suggesting ? "正在想……" : "✨ 让 AI 帮我想想"}
                  </button>
                  {suggestError && (
                    <span className="rflow-suggest-error">
                      没想出来，你自己先写写看？
                    </span>
                  )}
                </div>
              )}

              <div className="rflow-nav">
                <button
                  type="button"
                  className="rflow-skip"
                  onClick={next}
                >
                  跳过这一问
                </button>
                <div className="rflow-nav-right">
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => goTo(Math.max(0, step - 1))}
                    style={{ visibility: step === 0 ? "hidden" : "visible" }}
                  >
                    上一问
                  </button>
                  <button type="button" className="btn-save" onClick={next}>
                    {step === 2 ? "看看我写下的" : "下一问"}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="rflow-eyebrow">RECORD</p>
            <h2 className="rflow-title">这次经历，留下些什么？</h2>

            {/* 最终反思卡片 */}
            <div className="rflow-card">
              <div className="rflow-card-summary">
                <div className="rflow-card-row">
                  <span className="rflow-card-label">情绪</span>
                  <span className="rflow-card-value">
                    <span
                      className="rflow-card-dot"
                      style={{ background: emo.color }}
                    />
                    {emo.label}
                  </span>
                </div>
                <div className="rflow-card-row">
                  <span className="rflow-card-label">发生</span>
                  <span className="rflow-card-value rflow-card-happen">
                    {content}
                  </span>
                </div>
                <div className="rflow-card-row">
                  <span className="rflow-card-label">我学到了</span>
                  <span className="rflow-card-value">
                    {answers.lesson || "（还没有写）"}
                  </span>
                </div>
                <div className="rflow-card-row">
                  <span className="rflow-card-label">下次</span>
                  <span className="rflow-card-value">
                    {answers.next_action || "（还没有写）"}
                  </span>
                </div>
                <div className="rflow-card-row">
                  <span className="rflow-card-label">我比以前强</span>
                  <span className="rflow-card-value">
                    {answers.growth_evidence || "（还没有写）"}
                  </span>
                </div>
              </div>

              {/* 四个指数 */}
              <div className="rflow-scores">
                <div
                  className="rflow-score"
                  style={{ "--emo": emo.color } as CSSProperties}
                >
                  <span className="rflow-score-num">{scores.resilience}</span>
                  <span className="rflow-score-meta">
                    <span className="rflow-score-label">🌱 韧性指数</span>
                    <span className="rflow-score-note">
                      {resilienceLevel.emoji} {resilienceLevel.label} ·{" "}
                      {resilienceLevel.note}
                    </span>
                  </span>
                </div>

                <div className="rflow-score-mini-grid">
                  <div className="rflow-score-mini">
                    <span className="rflow-score-mini-num">🪞 {scores.reflection}</span>
                    <span className="rflow-score-mini-label">自省</span>
                  </div>
                  <div className="rflow-score-mini">
                    <span className="rflow-score-mini-num">⚡ {scores.action}</span>
                    <span className="rflow-score-mini-label">行动</span>
                  </div>
                  <div className="rflow-score-mini">
                    <span className="rflow-score-mini-num">🌿 {scores.growth}</span>
                    <span className="rflow-score-mini-label">成长</span>
                  </div>
                </div>
              </div>

              {/* 评分来源标注 + 「为什么是这个分」 */}
              <div className="rflow-score-why">
                <button
                  type="button"
                  className="rflow-score-why-btn"
                  onClick={() => setShowScoreReasons((v) => !v)}
                  aria-expanded={showScoreReasons}
                >
                  <span className="rflow-score-tag">⚠️ 这是规则估算值</span>
                  <span
                    className="rflow-score-why-icon"
                    title="为什么是这个分？"
                    aria-hidden
                  >
                    ⓘ
                  </span>
                </button>
                {showScoreReasons && (
                  <div className="rflow-score-reasons">
                    <p className="rflow-score-note">{scoreDetail.note}</p>
                    <ul className="rflow-score-reason-list">
                      <li>
                        <b>🌱 韧性</b> {scoreDetail.reasons.resilience}
                      </li>
                      <li>
                        <b>🪞 自省</b> {scoreDetail.reasons.reflection}
                      </li>
                      <li>
                        <b>⚡ 行动</b> {scoreDetail.reasons.action}
                      </li>
                      <li>
                        <b>🌿 成长</b> {scoreDetail.reasons.growth}
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* AI 发现（历史对比） */}
              <div className="rflow-insight">
                <p className="rflow-insight-label">AI 发现</p>
                <p className="rflow-insight-text">{findings.growth_insight}</p>
                {findings.growth_area && (
                  <p className="rflow-area">
                    <span className="rflow-area-label">正在形成的能力</span>
                    <span className="rflow-area-tag">
                      🧬 {findings.growth_area}
                    </span>
                  </p>
                )}
              </div>

              {/* AI 复盘回应 */}
              <p className="rflow-ai">{aiResponse}</p>

              <p className="rflow-close-line">
                我经历了一件糟糕的事，
                <br />
                但我从里面带走了一点东西。
              </p>
            </div>

            <div className="rflow-nav rflow-nav-card">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setStep(2)}
              >
                再改改
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={() => onSave(answers)}
              >
                保存这次成长
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
