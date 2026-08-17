"use client";

import ConfirmDialog from "@/components/windfall/ConfirmDialog";
import EmotionStrip from "@/components/windfall/EmotionStrip";
import GrowthChart from "@/components/windfall/GrowthChart";
import GrowthProfileView from "@/components/windfall/GrowthProfile";
import ReflectionFlow, {
  type ReflectionAnswers,
} from "@/components/windfall/ReflectionFlow";
import {
  deleteDiary,
  getDiary,
  getEmotions,
  getGrowth,
  getGrowthProfile,
  listDiary,
  restoreDiary,
  updateDiary,
} from "@/lib/api";
import { EMOTIONS, getEmotion } from "@/lib/emotions";
import type {
  DiaryEntry,
  DiarySummary,
  EmotionKey,
  EmotionPoint,
  GrowthPoint,
  GrowthProfile,
} from "@/lib/types";
import Link from "next/link";
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

  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [emotions, setEmotions] = useState<EmotionPoint[]>([]);
  const [profile, setProfile] = useState<GrowthProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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

  // 画像 / 折线 / 色带（仅加载一次）
  useEffect(() => {
    getGrowth()
      .then((r) => setGrowth(r.items))
      .catch(() => {});
    getEmotions()
      .then((r) => setEmotions(r.items))
      .catch(() => {});
    getGrowthProfile()
      .then((r) => setProfile(r))
      .catch(() => {})
      .finally(() => setProfileLoading(false));
  }, []);

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

  // 删除/恢复后刷新画像、折线、色带
  const refreshInsights = () => {
    getGrowth().then((r) => setGrowth(r.items)).catch(() => {});
    getEmotions().then((r) => setEmotions(r.items)).catch(() => {});
    getGrowthProfile().then((r) => setProfile(r)).catch(() => {});
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
      refreshInsights();
    } catch {
      /* 静默 */
    }
  };

  // 从回收站恢复
  const handleRestore = async (id: string) => {
    try {
      await restoreDiary(id);
      setSummaries((prev) => prev.filter((s) => s.id !== id));
      refreshInsights();
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
      refreshInsights();
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
      getGrowth().then((r) => setGrowth(r.items)).catch(() => {});
      getEmotions().then((r) => setEmotions(r.items)).catch(() => {});
    } catch {
      /* 静默 */
    }
  };

  return (
    <>
      <main className="mx-auto h-[100dvh] max-w-3xl overflow-y-auto bg-[#f1e8d4] px-5 pb-20 pt-10">
      {/* 顶部 */}
      <header>
        <p className="eyebrow">RESILIENCE SPROUT</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-bold leading-snug text-[#3b3028] sm:text-[1.7rem]">
            翻开过去保存下来的自己，
            <br className="sm:hidden" />
            看看你什么时候开始变得不一样。
          </h1>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(90,61,43,0.24)] px-4 py-2 text-[0.9rem] font-semibold text-[#6b5d4f] transition-colors hover:bg-[rgba(90,61,43,0.06)]"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            回到首页
          </Link>
        </div>
      </header>

      {/* 我的韧性画像：AI 总结的变化（顶部） */}
      <GrowthProfileView profile={profile} loading={profileLoading} />

      {/* 我的变化：韧性折线 + 情绪色带（辅助，非 Dashboard） */}
      <section className="mt-14">
        <h2 className="section-title">我的变化</h2>

        <p className="mt-3 text-[0.95rem] leading-relaxed text-[#5a4030]">
          韧性不是不再受伤，而是受伤之后越来越知道怎么面对。
        </p>

        <div className="paper-card mt-5 rounded-xl p-5 sm:p-6">
          <p className="text-[0.82rem] font-semibold text-[#8a7156]">
            韧性变化
          </p>
          <div className="mt-2">
            <GrowthChart items={growth} />
          </div>
        </div>

        <div className="paper-card mt-5 rounded-xl p-5 sm:p-6">
          <p className="text-[0.82rem] font-semibold text-[#8a7156]">
            最近 30 天的情绪
          </p>
          <div className="mt-3">
            <EmotionStrip items={emotions} />
          </div>
        </div>
      </section>

      {/* 过往记录：纸堆（保留原有交互） */}
      <section className="mt-14">
        <div className="flex items-center justify-between gap-4">
          <h2 className="section-title">过往记录</h2>
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-[rgba(90,61,43,0.18)] p-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-[0.82rem] font-semibold transition-colors ${
                view === "normal"
                  ? "bg-[rgba(103,148,75,0.16)] text-[#4d7436]"
                  : "text-[#8a7156] hover:bg-[rgba(90,61,43,0.06)]"
              }`}
              onClick={() => setView("normal")}
            >
              记录
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-[0.82rem] font-semibold transition-colors ${
                view === "trash"
                  ? "bg-[rgba(103,148,75,0.16)] text-[#4d7436]"
                  : "text-[#8a7156] hover:bg-[rgba(90,61,43,0.06)]"
              }`}
              onClick={() => setView("trash")}
            >
              回收站
            </button>
          </div>
        </div>

        {/* 搜索 / 筛选 / 导出 */}
        <div className="filter-bar">
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

        <div className="mt-6 space-y-5">
          {loading && (
            <p className="text-center text-[0.9rem] text-[#9a8b78]">
              正在翻找这些纸张……
            </p>
          )}

          {!loading && summaries.length === 0 && (
            <div className="paper-card rounded-xl p-10 text-center text-[#9a8b78]">
              {q || emotionFilter
                ? "没有找到匹配的记录"
                : "这里还很安静，写下第一篇记录吧"}
            </div>
          )}

          {!loading &&
            summaries.map((s, i) => {
              const emo = getEmotion(s.emotion);
              const open = expandedId === s.id;
              const tilt = open ? 0 : i % 2 === 0 ? -0.6 : 0.55;
              return (
                <article
                  key={s.id}
                  className="paper-card rise-in cursor-pointer rounded-xl p-5 transition-transform duration-300"
                  style={{ transform: `rotate(${tilt}deg)` }}
                  onClick={() => toggleExpand(s.id)}
                >
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

                  <p className="mt-2.5 line-clamp-2 text-[1rem] leading-relaxed text-[#3b3028]">
                    {s.content}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[0.8rem] text-[#8a7156]">
                      {s.has_reflection
                        ? `韧性 ${s.resilience_score}`
                        : "还没复盘"}
                    </span>
                    <div className="flex items-center gap-3">
                      {!s.has_reflection && (
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
                              <p className="mt-1 whitespace-pre-wrap text-[#3b3028]">
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
              className="btn-ghost"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "翻找中……" : "再翻几页"}
            </button>
          </div>
        )}
      </section>

      {/* 核心文案 */}
      <p className="core-copy">
        你没有变得不会受伤。
        <br />
        只是下一次遇到类似的事情，你可能已经知道怎么面对了。
      </p>
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
