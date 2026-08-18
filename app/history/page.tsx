"use client";

import { FunctionPageHeader } from "@/components/ui-layer/function-page-header";
import { NightAtmosphere } from "@/components/ui-layer/night-atmosphere";
import { PaperSheet } from "@/components/ui-layer/paper-sheet";
import ConfirmDialog from "@/components/windfall/ConfirmDialog";
import GrowthChart from "@/components/windfall/GrowthChart";
import GrowthProfileView from "@/components/windfall/GrowthProfile";
import ReflectionFlow, {
  type ReflectionAnswers,
} from "@/components/windfall/ReflectionFlow";
import {
  deleteDiary,
  getDiary,
  getInsights,
  listDiary,
  refreshInsights,
  restoreDiary,
  updateDiary,
} from "@/lib/api";
import { EMOTIONS, getEmotion } from "@/lib/emotions";
import type {
  DiaryEntry,
  DiarySummary,
  EmotionKey,
  InsightsResponse,
} from "@/lib/types";
import { useEffect, useState } from "react";

const PAGE = 20;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}.${m}.${day}`;
}

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<DiarySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DiaryEntry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsRefreshing, setInsightsRefreshing] = useState(false);

  // 补做三问：目标记录
  const [reflectionFor, setReflectionFor] = useState<{
    id: string;
    emotion: EmotionKey;
    content: string;
  } | null>(null);

  // 编辑：目标记录 + 编辑中的 content/emotion
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editEmotion, setEditEmotion] = useState<EmotionKey>("calm");

  // 搜索 / 筛选
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [emotionFilter, setEmotionFilter] = useState<string | null>(null);

  // 视图：正常列表 vs 回收站
  const [view, setView] = useState<"normal" | "trash">("normal");
  // 删除确认（软删除进回收站的目标）
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // 彻底删除确认（回收站里永久删除的目标）
  const [confirmPermanentId, setConfirmPermanentId] = useState<string | null>(
    null
  );

  // 从 URL 读取 ?emotion= 初始化筛选（来自首页情绪色谱点击）
  useEffect(() => {
    if (typeof window === "undefined") return;
    const emo = new URLSearchParams(window.location.search).get("emotion");
    if (emo) setEmotionFilter(emo);
  }, []);

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(t);
  }, [qInput]);

  // 列表加载（依赖 q / emotionFilter / view）
  useEffect(() => {
    let alive = true;
    setLoading(true);
    listDiary({
      limit: PAGE,
      offset: 0,
      q: q || undefined,
      emotion: emotionFilter ?? undefined,
      trash: view === "trash",
    })
      .then((list) => {
        if (!alive) return;
        setSummaries(list);
        setOffset(0);
        setHasMore(list.length === PAGE);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [q, emotionFilter, view]);

  // 左栏快照（7 的倍数或手动刷新才变）
  useEffect(() => {
    let alive = true;
    getInsights()
      .then((r) => {
        if (alive) setInsights(r);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setInsightsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const reloadInsights = async () => {
    setInsightsRefreshing(true);
    try {
      const r = await refreshInsights();
      setInsights(r);
    } catch {
      /* 静默 */
    } finally {
      setInsightsRefreshing(false);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      cancelEdit();
      return;
    }
    setExpandedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const d = await getDiary(id);
      setDetail(d);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = offset + PAGE;
      const more = await listDiary({
        limit: PAGE,
        offset: next,
        q: q || undefined,
        emotion: emotionFilter ?? undefined,
      });
      setSummaries((prev) => [...prev, ...more]);
      setOffset(next);
      setHasMore(more.length === PAGE);
    } finally {
      setLoadingMore(false);
    }
  };

  // 补做三问：更新记录后刷新列表摘要
  const handleSaveReflection = async (answers: ReflectionAnswers) => {
    const target = reflectionFor;
    setReflectionFor(null);
    if (!target) return;
    try {
      const updated = await updateDiary(target.id, answers);
      setSummaries((prev) =>
        prev.map((s) =>
          s.id === updated.id
            ? {
                ...s,
                resilience_score: updated.resilience_score,
                has_reflection: true,
              }
            : s
        )
      );
    } catch {
      /* 保存失败时静默，用户可重试 */
    }
  };

  // 删除记录：打开确认弹层（软删除进回收站）
  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const toggleExclude = async (id: string, excluded: boolean) => {
    try {
      const updated = await updateDiary(id, {
        excluded_from_insights: excluded,
      });
      setSummaries((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, excluded_from_insights: updated.excluded_from_insights }
            : s
        )
      );
      if (detail?.id === id) setDetail(updated);
    } catch {
      /* 静默 */
    }
  };

  // 确认软删除
  const confirmDelete = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id) return;
    try {
      await deleteDiary(id);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
      }
    } catch {
      /* 静默 */
    }
  };

  // 从回收站恢复
  const handleRestore = async (id: string) => {
    try {
      await restoreDiary(id);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
    } catch {
      /* 静默 */
    }
  };

  // 彻底删除：打开确认弹层
  const handlePermanentDelete = (id: string) => {
    setConfirmPermanentId(id);
  };

  // 确认彻底删除
  const confirmPermanent = async () => {
    const id = confirmPermanentId;
    setConfirmPermanentId(null);
    if (!id) return;
    try {
      await deleteDiary(id, true);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
    } catch {
      /* 静默 */
    }
  };

  const startEdit = (d: DiaryEntry) => {
    setEditingId(d.id);
    setEditContent(d.content);
    setEditEmotion(d.emotion);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditEmotion("calm");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const id = editingId;
    try {
      const updated = await updateDiary(id, {
        content: editContent.trim(),
        emotion: editEmotion,
      });
      setDetail(updated);
      setSummaries((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                content: updated.content,
                emotion: updated.emotion,
                resilience_score: updated.resilience_score,
              }
            : s
        )
      );
      cancelEdit();
    } catch {
      /* 静默 */
    }
  };

  return (
    <>
      <main className="relative h-[100dvh] overflow-y-auto bg-[#141021] text-[#fff8ee]">
      <NightAtmosphere />
      <FunctionPageHeader className="max-w-[1180px]" />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 pb-20 sm:px-6">
      <header className="mb-8 inline-block max-w-[680px] rounded-2xl border border-white/16 bg-[rgba(23,18,34,0.42)] px-5 py-4 shadow-[0_12px_32px_rgba(0,0,0,0.2)] backdrop-blur-md">
        <p className="font-serif text-[11px] tracking-[0.28em] text-[#f0c48f]/72">
          PAST PAGES · 过往记录
        </p>
        <h1 className="mt-3 font-serif text-2xl font-medium leading-snug tracking-[0.04em] text-[#fff8ee] sm:text-[1.75rem]">
          翻开过去保存下来的自己，
          <br className="sm:hidden" />
          看看你什么时候开始变得不一样。
        </h1>
      </header>

      <div className="history-split">
      <PaperSheet variant="notebook" className="min-h-[640px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-serif text-[10px] tracking-[0.22em] text-[#5c4739]/55">
            每 7 篇更新一次左栏
          </p>
          <button
            type="button"
            className="btn-ghost"
            onClick={reloadInsights}
            disabled={insightsRefreshing}
          >
            {insightsRefreshing ? "正在重画……" : "立刻刷新左栏"}
          </button>
        </div>
        {!insightsLoading && (insights?.pending_count ?? 0) > 0 && (
          <p className="mb-5 font-serif text-[0.88rem] leading-relaxed text-[#8a7156]">
            还有 {insights?.pending_count} 篇尚未计入。
          </p>
        )}
        <GrowthProfileView
          profile={insights?.snapshot?.profile ?? null}
          loading={insightsLoading}
        />
        <section className="mt-10">
          <h2 className="section-title">我的变化</h2>
          <p className="mt-3 font-serif text-[0.95rem] leading-relaxed text-[#5a4030]/86">
            韧性不是不再受伤，而是受伤之后越来越知道怎么面对。
          </p>
          <div className="paper-inset mt-5 p-5 sm:p-6">
            <p className="text-[10px] tracking-[0.22em] text-[#5c4739]/55">
              韧性变化
            </p>
            <div className="mt-2">
              <GrowthChart items={insights?.snapshot?.growth ?? []} />
            </div>
          </div>
        </section>
      </PaperSheet>

      <section>
        <div className="rounded-2xl border border-white/16 bg-[rgba(23,18,34,0.42)] px-4 py-3 shadow-[0_10px_28px_rgba(0,0,0,0.18)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-lg font-medium tracking-[0.08em] text-[#fff8ee]/92">
              过往记录
            </h2>
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/18 bg-white/8 p-1 backdrop-blur-md">
              <button
                type="button"
                className={`rounded-full px-3 py-1 font-serif text-[0.82rem] tracking-wide transition-colors ${
                  view === "normal"
                    ? "bg-white/18 text-[#fff8ee]"
                    : "text-white/58 hover:text-white/86"
                }`}
                onClick={() => setView("normal")}
              >
                记录
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 font-serif text-[0.82rem] tracking-wide transition-colors ${
                  view === "trash"
                    ? "bg-white/18 text-[#fff8ee]"
                    : "text-white/58 hover:text-white/86"
                }`}
                onClick={() => setView("trash")}
              >
                回收站
              </button>
            </div>
          </div>
        </div>

        <div className="filter-bar night-tools">
          <input
            className="filter-input"
            placeholder="搜索关键词…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <div className="filter-emotions">
            <button
              type="button"
              className={`filter-chip ${emotionFilter === null ? "active" : ""}`}
              onClick={() => setEmotionFilter(null)}
            >
              全部
            </button>
            {EMOTIONS.map((e) => (
              <button
                key={e.key}
                type="button"
                className={`filter-chip ${
                  emotionFilter === e.key ? "active" : ""
                }`}
                onClick={() => setEmotionFilter(e.key)}
              >
                <span
                  className="filter-chip-dot"
                  style={{ background: e.color }}
                />
                {e.label}
              </button>
            ))}
          </div>
          <div className="filter-export">
            <a className="btn-ghost" href="/api/export?format=md">
              导出 Markdown
            </a>
            <a className="btn-ghost" href="/api/export?format=json">
              导出 JSON
            </a>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading && (
            <p className="py-10 text-center font-serif text-[0.9rem] tracking-wide text-white/48">
              正在翻找这些纸张……
            </p>
          )}

          {!loading && summaries.length === 0 && (
            <div className="history-note relative px-8 py-12 text-center font-serif text-[#6b5d4f]/80">
              <img
                src="/assets/scrap/tape-washi.png"
                alt=""
                draggable={false}
                className="history-tape history-tape-l"
              />
              {q || emotionFilter
                ? "没有找到匹配的记录"
                : "这里还很安静，写下第一篇记录吧"}
            </div>
          )}

          {!loading &&
            summaries.map((s, i) => {
              const emo = getEmotion(s.emotion);
              const open = expandedId === s.id;
              const tilt = open ? 0 : i % 2 === 0 ? -0.8 : 0.7;
              const isBear = s.source === "bear";
              const excluded = !!s.excluded_from_insights;
              return (
                <article
                  key={s.id}
                  className={`history-note rise-in relative cursor-pointer p-5 transition-transform duration-300 sm:p-6${
                    isBear ? " bear-note" : ""
                  }${excluded ? " excluded" : ""}`}
                  style={{ transform: `rotate(${tilt}deg)` }}
                  onClick={() => toggleExpand(s.id)}
                >
                  {isBear ? (
                    <img
                      src="/assets/scrap/tape-red.png"
                      alt=""
                      draggable={false}
                      className="history-tape history-tape-bear"
                    />
                  ) : (
                    <>
                      <img
                        src="/assets/scrap/tape-washi.png"
                        alt=""
                        draggable={false}
                        className="history-tape history-tape-l"
                      />
                      <img
                        src="/assets/scrap/tape-washi.png"
                        alt=""
                        draggable={false}
                        className="history-tape history-tape-r"
                      />
                    </>
                  )}
                  {/* 摘要 */}
                  <div className="flex items-center justify-between">
                    <span className="text-[0.78rem] text-[#9a8b78]">
                      {formatDate(s.created_at)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: emo.color }}
                      />
                      <span className="text-[0.85rem] font-semibold text-[#5a4030]">
                        {emo.label}
                      </span>
                    </span>
                  </div>

                  <p className="history-note-body mt-2.5 line-clamp-2 font-serif text-[1.02rem] leading-relaxed text-[#3b3028]">
                    {s.content}
                  </p>
                  {excluded && (
                    <p className="mt-2 text-[0.75rem] leading-relaxed text-[#b0452e]/85">
                      本删除仅是不在总结/图表中读取。
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[0.8rem] text-[#8a7156]">
                      {isBear
                        ? "小熊咨询"
                        : s.has_reflection
                          ? `韧性 ${s.resilience_score}`
                          : "还没复盘"}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {isBear && (
                        <label
                          className="exclude-check"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={excluded}
                            onChange={(e) =>
                              toggleExclude(s.id, e.target.checked)
                            }
                          />
                          不计入总结
                        </label>
                      )}
                      {isBear && s.chat_id && (
                        <a
                          href={`/ai-analysis?chat=${s.chat_id}&note=${s.id}`}
                          className="reflect-cta"
                          onClick={(e) => e.stopPropagation()}
                        >
                          打开这次咨询 →
                        </a>
                      )}
                      {!s.has_reflection && !isBear && (
                        <button
                          type="button"
                          className="reflect-cta"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReflectionFor({
                              id: s.id,
                              emotion: s.emotion,
                              content: s.content,
                            });
                          }}
                        >
                          补做三问 →
                        </button>
                      )}
                      <span className="flex items-center gap-1 text-[0.78rem] text-[#a88a63]">
                        {open ? "收起" : "展开"}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="none"
                          style={{
                            transform: open ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s ease",
                          }}
                        >
                          <path
                            d="M3 6l5 5 5-5"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* 展开完整记录 */}
                  {open && (
                    <div
                      className="mt-4 border-t border-[rgba(90,61,43,0.14)] pt-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {detailLoading && (
                        <p className="py-4 text-center text-[0.85rem] text-[#9a8b78]">
                          正在展开……
                        </p>
                      )}

                      {!detailLoading && detail && (
                        <div className="space-y-4 text-[0.95rem] leading-relaxed">
                          <div>
                            <p className="detail-label">原始日记</p>
                            {editingId === detail.id ? (
                              <textarea
                                className="mt-1 w-full rounded-lg border border-[rgba(90,61,43,0.22)] bg-[#fffdf6] p-3 text-[0.95rem] leading-relaxed text-[#3b3028]"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={4}
                              />
                            ) : (
                              <p className="history-note-body mt-1 whitespace-pre-wrap text-[#3b3028]">
                                {detail.content}
                              </p>
                            )}
                          </div>

                          {editingId === detail.id && (
                            <div>
                              <p className="detail-label">改情绪</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {EMOTIONS.map((e) => (
                                  <button
                                    key={e.key}
                                    type="button"
                                    className={`draft-emotion-chip ${
                                      e.key === editEmotion ? "active" : ""
                                    }`}
                                    style={{
                                      borderColor:
                                        e.key === editEmotion
                                          ? e.color
                                          : undefined,
                                    }}
                                    onClick={() => setEditEmotion(e.key)}
                                  >
                                    <span
                                      className="draft-emotion-chip-dot"
                                      style={{ background: e.color }}
                                    />
                                    {e.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {detail.ai_response && (
                            <div>
                              <p className="detail-label">AI 共情</p>
                              <p className="mt-1.5 rounded-lg border-l-[3px] border-[#67944b] bg-[rgba(103,148,75,0.07)] px-3 py-2 text-[#4a4634]">
                                {detail.ai_response}
                              </p>
                            </div>
                          )}

                          {detail.lesson && (
                            <div>
                              <p className="detail-label">我学到了什么</p>
                              <p className="mt-1 text-[#3b3028]">
                                {detail.lesson}
                              </p>
                            </div>
                          )}

                          {detail.next_action && (
                            <div>
                              <p className="detail-label">下次怎么办</p>
                              <p className="mt-1 text-[#3b3028]">
                                {detail.next_action}
                              </p>
                            </div>
                          )}

                          {detail.growth_evidence && (
                            <div>
                              <p className="detail-label">
                                我比以前强在哪里
                              </p>
                              <p className="mt-1 text-[#3b3028]">
                                {detail.growth_evidence}
                              </p>
                            </div>
                          )}

                          {detail.growth_insight && (
                            <div>
                              <p className="detail-label">AI 发现</p>
                              <p className="mt-1 text-[#3b3028]">
                                {detail.growth_insight}
                              </p>
                            </div>
                          )}

                          {detail.growth_area && (
                            <div className="flex items-center gap-2">
                              <span className="detail-label">正在形成的能力</span>
                              <span className="gprof-chip">🧬 {detail.growth_area}</span>
                            </div>
                          )}

                          <div className="border-t border-[rgba(90,61,43,0.12)] pt-3">
                            <p className="detail-label mb-2">四个指数</p>
                            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-[0.95rem] text-[#3b3028]">
                              <span>
                                🌱 韧性{" "}
                                <b className="text-[#67944b]">
                                  {detail.resilience_score}
                                </b>
                              </span>
                              <span>
                                🪞 自省{" "}
                                <b className="text-[#67944b]">
                                  {detail.reflection_score ?? "—"}
                                </b>
                              </span>
                              <span>
                                ⚡ 行动{" "}
                                <b className="text-[#67944b]">
                                  {detail.action_score ?? "—"}
                                </b>
                              </span>
                              <span>
                                🌿 成长{" "}
                                <b className="text-[#67944b]">
                                  {detail.growth_score ?? "—"}
                                </b>
                              </span>
                            </div>

                            {/* 评分来源 + 理由（规则估算值 / AI 打分） */}
                            {detail.score_reasons && (
                              <details className="mt-2 rounded-lg border border-[rgba(90,61,43,0.12)] bg-[#fffdf6] px-3 py-2">
                                <summary className="cursor-pointer text-[0.8rem] font-semibold text-[#8a7156]">
                                  {detail.score_source === "rule"
                                    ? "⚠️ 这是规则估算值 · 为什么是这个分？"
                                    : "✨ AI 打分 · 为什么是这个分？"}
                                </summary>
                                <ul className="mt-2 space-y-1.5 text-[0.85rem] leading-relaxed text-[#5a4030]">
                                  <li>🌱 韧性：{detail.score_reasons.resilience}</li>
                                  <li>🪞 自省：{detail.score_reasons.reflection}</li>
                                  <li>⚡ 行动：{detail.score_reasons.action}</li>
                                  <li>🌿 成长：{detail.score_reasons.growth}</li>
                                </ul>
                              </details>
                            )}
                          </div>

                          {/* 编辑 / 删除 / 恢复 */}
                          <div className="flex items-center gap-3 border-t border-[rgba(90,61,43,0.12)] pt-3">
                            {view === "trash" ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-save"
                                  onClick={() => handleRestore(detail.id)}
                                >
                                  恢复
                                </button>
                                <button
                                  type="button"
                                  className="delete-cta"
                                  onClick={() => handlePermanentDelete(detail.id)}
                                >
                                  彻底删除
                                </button>
                              </>
                            ) : editingId === detail.id ? (
                              <>
                                <button
                                  type="button"
                                  className="btn-save"
                                  onClick={saveEdit}
                                >
                                  保存修改
                                </button>
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  onClick={cancelEdit}
                                >
                                  取消
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn-ghost"
                                  onClick={() => startEdit(detail)}
                                >
                                  编辑
                                </button>
                                <button
                                  type="button"
                                  className="delete-cta"
                                  onClick={() => handleDelete(detail.id)}
                                >
                                  删除
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {!detailLoading && !detail && (
                        <p className="py-4 text-center text-[0.85rem] text-[#9a8b78]">
                          这条记录找不到了
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
        </div>

        {hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              className="glass-pill"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "翻找中……" : "再翻几页"}
            </button>
          </div>
        )}
      </section>
      </div>

      <p className="core-copy night-copy rounded-2xl border border-white/16 bg-[rgba(23,18,34,0.42)] px-5 py-4 shadow-[0_12px_32px_rgba(0,0,0,0.2)] backdrop-blur-md">
        你没有变得不会受伤。
        <br />
        只是下一次遇到类似的事情，你可能已经知道怎么面对了。
      </p>
      </div>
      </main>

      {/* 补做三问 */}
      {reflectionFor && (
        <ReflectionFlow
          emotion={reflectionFor.emotion}
          content={reflectionFor.content}
          historyEmotions={summaries
            .filter((s) => s.id !== reflectionFor.id)
            .map((s) => s.emotion)}
          onSave={handleSaveReflection}
          onClose={() => setReflectionFor(null)}
        />
      )}

      {/* 软删除确认（进回收站） */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="删除这条记录？"
        message="删除后会移入回收站，30 天内可以随时恢复。"
        confirmText="删除"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* 彻底删除确认（不可恢复） */}
      <ConfirmDialog
        open={confirmPermanentId !== null}
        title="彻底删除？"
        message="彻底删除后无法恢复，确定要永久删除这条记录吗？"
        confirmText="彻底删除"
        danger
        onConfirm={confirmPermanent}
        onCancel={() => setConfirmPermanentId(null)}
      />
    </>
  );
}
