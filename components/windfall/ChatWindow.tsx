"use client";

import { saveChat, sendChatMessage, summarizeChat } from "@/lib/api";
import { buildLocalSummary } from "@/lib/localSummary";
import type { ChatMessage, ChatSummaryResponse } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

interface ChatWindowProps {
  /** 用户在打字机纸条上写的「今天发生了什么」，作为聊天背景 */
  context?: string;
  /** 递增信号：用户点「去聊聊」时触发 AI 主动开场 */
  startSignal?: number;
  onSummary: (summary: ChatSummaryResponse) => void;
}

const WELCOME = "今天过得怎么样？想到什么就说什么，我在这儿听。";
const STORAGE_KEY = "renya-chat-messages";

/** 从 sessionStorage 恢复聊天（刷新不丢；关标签页即清空） */
function loadSavedMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * 聊天窗口：取代「打字机 + 树洞」。
 * AI 前期是被动的「心理咨询师」式倾听，用户愿意说时才慢慢深入。
 * 聊多久都行，随时点「聊完了，帮我整理」。
 */
export default function ChatWindow({
  context,
  startSignal,
  onSummary,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadSavedMessages();
    return saved.length > 0 ? saved : [{ role: "assistant", content: WELCOME }];
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // 持久化聊天：刷新不丢
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  // 用户点「去聊聊」时，把打字机写的内容作为对话的第一句展示，
  // 再让 AI 基于它主动接话。这样「写的内容」真正成为聊天的一部分。
  useEffect(() => {
    if (!startSignal || startSignal === 0) return;
    if (!context?.trim()) return;
    let alive = true;
    setSending(true);
    setError(false);
    // 先把纸条内容作为对话第一句（用户自己说的那句话）
    setMessages([{ role: "user", content: context.trim() }]);
    sendChatMessage({ messages: [], context, opening: true })
      .then((r) => {
        if (!alive) return;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: r.reply },
        ]);
      })
      .catch(() => {
        if (!alive) return;
        setError(true);
      })
      .finally(() => {
        if (alive) setSending(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSignal]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || summarizing) return;
    setInput("");
    setError(false);
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setSending(true);
    try {
      const r = await sendChatMessage({ messages: next, context });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: r.reply },
      ]);
    } catch {
      setError(true);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "……好像断了一下。你可以再慢慢说，我还在听。" },
      ]);
    } finally {
      setSending(false);
    }
  };

  const finish = async () => {
    if (summarizing) return;
    setSummarizing(true);
    setError(false);
    let summary: ChatSummaryResponse;
    try {
      summary = await summarizeChat({ messages, context });
    } catch {
      // AI 不可用：降级到本地规则归纳，仍走「确认卡」流程，不中断用户
      summary = buildLocalSummary(context, messages);
    }
    // 保存这段聊天到「聊天内容回溯」（同一段只存一次，失败不影响主流程）
    if (!savedRef.current && hasUserMsg) {
      savedRef.current = true;
      saveChat({
        messages,
        context,
        emotion: summary.emotion,
        content: summary.content,
      }).catch(() => {});
    }
    onSummary(summary);
    setSummarizing(false);
  };

  const hasUserMsg = messages.some((m) => m.role === "user");

  return (
    <div className="chat">
      <div className="chat-scroll" ref={scrollRef}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat-row ${m.role === "user" ? "user" : "ai"}`}
          >
            {m.role === "assistant" && (
              <span className="chat-avatar" aria-hidden>
                🌱
              </span>
            )}
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="chat-row ai">
            <span className="chat-avatar" aria-hidden>
              🌱
            </span>
            <div className="chat-bubble chat-typing">正在听……</div>
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="想说点什么……"
          disabled={sending || summarizing}
        />
        <button
          type="button"
          className="chat-send"
          onClick={send}
          disabled={sending || summarizing || !input.trim()}
        >
          发送
        </button>
      </div>

      {hasUserMsg && (
        <button
          type="button"
          className="chat-finish"
          onClick={finish}
          disabled={summarizing}
        >
          {summarizing ? "正在整理……" : "聊完了，帮我整理"}
        </button>
      )}

      {error && (
        <p className="chat-error">
          AI 暂时连不上。你可以稍后重试，或直接点「聊完了，帮我整理」——我会用简单方式帮你保存。
        </p>
      )}
    </div>
  );
}
